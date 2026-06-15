"""
Activity log routes. Read-only access to activity logs.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.security import get_db, get_current_user
from app.models.activity_log import ActivityLog, EntityType
from app.models.user import User

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


class ActivityLogEnriched(BaseModel):
    id: int
    entity_type: EntityType
    entity_id: int
    action: str
    performed_by: int
    performed_by_name: str = ""
    created_at: datetime

    class Config:
        from_attributes = True


def _enrich(logs, db: Session):
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.performed_by).first()
        result.append(ActivityLogEnriched(
            id=log.id,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            action=log.action,
            performed_by=log.performed_by,
            performed_by_name=user.name if user else f"User #{log.performed_by}",
            created_at=log.created_at,
        ))
    return result


@router.get("/", response_model=List[ActivityLogEnriched])
def get_activity_logs(
    entity_type: Optional[EntityType] = None,
    entity_id: Optional[int] = None,
    performed_by: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ActivityLog)
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)
    if performed_by:
        query = query.filter(ActivityLog.performed_by == performed_by)
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return _enrich(logs, db)


@router.get("/project/{project_id}", response_model=List[ActivityLogEnriched])
def get_project_activity_logs(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(ActivityLog).filter(
        ActivityLog.entity_type == EntityType.PROJECT,
        ActivityLog.entity_id == project_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return _enrich(logs, db)


@router.get("/task/{task_id}", response_model=List[ActivityLogEnriched])
def get_task_activity_logs(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(ActivityLog).filter(
        ActivityLog.entity_type == EntityType.TASK,
        ActivityLog.entity_id == task_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return _enrich(logs, db)
