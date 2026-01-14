from pydantic import BaseModel
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str
    permissions: List[str] = []

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    permissions: List[str] = []
