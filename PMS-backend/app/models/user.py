from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from datetime import datetime
from app.database import Base
import enum

class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Changed from password_hash
    job_title = Column(String(50), nullable=True)
    department = Column(String(50), nullable=True)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
