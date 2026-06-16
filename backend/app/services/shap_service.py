"""
SHAP Service - Provides explainability analysis for churn predictions
"""
import numpy as np
import pandas as pd
import joblib
import os

# Path configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
SHAP_EXPLAINER_PATH = os.path.join(MODELS_DIR, "shap_explainer.pkl")

_shap_data = None


def get_shap_explainer():
    """Load and cache SHAP explainer."""
    global _shap_data
    if _shap_data is not None:
        return _shap_data
    if not os.path.exists(SHAP_EXPLAINER_PATH):
        raise FileNotFoundError(f"SHAP explainer not found: {SHAP_EXPLAINER_PATH}")
    _shap_data = joblib.load(SHAP_EXPLAINER_PATH)
    return _shap_data


def analyze_features(features_df: pd.DataFrame) -> list:
    """
    Analyze feature contributions using SHAP explainer.
    Returns list of feature importance dicts.
    """
    explainer_data = get_shap_explainer()
    explainer = explainer_data["explainer"]
    feature_cols = explainer_data.get("feature_cols", features_df.columns.tolist())

    # Ensure proper column order
    X = features_df[feature_cols] if hasattr(features_df, 'columns') else features_df

    shap_values = explainer.shap_values(X)

    results = []
    for i, col in enumerate(feature_cols):
        results.append({
            "feature": col,
            "shap_value": float(shap_values[0, i]),
            "impact": "positive" if shap_values[0, i] > 0 else "negative",
        })

    results.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return results