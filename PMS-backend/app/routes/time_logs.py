"""
Time log routes with permission-based authorization.
Time logs track actual hours worked on tasks.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    TIME_LOG_CREATE,
    TIME_LOG_VIEW,
    TIME_LOG_EDIT,
    TIME_LOG_DELETE,
)
from app.models.time_log import TimeLog
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/time-logs", tags=["Time Logs"])

class TimeLogCreate(BaseModel):
    task_id: int
    log_date: date
    hours: Decimal
    description: Optional[str] = None

class TimeLogUpdate(BaseModel):
    log_date: Optional[date] = None
    hours: Optional[Decimal] = None
    description: Optional[str] = None

class TimeLogResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    log_date: date
    hours: Decimal
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=TimeLogResponse, status_code=status.HTTP_201_CREATED)
def create_time_log(
    time_log_data: TimeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TIME_LOG_CREATE))
):
    """Create a new time log. Requires TIME_LOG_CREATE permission."""
    # Verify task exists
    task = db.query(Task).filter(
        Task.id == time_log_data.task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    time_log = TimeLog(
        task_id=time_log_data.task_id,
        user_id=current_user.id,
        log_date=time_log_data.log_date,
        hours=time_log_data.hours,
        description=time_log_data.description
    )
    db.add(time_log)
    db.commit()
    db.refresh(time_log)
    
    # Update task actual_hours (derived from time logs)
    try:
        from sqlalchemy import func
        total_hours = db.query(func.sum(TimeLog.hours)).filter(
            TimeLog.task_id == task.id
        ).scalar() or Decimal('0')
        task.actual_hours = total_hours
        db.commit()
    except Exception as e:
        print(f"Warning: Failed to update task actual_hours: {e}")
    
    return time_log

@router.get("/", response_model=List[TimeLogResponse])
def get_time_logs(
    task_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TIME_LOG_VIEW))
):
    """Get all time logs. Requires TIME_LOG_VIEW permission."""
    query = db.query(TimeLog)
    
    if task_id:
        query = query.filter(TimeLog.task_id == task_id)
    if user_id:
        query = query.filter(TimeLog.user_id == user_id)
    
    time_logs = query.order_by(TimeLog.log_date.desc()).offset(skip).limit(limit).all()
    return time_logs

@router.get("/{time_log_id}", response_model=TimeLogResponse)
def get_time_log(
    time_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TIME_LOG_VIEW))
):
    """Get a specific time log by ID."""
    time_log = db.query(TimeLog).filter(TimeLog.id == time_log_id).first()
    if not time_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time log not found"
        )
    return time_log

@router.put("/{time_log_id}", response_model=TimeLogResponse)
def update_time_log(
    time_log_id: int,
    time_log_data: TimeLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TIME_LOG_EDIT))
):
    """Update a time log. Requires TIME_LOG_EDIT permission."""
    time_log = db.query(TimeLog).filter(TimeLog.id == time_log_id).first()
    if not time_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time log not found"
        )
    
    update_data = time_log_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(time_log, field, value)
    
    db.commit()
    db.refresh(time_log)
    
    # Update task actual_hours
    try:
        from sqlalchemy import func
        task = db.query(Task).filter(Task.id == time_log.task_id).first()
        if task:
            total_hours = db.query(func.sum(TimeLog.hours)).filter(
                TimeLog.task_id == task.id
            ).scalar() or Decimal('0')
            task.actual_hours = total_hours
            db.commit()
    except Exception as e:
        print(f"Warning: Failed to update task actual_hours: {e}")
    
    return time_log

@router.delete("/{time_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_log(
    time_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TIME_LOG_DELETE))
):
    """Delete a time log. Requires TIME_LOG_DELETE permission."""
    time_log = db.query(TimeLog).filter(TimeLog.id == time_log_id).first()
    if not time_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time log not found"
        )
    
    task_id = time_log.task_id
    db.delete(time_log)
    db.commit()
    
    # Update task actual_hours
    try:
        from sqlalchemy import func
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            total_hours = db.query(func.sum(TimeLog.hours)).filter(
                TimeLog.task_id == task_id
            ).scalar() or Decimal('0')
            task.actual_hours = total_hours
            db.commit()
    except Exception as e:
        print(f"Warning: Failed to update task actual_hours: {e}")
    
    return None

