"""
Recommendation Service - Generates retention recommendations based on churn prediction
"""


def generate_recommendation(risk_percentage: float, top_risk_factors: list = None) -> str:
    """
    Generate human-readable retention recommendation.

    Args:
        risk_percentage: Predicted churn risk (0-100)
        top_risk_factors: List of dicts with 'feature' and 'shap_value' keys

    Returns:
        str: Formatted recommendation text
    """
    parts = []

    # Risk level
    if risk_percentage >= 70:
        parts.append("⚠️ Risiko churn sangat tinggi. Segera lakukan tindakan retensi darurat.")
    elif risk_percentage >= 40:
        parts.append("⚠️ Risiko churn sedang. Pertimbangkan program retensi proaktif.")
    else:
        parts.append("✅ Risiko churn rendah. Pertahankan kualitas layanan.")

    # Specific recommendations based on features
    if top_risk_factors:
        parts.append("")
        parts.append("Rekomendasi spesifik:")

        feature_map = {
            "days_since_last_active": {
                "label": "Hari sejak terakhir aktif",
                "advice": "Kirim email re-engagement atau notifikasi push untuk menarik kembali pelanggan."
            },
            "ticket_count": {
                "label": "Jumlah tiket support",
                "advice": "Evaluasi kualitas produk/layanan dan tingkatkan first-contact resolution rate."
            },
            "avg_login_count": {
                "label": "Frekuensi login",
                "advice": "Tingkatkan engagement dengan fitur baru, konten eksklusif, atau gamifikasi."
            },
            "company_size_log": {
                "label": "Ukuran perusahaan",
                "advice": "Sesuaikan harga atau tawarkan paket khusus untuk perusahaan kecil."
            },
            "subscription_length_days": {
                "label": "Durasi langganan",
                "advice": "Tawarkan diskon loyalitas atau program rewards untuk pelanggan baru."
            },
            "open_tickets": {
                "label": "Tiket yang masih terbuka",
                "advice": "Prioritaskan penyelesaian tiket terbuka untuk mengurangi frustrasi pelanggan."
            },
            "high_priority_ratio": {
                "label": "Rasio tiket prioritas tinggi",
                "advice": "Investasi dalam stabilitas sistem dan pengujian kualitas untuk mengurangi masalah kritis."
            },
        }

        for factor in top_risk_factors[:3]:
            feat = factor.get("feature", "")
            info = feature_map.get(feat, {
                "label": feat.replace("_", " ").title(),
                "advice": f"Tinjau dan optimalkan {feat.replace('_', ' ')}."
            })
            parts.append(f"  • {info['label']}: {info['advice']}")

    return "\n".join(parts)


def get_sample_presets() -> dict:
    """
    Get preset example data for the predictor form.
    """
    return {
        "low-risk": {
            "company_size": 200,
            "login_frequency": 25,
            "days_since_last_activity": 2,
            "support_ticket_count": 1,
            "subscription_length": 720
        },
        "medium-risk": {
            "company_size": 50,
            "login_frequency": 8,
            "days_since_last_activity": 14,
            "support_ticket_count": 3,
            "subscription_length": 180
        },
        "high-risk": {
            "company_size": 10,
            "login_frequency": 2,
            "days_since_last_activity": 45,
            "support_ticket_count": 8,
            "subscription_length": 30
        }
    }