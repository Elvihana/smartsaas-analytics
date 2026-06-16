import numpy as np
import pandas as pd
import joblib
import os
import sys

from schemas.prediction_schema import PredictChurnRequest, PredictChurnResponse, ShapValueDetail

# ─── Path Configuration (from centralized config) ────────────────────
from config import MODEL_PATH, PREPROCESS_PATH, SHAP_EXPLAINER_PATH

# ─── Global cache ─────────────────────────────────────────────────────
_model = None
_preprocess = None
_shap_data = None
_default_features = None
_feature_cols = None


def _load_models():
    """Load model, preprocessor, and SHAP explainer once (cached)."""
    global _model, _preprocess, _shap_data, _default_features, _feature_cols

    if _model is not None:
        return

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model tidak ditemukan: {MODEL_PATH}")
    if not os.path.exists(PREPROCESS_PATH):
        raise FileNotFoundError(f"Preprocessor tidak ditemukan: {PREPROCESS_PATH}")
    if not os.path.exists(SHAP_EXPLAINER_PATH):
        raise FileNotFoundError(f"SHAP explainer tidak ditemukan: {SHAP_EXPLAINER_PATH}")

    _model = joblib.load(MODEL_PATH)
    _preprocess = joblib.load(PREPROCESS_PATH)
    _shap_data = joblib.load(SHAP_EXPLAINER_PATH)

    _feature_cols = _preprocess["feature_cols"]

    # Build default feature vector from SHAP sample medians
    X_sample = _shap_data["X_sample"]
    _default_features = X_sample.median().to_dict()

    print(f"[PredictionService] Model loaded. Features: {len(_feature_cols)}")
    print(f"[PredictionService] SHAP explainer loaded. Sample size: {len(X_sample)}")


def _build_feature_vector(req: PredictChurnRequest) -> pd.DataFrame:
    """
    Build a full 48-feature vector from the 5 input fields.
    Features that can be derived are computed;
    others are filled with median defaults from the training data.
    """
    _load_models()

    # Start from defaults
    feat = dict(_default_features)

    # ── Mapped / derived features ──────────────────────────────────
    # company_size → company_size_log
    feat["company_size_log"] = np.log1p(max(req.company_size, 0))

    # login_frequency → avg_login_count, total_login_count, max_login_count
    feat["avg_login_count"] = max(req.login_frequency, 0)
    feat["total_login_count"] = max(req.login_frequency * 30, 0)  # approx monthly
    feat["max_login_count"] = max(req.login_frequency, 0)

    # days_since_last_activity → days_since_last_active
    feat["days_since_last_active"] = max(req.days_since_last_activity, 0)

    # support_ticket_count → ticket_count + derived ratios
    feat["ticket_count"] = max(req.support_ticket_count, 0)
    feat["open_tickets"] = max(req.support_ticket_count * 0.3, 0)
    feat["closed_tickets"] = max(req.support_ticket_count * 0.7, 0)
    feat["high_priority"] = max(req.support_ticket_count * 0.2, 0)
    feat["urgent_priority"] = max(req.support_ticket_count * 0.05, 0)
    feat["tech_issues"] = max(req.support_ticket_count * 0.4, 0)
    feat["billing_issues"] = max(req.support_ticket_count * 0.25, 0)
    tc = max(req.support_ticket_count, 0)
    feat["high_priority_ratio"] = feat["high_priority"] / (tc + 1)
    feat["tech_issue_ratio"] = feat["tech_issues"] / (tc + 1)
    feat["billing_issue_ratio"] = feat["billing_issues"] / (tc + 1)
    feat["has_open_tickets"] = 1 if feat["open_tickets"] > 0 else 0

    # subscription_length → subscription_length_days
    feat["subscription_length_days"] = max(req.subscription_length, 0)

    # ── Build DataFrame in correct column order ────────────────────
    df = pd.DataFrame([feat])[_feature_cols]

    # Scale
    scaler = _preprocess["scaler"]
    X_scaled = scaler.transform(df)

    return pd.DataFrame(X_scaled, columns=_feature_cols)


def _get_recommendation(risk_pct: float, shap_details: list) -> str:
    """Generate a human-readable recommendation based on prediction + SHAP."""
    parts = []

    if risk_pct >= 70:
        parts.append("Risiko churn sangat tinggi. Segera lakukan tindakan retensi darurat.")
    elif risk_pct >= 40:
        parts.append("Risiko churn sedang. Pertimbangkan program retensi proaktif.")
    else:
        parts.append("Risiko churn rendah. Pertahankan kualitas layanan.")

    # Top-3 negative SHAP drivers (features pushing toward churn)
    negative = [s for s in shap_details if s.impact == "negative"]
    negative.sort(key=lambda x: abs(x.shap_value), reverse=True)
    top_neg = negative[:3]

    if top_neg:
        parts.append("Faktor utama yang meningkatkan risiko churn:")
        for s in top_neg:
            label_map = {
                "days_since_last_active": "Hari sejak terakhir aktif",
                "ticket_count": "Jumlah tiket support",
                "avg_login_count": "Frekuensi login",
                "company_size_log": "Ukuran perusahaan",
                "subscription_length_days": "Durasi langganan",
                "open_tickets": "Tiket yang masih terbuka",
                "high_priority_ratio": "Rasio tiket prioritas tinggi",
            }
            feature_label = label_map.get(s.feature, s.feature.replace("_", " ").title())
            parts.append(f"  • {feature_label} ({s.value:.1f}) — berkontribusi {abs(s.shap_value):.4f} terhadap risiko.")

    return "\n".join(parts)


def predict_churn(req: PredictChurnRequest) -> PredictChurnResponse:
    """Main prediction endpoint logic."""
    _load_models()

    # Build feature vector
    X_scaled = _build_feature_vector(req)

    # Predict
    pipeline = _model
    y_prob = pipeline.predict_proba(X_scaled)[0, 1]
    y_pred = pipeline.predict(X_scaled)[0]

    risk_percentage = round(float(y_prob) * 100, 2)
    prediction = "Churn" if y_pred == 1 else "Tidak Churn"

    # ── SHAP values ────────────────────────────────────────────────
    explainer = _shap_data["explainer"]
    shap_values = explainer.shap_values(X_scaled)

    shap_details = []
    for i, col in enumerate(_feature_cols):
        raw_val = X_scaled.iloc[0, i]
        sv = float(shap_values[0, i])
        impact = "positive" if sv > 0 else "negative"
        shap_details.append(ShapValueDetail(
            feature=col,
            value=round(raw_val, 4),
            shap_value=round(sv, 6),
            impact=impact,
        ))

    # Sort by absolute SHAP value (most important first)
    shap_details.sort(key=lambda x: abs(x.shap_value), reverse=True)

    recommendation = _get_recommendation(risk_percentage, shap_details)

    return PredictChurnResponse(
        risk_percentage=risk_percentage,
        prediction=prediction,
        recommendation=recommendation,
        shap_values=shap_details,
    )