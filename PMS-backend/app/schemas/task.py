from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.models.task import TaskStatus, TaskReviewStatus, TaskApprovalStatus, TaskPriority

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    sprint_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    backlog_order: Optional[int] = None
    assigned_to: Optional[int] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None
    progress: Optional[Decimal] = 0.00
    billable: Optional[bool] = False
    billing_rate: Optional[Decimal] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sprint_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    backlog_order: Optional[int] = None
    status: Optional[TaskStatus] = None
    review_status: Optional[TaskReviewStatus] = None
    approval_status: Optional[TaskApprovalStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None
    progress: Optional[Decimal] = None
    billable: Optional[bool] = None
    billing_rate: Optional[Decimal] = None

class TaskResponse(TaskBase):
    id: int
    created_by: int
    status: TaskStatus
    review_status: TaskReviewStatus
    approval_status: TaskApprovalStatus
    actual_hours: Optional[Decimal] = None
    progress: Decimal
    review_requested_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
