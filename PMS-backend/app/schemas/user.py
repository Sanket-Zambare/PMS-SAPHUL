from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models.user import UserStatus

class UserBase(BaseModel):
    name: str
    email: EmailStr
    job_title: Optional[str] = None
    department: Optional[str] = None
    status: Optional[UserStatus] = UserStatus.ACTIVE

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    status: Optional[UserStatus] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    roles: list[str] = []

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserWithRoles(UserResponse):
    roles: list[str] = []
    permissions: list[str] = []
