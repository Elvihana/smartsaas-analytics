from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import supabase

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


@router.get("")
def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
):
    """Get retention campaigns list."""
    query = supabase.table("campaigns").select("*", count="exact")

    if status:
        query = query.eq("status", status)

    query = query.order("created_at", desc=True)

    start = (page - 1) * page_size
    end = start + page_size - 1
    query = query.range(start, end)

    response = query.execute()

    return {
        "total": response.count,
        "page": page,
        "page_size": page_size,
        "data": response.data,
    }


@router.get("/{campaign_id}")
def get_campaign_detail(campaign_id: str):
    """Get campaign detail by ID."""
    response = (
        supabase.table("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")

    return response.data[0]


@router.post("")
def create_campaign(payload: dict):
    """Create a new retention campaign."""
    response = supabase.table("campaigns").insert(payload).execute()
    return response.data[0] if response.data else None


@router.patch("/{campaign_id}")
def update_campaign(campaign_id: str, payload: dict):
    """Update campaign status or details."""
    response = (
        supabase.table("campaigns")
        .update(payload)
        .eq("id", campaign_id)
        .execute()
    )
    return response.data[0] if response.data else None