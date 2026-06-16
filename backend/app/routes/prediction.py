import json
from fastapi import APIRouter, HTTPException, Query
from schemas.prediction_schema import PredictChurnRequest, PredictChurnResponse
from services.prediction_service import predict_churn
from database import supabase

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post("/predict-churn", response_model=PredictChurnResponse)
def predict_churn_endpoint(req: PredictChurnRequest):
    """Predict churn using ML model, then save result to prediction_history."""
    try:
        result = predict_churn(req)

        # Persist to Supabase (best-effort — no error if table missing)
        try:
            supabase.table("prediction_history").insert({
                "company_size": req.company_size,
                "login_frequency": req.login_frequency,
                "days_since_last_activity": req.days_since_last_activity,
                "support_ticket_count": req.support_ticket_count,
                "subscription_length": req.subscription_length,
                "risk_percentage": result.risk_percentage,
                "prediction": result.prediction,
                "recommendation": result.recommendation,
                "shap_values": json.dumps([s.model_dump() for s in result.shap_values]),
            }).execute()
        except Exception:
            pass  # table may not exist yet

        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/prediction-history")
def get_prediction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get prediction history from Supabase."""
    start = (page - 1) * page_size
    end = start + page_size - 1
    response = (
        supabase.table("prediction_history")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )
    return {
        "total": response.count or 0,
        "page": page,
        "page_size": page_size,
        "data": response.data or [],
    }


@router.delete("/prediction-history/{record_id}")
def delete_prediction_history(record_id: str):
    """Delete a single prediction history record."""
    response = (
        supabase.table("prediction_history")
        .delete()
        .eq("id", record_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"deleted": True}
