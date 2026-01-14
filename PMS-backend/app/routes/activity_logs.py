"""
Activity log routes. Read-only access to activity logs.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.security import get_db, get_current_user
from app.schemas.activity_log import ActivityLogResponse
from app.models.activity_log import ActivityLog, EntityType
from app.models.user import User

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_logs(
    entity_type: Optional[EntityType] = None,
    entity_id: Optional[int] = None,
    performed_by: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs. Can be filtered by entity type, entity ID, or performer."""
    query = db.query(ActivityLog)
    
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)
    if performed_by:
        query = query.filter(ActivityLog.performed_by == performed_by)
    
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/project/{project_id}", response_model=List[ActivityLogResponse])
def get_project_activity_logs(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs for a specific project."""
    logs = db.query(ActivityLog).filter(
        ActivityLog.entity_type == EntityType.PROJECT,
        ActivityLog.entity_id == project_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/task/{task_id}", response_model=List[ActivityLogResponse])
def get_task_activity_logs(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs for a specific task."""
    logs = db.query(ActivityLog).filter(
        ActivityLog.entity_type == EntityType.TASK,
        ActivityLog.entity_id == task_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
