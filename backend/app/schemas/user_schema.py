from pydantic import BaseModel
from typing import Optional


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True
