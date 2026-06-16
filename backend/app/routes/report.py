from fastapi import APIRouter, Query
from database import supabase
from collections import defaultdict

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/churn-summary")
def get_churn_summary():
    """Churn statistics from customers table."""
    response = supabase.table("customers").select("status").execute()
    customers = response.data or []
    total = len(customers)
    active = sum(1 for c in customers if c.get("status", "").lower() == "active")
    inactive = total - active
    return {
        "total_customers": total,
        "active_customers": active,
        "inactive_customers": inactive,
        "churn_rate": round((inactive / total * 100), 2) if total > 0 else 0,
    }


@router.get("/revenue")
def get_revenue_report(period: str = Query("monthly", pattern="^(monthly|yearly)$")):
    """Revenue from active subscriptions."""
    response = supabase.table("subscriptions").select("plan_name, monthly_price, status").execute()
    subscriptions = response.data or []
    active_subs = [s for s in subscriptions if s.get("status", "").lower() == "active"]
    total_revenue = sum(float(s.get("monthly_price") or 0) for s in active_subs)

    plan_revenue: dict[str, float] = defaultdict(float)
    for s in active_subs:
        plan_revenue[s.get("plan_name") or "Unknown"] += float(s.get("monthly_price") or 0)

    return {
        "total_revenue": round(total_revenue, 2),
        "active_subscriptions": len(active_subs),
        "period": period,
        "by_plan": [
            {"plan": k, "revenue": round(v, 2)}
            for k, v in sorted(plan_revenue.items(), key=lambda x: x[1], reverse=True)
        ],
    }


@router.get("/industry")
def get_industry_report():
    """Customer distribution by industry."""
    response = supabase.table("customers").select("industry").execute()
    counts: dict[str, int] = defaultdict(int)
    for row in response.data or []:
        counts[row.get("industry") or "Unknown"] += 1
    total = sum(counts.values())
    return {
        "total": total,
        "industries": [
            {"industry": k, "count": v, "percentage": round(v / total * 100, 1) if total > 0 else 0}
            for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)
        ],
    }


@router.get("/plan-distribution")
def get_plan_distribution():
    """Active subscription count by plan."""
    response = supabase.table("subscriptions").select("plan_name, status").execute()
    counts: dict[str, int] = defaultdict(int)
    for s in response.data or []:
        if s.get("status", "").lower() == "active":
            counts[s.get("plan_name") or "Unknown"] += 1
    total = sum(counts.values())
    return {
        "total": total,
        "plans": [
            {"plan": k, "count": v, "percentage": round(v / total * 100, 1) if total > 0 else 0}
            for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)
        ],
    }


@router.get("/support-tickets")
def get_support_tickets_report():
    """Support ticket statistics."""
    response = supabase.table("support_tickets").select("status, priority, category").execute()
    tickets = response.data or []
    total = len(tickets)
    open_tickets = sum(1 for t in tickets if t.get("status", "").lower() == "open")

    priority_counts: dict[str, int] = defaultdict(int)
    for t in tickets:
        priority_counts[t.get("priority") or "unknown"] += 1

    return {
        "total": total,
        "open": open_tickets,
        "closed": total - open_tickets,
        "by_priority": [
            {"priority": k, "count": v}
            for k, v in sorted(priority_counts.items(), key=lambda x: x[1], reverse=True)
        ],
    }
