from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.project_task_stats import ProjectTaskStats
from app.models.task import Task, TaskStatus
from decimal import Decimal

def update_project_task_stats(db: Session, project_id: int):
    """Update or create project task statistics."""
    # Get all non-deleted tasks for the project
    tasks = db.query(Task).filter(
        Task.project_id == project_id,
        Task.is_deleted == False
    ).all()
    
    total_tasks = len(tasks)
    pending_tasks = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
    in_progress_tasks = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    
    # Calculate average progress
    if total_tasks > 0:
        total_progress = sum(float(t.progress) for t in tasks)
        average_progress = Decimal(str(total_progress / total_tasks))
    else:
        average_progress = Decimal("0.00")
    
    # Get or create stats record
    stats = db.query(ProjectTaskStats).filter(
        ProjectTaskStats.project_id == project_id
    ).first()
    
    if stats:
        stats.total_tasks = total_tasks
        stats.pending_tasks = pending_tasks
        stats.in_progress_tasks = in_progress_tasks
        stats.completed_tasks = completed_tasks
        stats.average_progress = average_progress
    else:
        stats = ProjectTaskStats(
            project_id=project_id,
            total_tasks=total_tasks,
            pending_tasks=pending_tasks,
            in_progress_tasks=in_progress_tasks,
            completed_tasks=completed_tasks,
            average_progress=average_progress
        )
        db.add(stats)
    
    db.commit()
    db.refresh(stats)
    return stats



