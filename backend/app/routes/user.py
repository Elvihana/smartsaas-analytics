from fastapi import APIRouter, HTTPException
from schemas.user_schema import UserOut
from database import supabase

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/profile", response_model=UserOut)
def get_user_profile():
    """
    Get current user profile from database.
    
    Returns the first user from users table.
    If no users exist, returns 404.
    """
    try:
        response = supabase.table("users").select("*").limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="No user found in database"
            )
        
        return UserOut(**response.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


@router.get("/profile-avatar")
def get_profile_avatar(name: str = "User"):
    """
    Generate avatar URL for user profile.
    Uses ui-avatars.com service for avatar generation.
    """
    if not name or name.strip() == "":
        name = "User"
    
    return {
        "name": name,
        "avatar_url": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=6C5CE7&color=fff&size=40"
    }
