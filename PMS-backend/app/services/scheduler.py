"""
Background scheduler for automated notifications.
Runs a daily job at 9 AM to send due-date reminders.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


def send_due_date_reminders():
    """Send notifications for tasks due tomorrow."""
    from app.database import SessionLocal
    from app.models.task import Task, TaskStatus
    from app.services.notification_service import create_notification

    db = SessionLocal()
    try:
        tomorrow = date.today() + timedelta(days=1)
        tasks = (
            db.query(Task)
            .filter(
                Task.due_date == tomorrow,
                Task.status != TaskStatus.DONE,
                Task.status != TaskStatus.CANCELLED,
                Task.assigned_to.isnot(None),
                Task.is_deleted == False,
            )
            .all()
        )
        for task in tasks:
            create_notification(
                db=db,
                user_id=task.assigned_to,
                title="Task due tomorrow",
                message=f'Your task "{task.title}" is due tomorrow ({tomorrow.strftime("%d %b %Y")}). Make sure to complete it!',
                entity_type="TASK",
                entity_id=task.id,
            )
        logger.info(f"Due date reminders sent for {len(tasks)} tasks")
    except Exception as e:
        logger.error(f"Error sending due date reminders: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every day at 9 AM server time
    scheduler.add_job(
        send_due_date_reminders,
        CronTrigger(hour=9, minute=0),
        id="due_date_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — due date reminders will run daily at 9 AM")
    return scheduler
