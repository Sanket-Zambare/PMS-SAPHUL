from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey
from datetime import datetime
from app.database import Base
import enum

class ProjectMethodology(enum.Enum):
    WATERFALL = "WATERFALL"
    AGILE = "AGILE"
    HYBRID = "HYBRID"

class ProjectStatus(enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DELAYED = "DELAYED"
    CLOSED = "CLOSED"

class ReviewStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    methodology = Column(Enum(ProjectMethodology), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PENDING, nullable=False)
    review_status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False)
    
    # Dates
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    review_requested_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Foreign keys
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
