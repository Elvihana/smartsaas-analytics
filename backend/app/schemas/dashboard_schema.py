from pydantic import BaseModel


class IndustryDistribution(BaseModel):
    industry: str
    count: int


class CountryDistribution(BaseModel):
    country: str
    count: int


class PlanDistribution(BaseModel):
    plan: str
    count: int


class ChartData(BaseModel):
    labels: list[str]
    data: list[float]


class DashboardResponse(BaseModel):
    total_customers: int
    active_customers: int
    inactive_customers: int
    active_subscriptions: int
    industry_distribution: list[IndustryDistribution]
    country_distribution: list[CountryDistribution]
    customer_growth: ChartData
    revenue_data: ChartData
    plan_distribution: list[PlanDistribution]
