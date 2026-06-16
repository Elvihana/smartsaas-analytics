from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas.customer_schema import CustomerOut, CustomerDetailOut, CustomerListResponse
from services.customer_service import CustomerService

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by company name, contact name, or email"),
    status: Optional[str] = Query(None, description="Filter by customer status"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
):
    """
    Get paginated list of customers with optional filtering and sorting.
    """
    result = CustomerService.get_customers(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        industry=industry,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return result


@router.get("/stats", response_model=dict)
def get_customer_stats():
    """
    Get customer statistics grouped by status.
    """
    return CustomerService.get_customer_stats()


@router.get("/industries", response_model=list[dict])
def get_industry_distribution():
    """
    Get customer distribution by industry.
    """
    return CustomerService.get_industry_distribution()


@router.get("/{customer_id}", response_model=CustomerDetailOut)
def get_customer_detail(customer_id: str):
    """
    Get detailed customer information by ID, including subscription and churn prediction.
    """
    customer = CustomerService.get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(
            status_code=404,
            detail=f"Customer with ID {customer_id} not found",
        )
    return customer