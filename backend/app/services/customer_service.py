from typing import Optional
from database import supabase


import re
from postgrest.exceptions import APIError


class CustomerService:

    @staticmethod
    def get_customers(
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        industry: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> dict:
        """
        Get paginated list of customers with optional filtering.
        """
        query = supabase.table("customers").select("*", count="exact")

        # Apply filters
        if status:
            query = query.eq("status", status)

        if industry:
            query = query.eq("industry", industry)

        if search:
            query = query.or_(
                f"company_name.ilike.%{search}%,"
                f"contact_name.ilike.%{search}%,"
                f"email.ilike.%{search}%"
            )

        # Apply sorting
        query = query.order(sort_by, desc=(sort_order == "desc"))

        # Apply pagination
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

    @staticmethod
    def get_customer_by_id(customer_id: str) -> Optional[dict]:
        """
        Get a single customer by ID, including subscription info.
        """
        # Validate UUID format
        uuid_pattern = re.compile(
            r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            re.IGNORECASE,
        )
        if not uuid_pattern.match(customer_id):
            return None

        try:
            # Get customer
            response = (
                supabase.table("customers")
                .select("*")
                .eq("id", customer_id)
                .limit(1)
                .execute()
            )

            if not response.data:
                return None

            customer = response.data[0]

            # Get subscription
            sub_response = (
                supabase.table("subscriptions")
                .select("*")
                .eq("customer_id", customer_id)
                .limit(1)
                .execute()
            )

            if sub_response.data:
                customer["subscription"] = sub_response.data[0]
            else:
                customer["subscription"] = None

            return customer

        except APIError:
            return None

    @staticmethod
    def get_customer_stats() -> dict:
        """
        Get customer statistics grouped by status.
        """
        response = (
            supabase.table("customers")
            .select("status", count="exact")
            .execute()
        )

        # Count manually since Supabase doesn't support GROUP BY directly
        status_counts = {}
        for row in response.data:
            status = row["status"]
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            "total": len(response.data),
            "by_status": [
                {"status": k, "count": v} for k, v in status_counts.items()
            ],
        }

    @staticmethod
    def get_industry_distribution() -> list[dict]:
        """
        Get customer distribution by industry.
        """
        response = (
            supabase.table("customers")
            .select("industry")
            .execute()
        )

        industry_counts = {}
        for row in response.data:
            industry = row["industry"] or "Unknown"
            industry_counts[industry] = industry_counts.get(industry, 0) + 1

        return [
            {"industry": k, "count": v}
            for k, v in sorted(industry_counts.items(), key=lambda x: x[1], reverse=True)
        ]