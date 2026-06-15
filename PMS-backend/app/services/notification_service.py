from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    entity_type: str = None,
    entity_id: int = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_task_assigned(db: Session, assignee_id: int, task_title: str, task_id: int):
    create_notification(
        db=db,
        user_id=assignee_id,
        title="New Task Assigned",
        message=f'You have been assigned to task: "{task_title}"',
        entity_type="TASK",
        entity_id=task_id,
    )


def notify_task_approved(db: Session, assignee_id: int, task_title: str, task_id: int):
    create_notification(
        db=db,
        user_id=assignee_id,
        title="Task Approved",
        message=f'Your task "{task_title}" has been approved.',
        entity_type="TASK",
        entity_id=task_id,
    )


def notify_task_rejected(db: Session, assignee_id: int, task_title: str, task_id: int):
    create_notification(
        db=db,
        user_id=assignee_id,
        title="Task Rejected",
        message=f'Your task "{task_title}" has been rejected and needs rework.',
        entity_type="TASK",
        entity_id=task_id,
    )


def notify_approval_requested(db: Session, approver_id: int, task_title: str, task_id: int, requester_name: str):
    create_notification(
        db=db,
        user_id=approver_id,
        title="Task Approval Requested",
        message=f'{requester_name} has requested approval for task: "{task_title}"',
        entity_type="TASK",
        entity_id=task_id,
    )
