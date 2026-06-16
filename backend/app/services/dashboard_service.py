from database import supabase
from collections import defaultdict


class DashboardService:

    @staticmethod
    def get_dashboard_data() -> dict:
        # --- Customers ---
        cust_resp = supabase.table("customers").select("status, industry, country, created_at").execute()
        customers = cust_resp.data or []

        total_customers = len(customers)
        active_customers = sum(1 for c in customers if c.get("status", "").lower() == "active")
        inactive_customers = total_customers - active_customers

        # --- Industry Distribution ---
        industry_counts: dict[str, int] = defaultdict(int)
        for c in customers:
            industry_counts[c.get("industry") or "Unknown"] += 1
        industry_distribution = [
            {"industry": k, "count": v}
            for k, v in sorted(industry_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # --- Country Distribution ---
        country_counts: dict[str, int] = defaultdict(int)
        for c in customers:
            country_counts[c.get("country") or "Unknown"] += 1
        country_distribution = [
            {"country": k, "count": v}
            for k, v in sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # --- Customer Growth (group by month from created_at) ---
        month_counts: dict[str, int] = defaultdict(int)
        for c in customers:
            created = c.get("created_at", "")
            if created and len(created) >= 7:
                month_key = created[:7]  # "YYYY-MM"
                month_counts[month_key] += 1

        sorted_months = sorted(month_counts.keys())[-12:]  # last 12 months
        customer_growth = {
            "labels": sorted_months,
            "data": [month_counts[m] for m in sorted_months],
        }

        # --- Subscriptions ---
        sub_resp = supabase.table("subscriptions").select("monthly_price, status, created_at, plan_name").execute()
        subscriptions = sub_resp.data or []

        # Count active subscriptions
        active_subscriptions = sum(1 for s in subscriptions if s.get("status", "").lower() == "active")

        # --- Revenue Data (from subscriptions, group by month) ---
        revenue_by_month: dict[str, float] = defaultdict(float)
        for s in subscriptions:
            if s.get("status", "").lower() != "active":
                continue
            created = s.get("created_at", "")
            if created and len(created) >= 7:
                month_key = created[:7]
                revenue_by_month[month_key] += float(s.get("monthly_price") or 0)

        sorted_rev_months = sorted(revenue_by_month.keys())[-12:]
        revenue_data = {
            "labels": sorted_rev_months,
            "data": [round(revenue_by_month[m], 2) for m in sorted_rev_months],
        }

        # --- Plan Distribution (from subscriptions) ---
        plan_counts: dict[str, int] = defaultdict(int)
        for s in subscriptions:
            if s.get("status", "").lower() == "active":
                plan_counts[s.get("plan_name") or "Unknown"] += 1
        plan_distribution = [
            {"plan": k, "count": v}
            for k, v in sorted(plan_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "total_customers": total_customers,
            "active_customers": active_customers,
            "inactive_customers": inactive_customers,
            "active_subscriptions": active_subscriptions,
            "industry_distribution": industry_distribution,
            "country_distribution": country_distribution,
            "customer_growth": customer_growth,
            "revenue_data": revenue_data,
            "plan_distribution": plan_distribution,
        }
