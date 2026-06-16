from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class PredictChurnRequest(BaseModel):
    company_size: float = Field(..., description="Jumlah karyawan / skala perusahaan")
    login_frequency: float = Field(..., description="Rata-rata frekuensi login per periode")
    days_since_last_activity: float = Field(..., description="Hari sejak terakhir aktif")
    support_ticket_count: float = Field(..., description="Jumlah tiket support yang pernah dibuat")
    subscription_length: float = Field(..., description="Durasi langganan dalam hari")


class ShapValueDetail(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: str  # positive / negative


class PredictChurnResponse(BaseModel):
    risk_percentage: float
    prediction: str  # "Churn" or "Tidak Churn"
    recommendation: str
    shap_values: List[ShapValueDetail]