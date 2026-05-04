"""
Security and authentication module using permission-based authorization.
All authorization checks must use permissions, not roles.
"""
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.permission_service import get_user_permissions, has_permission, has_any_permission

# Password hashing - using bcrypt directly

# JWT settings
# =========================
# ==== PRODUCTION (HOSTINGER) ====
# Uncomment this for production deployment
# Use environment variable: JWT_SECRET=your-production-secret-key-here
# =========================
# PRODUCTION secret key (uncomment and set strong production secret):
# SECRET_KEY = os.getenv("JWT_SECRET", "your-production-secret-key-change-this-in-production")

# =========================
# ==== LOCAL (REMOVE FOR PROD) ====
# REMOVE OR COMMENT THIS FOR PRODUCTION
# =========================
import os
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")  # LOCAL ONLY - development secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        # Ensure password is bytes
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password."""
    # Ensure password is bytes
    if isinstance(password, str):
        password = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    # Return as string for database storage
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token with user ID and permissions."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if user is None:
        raise credentials_exception
    return user

def require_permission(permission_code: str):
    """
    Dependency factory to require a specific permission.
    Must use permissions, not roles.
    """
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not has_permission(db, current_user.id, permission_code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission_code}"
            )
        return current_user
    return permission_checker

def require_any_permission(permission_codes: List[str]):
    """
    Dependency factory to require any of the specified permissions.
    """
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not has_any_permission(db, current_user.id, permission_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {', '.join(permission_codes)}"
            )
        return current_user
    return permission_checker

async def get_current_user_with_permissions(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get current user with their permissions loaded.
    Returns tuple: (user, permissions_list)
    """
    user = await get_current_user(token, db)
    permissions = get_user_permissions(db, user.id)
    return user, permissions
