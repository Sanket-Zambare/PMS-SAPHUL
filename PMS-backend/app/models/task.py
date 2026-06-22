from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey, Numeric
from datetime import datetime
from decimal import Decimal
from app.database import Base
import enum

class TaskStatus(enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    DONE = "DONE"
    CANCELLED = "CANCELLED"

class TaskReviewStatus(enum.Enum):
    NONE = "NONE"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class TaskApprovalStatus(enum.Enum):
    NONE = "NONE"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class TaskPriority(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    # Task details
    backlog_order = Column(Integer, nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    review_status = Column(Enum(TaskReviewStatus), default=TaskReviewStatus.NONE, nullable=False)
    approval_status = Column(Enum(TaskApprovalStatus), default=TaskApprovalStatus.NONE, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    
    # Dates
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    review_requested_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Time tracking
    estimated_hours = Column(Numeric(6, 2), nullable=True)
    actual_hours = Column(Numeric(6, 2), nullable=True)  # Derived from TIME_LOGS
    progress = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    
    # Billing
    billable = Column(Boolean, default=False, nullable=False)
    billing_rate = Column(Numeric(10, 2), nullable=True)
    
    # Blocker
    blocker_reason = Column(Text, nullable=True)

    # Urgent flag
    is_urgent = Column(Boolean, default=False, nullable=False)

    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
