from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubscriptionOut(BaseModel):
    id: str
    customer_id: str
    plan_name: str
    monthly_price: float
    start_date: str
    renewal_date: str
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: str
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    company_size: Optional[int] = None
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerDetailOut(CustomerOut):
    subscription: Optional[SubscriptionOut] = None
    churn_prediction: Optional[dict] = None


class CustomerListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[CustomerOut]


class CustomerStatusCount(BaseModel):
    status: str
    count: int