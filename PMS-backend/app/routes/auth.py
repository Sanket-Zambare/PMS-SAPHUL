from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr, validator
import secrets
import string
import logging
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_db,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.schemas.auth import Token
from app.schemas.user import UserResponse, UserLogin, UserCreate
from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.user_role import UserRole as UserRoleModel
from app.services.permission_service import get_user_permissions, get_user_roles
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

# In-memory token storage (use Redis in production)
password_reset_tokens = {}

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Public signup - creates user and assigns MEMBER role automatically.
    No role selection allowed. Only MEMBER role is assigned.
    """
    # Validate email format
    if "@" not in user_data.email or "." not in user_data.email.split("@")[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Validate password strength
    password = user_data.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    if not any(c.isupper() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    if not any(c.islower() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email,
        User.is_deleted == False
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use a different email or try logging in."
        )
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=get_password_hash(user_data.password),
        job_title=user_data.job_title,
        department=user_data.department,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Automatically assign MEMBER role only
    try:
        member_role = db.query(Role).filter(Role.name == "MEMBER").first()
        if member_role:
            user_role = UserRoleModel(
                user_id=user.id,
                role_id=member_role.id
            )
            db.add(user_role)
            db.commit()
    except Exception as e:
        print(f"Warning: Could not assign MEMBER role: {e}")
        db.rollback()

    # Send signup confirmation email (best-effort)
    try:
        email_service.send_signup_email(user.email, user.name)
    except Exception as e:
        print(f"Warning: Could not send signup confirmation email: {e}")

    return user

@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login - authenticates user and returns JWT with permissions.
    Checks if email exists and provides appropriate feedback.
    """
    # Validate email format
    if "@" not in user_credentials.email or "." not in user_credentials.email.split("@")[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Check if email exists (case-insensitive)
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(user_credentials.email),
        User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account with this email does not exist. Please sign up first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please check your password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact administrator."
        )
    
    # Get user permissions
    permissions = get_user_permissions(db, user.id)
    
    # Create token with user ID and permissions
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "permissions": permissions
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "permissions": permissions
    }

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset. Generates a token and sends email.
    """
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(request.email),
        User.is_deleted == False
    ).first()

    if user:
        # Generate reset token
        reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        password_reset_tokens[reset_token] = {
            "user_id": user.id,
            "email": user.email,
            "expires_at": datetime.utcnow() + timedelta(hours=1)
        }

        # print("RESET TOKEN:", reset_token) 

        # Send email (non-blocking, crash-safe)
        try:
            email_service.send_password_reset_email(user.email, reset_token, user.name)
        except Exception as e:
            logging.error(f"Failed to send password reset email to {user.email}: {e}")

    return {
        "message": "If an account with this email exists, a password reset link has been sent."
    }

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Reset password using token.
    """
    # Check if token exists and is valid
    token_data = password_reset_tokens.get(reset_data.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    if datetime.utcnow() > token_data["expires_at"]:
        del password_reset_tokens[reset_data.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update user password
    user = db.query(User).filter(
        User.id == token_data["user_id"],
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    user.password = get_password_hash(reset_data.new_password)
    db.commit()
    
    # Remove used token
    del password_reset_tokens[reset_data.token]
    
    return {"message": "Password reset successfully"}

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token endpoint."""
    user = db.query(User).filter(
        User.email == form_data.username,
        User.is_deleted == False
    ).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Get user permissions
    permissions = get_user_permissions(db, user.id)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "permissions": permissions
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "permissions": permissions
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current authenticated user information."""
    # Ensure roles are present for frontend role-based UX (e.g., CLIENT read-only views)
    try:
        current_user.roles = get_user_roles(db, current_user.id)
    except Exception:
        current_user.roles = []
    return current_user
