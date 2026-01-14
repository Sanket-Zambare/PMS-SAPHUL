from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog, EntityType
from app.schemas.activity_log import ActivityLogResponse
from datetime import datetime

def create_activity_log(
    db: Session,
    entity_type: EntityType,
    entity_id: int,
    action: str,
    performed_by: int,
    description: str = None
):
    """Create an activity log entry. Must not crash if logging fails."""
    try:
        log = ActivityLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            performed_by=performed_by
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        # Logging failure must not block main action
        print(f"Warning: Failed to create activity log: {e}")
        db.rollback()
        return None

def get_project_activities(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    """Get activity logs for a project."""
    try:
        return db.query(ActivityLog).filter(
            ActivityLog.entity_type == EntityType.PROJECT,
            ActivityLog.entity_id == project_id
        ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    except Exception as e:
        print(f"Error fetching project activities: {e}")
        return []

def get_task_activities(db: Session, task_id: int, skip: int = 0, limit: int = 100):
    """Get activity logs for a task."""
    try:
        return db.query(ActivityLog).filter(
            ActivityLog.entity_type == EntityType.TASK,
            ActivityLog.entity_id == task_id
        ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    except Exception as e:
        print(f"Error fetching task activities: {e}")
        return []

def get_user_activities(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get activity logs performed by a user."""
    try:
        return db.query(ActivityLog).filter(
            ActivityLog.performed_by == user_id
        ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    except Exception as e:
        print(f"Error fetching user activities: {e}")
        return []
