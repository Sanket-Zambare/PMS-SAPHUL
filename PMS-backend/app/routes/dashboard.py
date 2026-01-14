"""
Dashboard routes with permission-based authorization.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    DASHBOARD_VIEW,
)
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.project_member import ProjectMember
from app.models.project_task_stats import ProjectTaskStats
from app.schemas.project_task_stats import ProjectTaskStatsResponse
from app.services.permission_service import has_permission, get_user_permissions

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def is_admin(db: Session, user_id: int) -> bool:
    """Check if user is admin."""
    from app.models.role import Role
    from app.models.user_role import UserRole as UserRoleModel
    
    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    if admin_role:
        user_role = db.query(UserRoleModel).filter(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == admin_role.id
        ).first()
        return user_role is not None
    return False

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(DASHBOARD_VIEW))
):
    """Get dashboard statistics. Admin sees everything, others see filtered data."""
    stats = {}
    
    # Check if user is admin
    user_is_admin = is_admin(db, current_user.id)
    
    if user_is_admin:
        # Admin sees all projects and tasks
        total_projects = db.query(Project).filter(Project.is_deleted == False).count()
        pending_projects = db.query(Project).filter(
            Project.is_deleted == False,
            Project.status == ProjectStatus.PENDING
        ).count()
        in_progress_projects = db.query(Project).filter(
            Project.is_deleted == False,
            Project.status == ProjectStatus.IN_PROGRESS
        ).count()
        completed_projects = db.query(Project).filter(
            Project.is_deleted == False,
            Project.status == ProjectStatus.COMPLETED
        ).count()
        
        total_tasks = db.query(Task).filter(Task.is_deleted == False).count()
        todo_tasks = db.query(Task).filter(
            Task.is_deleted == False,
            Task.status == TaskStatus.TODO
        ).count()
        in_progress_tasks = db.query(Task).filter(
            Task.is_deleted == False,
            Task.status == TaskStatus.IN_PROGRESS
        ).count()
        done_tasks = db.query(Task).filter(
            Task.is_deleted == False,
            Task.status == TaskStatus.DONE
        ).count()
        
        total_users = db.query(User).filter(User.is_deleted == False).count()
        
        stats = {
            "projects": {
                "total": total_projects,
                "pending": pending_projects,
                "in_progress": in_progress_projects,
                "completed": completed_projects
            },
            "tasks": {
                "total": total_tasks,
                "todo": todo_tasks,
                "in_progress": in_progress_tasks,
                "done": done_tasks
            },
            "users": {
                "total": total_users
            }
        }
    
    elif has_permission(db, current_user.id, "PROJECT_VIEW_ASSIGNED") or has_permission(db, current_user.id, "PROJECT_VIEW_ALL") or has_permission(db, current_user.id, "TASK_VIEW"):
        # Project Manager sees projects they manage and related tasks
        managed_projects = db.query(Project).join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        ).all()
        
        project_ids = [p.id for p in managed_projects]
        
        total_projects = len(project_ids)
        pending_projects = sum(1 for p in managed_projects if p.status == ProjectStatus.PENDING)
        in_progress_projects = sum(1 for p in managed_projects if p.status == ProjectStatus.IN_PROGRESS)
        completed_projects = sum(1 for p in managed_projects if p.status == ProjectStatus.COMPLETED)
        
        if project_ids:
            total_tasks = db.query(Task).filter(
                Task.project_id.in_(project_ids),
                Task.is_deleted == False
            ).count()
            todo_tasks = db.query(Task).filter(
                Task.project_id.in_(project_ids),
                Task.is_deleted == False,
                Task.status == TaskStatus.TODO
            ).count()
            in_progress_tasks = db.query(Task).filter(
                Task.project_id.in_(project_ids),
                Task.is_deleted == False,
                Task.status == TaskStatus.IN_PROGRESS
            ).count()
            done_tasks = db.query(Task).filter(
                Task.project_id.in_(project_ids),
                Task.is_deleted == False,
                Task.status == TaskStatus.DONE
            ).count()
        else:
            total_tasks = todo_tasks = in_progress_tasks = done_tasks = 0
        
        stats = {
            "projects": {
                "total": total_projects,
                "pending": pending_projects,
                "in_progress": in_progress_projects,
                "completed": completed_projects
            },
            "tasks": {
                "total": total_tasks,
                "todo": todo_tasks,
                "in_progress": in_progress_tasks,
                "done": done_tasks
            }
        }
    
    else:
        # Members see only their assigned tasks
        my_tasks = db.query(Task).filter(
            Task.assigned_to == current_user.id,
            Task.is_deleted == False
        ).all()
        
        total_tasks = len(my_tasks)
        todo_tasks = sum(1 for t in my_tasks if t.status == TaskStatus.TODO)
        in_progress_tasks = sum(1 for t in my_tasks if t.status == TaskStatus.IN_PROGRESS)
        done_tasks = sum(1 for t in my_tasks if t.status == TaskStatus.DONE)
        
        # Get projects they're members of
        member_projects = db.query(Project).join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        ).all()
        
        stats = {
            "tasks": {
                "total": total_tasks,
                "todo": todo_tasks,
                "in_progress": in_progress_tasks,
                "done": done_tasks
            },
            "projects": {
                "total": len(member_projects)
            }
        }
    
    return stats

@router.get("/project-stats/{project_id}", response_model=ProjectTaskStatsResponse)
def get_project_stats(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(DASHBOARD_VIEW))
):
    """Get task statistics for a specific project."""
    stats = db.query(ProjectTaskStats).filter(
        ProjectTaskStats.project_id == project_id
    ).first()
    
    if not stats:
        # Return empty stats if not found (read-only table)
        from app.models.project_task_stats import ProjectTaskStats as StatsModel
        stats = StatsModel(
            project_id=project_id,
            total_tasks=0,
            completed_tasks=0,
            blocked_tasks=0,
            overdue_tasks=0,
            billable_hours=0,
            non_billable_hours=0
        )
    
    return stats
