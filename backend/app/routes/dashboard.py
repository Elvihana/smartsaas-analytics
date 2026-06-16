from fastapi import APIRouter
from schemas.dashboard_schema import DashboardResponse
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard():
    """Get all dashboard analytics data from Supabase."""
    return DashboardService.get_dashboard_data()
