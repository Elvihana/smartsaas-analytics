from database import supabase

response = (
    supabase
    .table("customers")
    .select("*")
    .limit(5)
    .execute()
)

print(response.data)