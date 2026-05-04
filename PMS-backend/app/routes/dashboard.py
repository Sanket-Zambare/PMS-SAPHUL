"""
Dashboard routes with permission-based authorization.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.security import (
    get_db,
    get_current_user,
    require_permission,
    require_any_permission,
)
from app.core.permissions import (
    DASHBOARD_VIEW,
    PROJECT_VIEW_ALL,
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

def is_client(db: Session, user_id: int) -> bool:
    """Check if user has CLIENT role."""
    from app.models.role import Role
    from app.models.user_role import UserRole as UserRoleModel

    client_role = db.query(Role).filter(Role.name == "CLIENT").first()
    if client_role:
        user_role = db.query(UserRoleModel).filter(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == client_role.id
        ).first()
        return user_role is not None
    return False

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(DASHBOARD_VIEW))
):
    """Get dashboard statistics. CLIENT users see only assigned projects, even if they have broader permissions."""
    stats = {}

    # CLIENT users are ALWAYS restricted to assigned projects
    if is_client(db, current_user.id):
        user_projects = db.query(Project).join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        ).all()
    # Check if user has PROJECT_VIEW_ALL permission (admin)
    elif has_permission(db, current_user.id, PROJECT_VIEW_ALL):
        # Admin sees all projects
        user_projects = db.query(Project).filter(Project.is_deleted == False).all()
    else:
        # Non-admin users see only assigned projects
        user_projects = db.query(Project).join(ProjectMember, Project.id == ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        ).all()

    project_ids = [p.id for p in user_projects]

    total_projects = len(user_projects)
    pending_projects = sum(1 for p in user_projects if p.status == ProjectStatus.PENDING)
    in_progress_projects = sum(1 for p in user_projects if p.status == ProjectStatus.IN_PROGRESS)
    completed_projects = sum(1 for p in user_projects if p.status == ProjectStatus.COMPLETED)

    # Get tasks from user's projects
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

    return stats

@router.get("/project-stats/{project_id}", response_model=ProjectTaskStatsResponse)
def get_project_stats(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(DASHBOARD_VIEW))
):
    """Get task statistics for a specific project."""
    try:
        stats = db.query(ProjectTaskStats).filter(
            ProjectTaskStats.project_id == project_id
        ).first()

        if not stats:
            # Return empty stats if not found (read-only table)
            return {
                "project_id": project_id,
                "total_tasks": 0,
                "completed_tasks": 0,
                "blocked_tasks": 0,
                "overdue_tasks": 0,
                "billable_hours": 0.0,
                "non_billable_hours": 0.0,
                "last_updated": datetime.utcnow()
            }

        return stats
    except Exception as e:
        # If table doesn't exist or any other error, return empty stats
        print(f"Error fetching project stats: {e}")
        return {
            "project_id": project_id,
            "total_tasks": 0,
            "completed_tasks": 0,
            "blocked_tasks": 0,
            "overdue_tasks": 0,
            "billable_hours": 0.0,
            "non_billable_hours": 0.0,
            "last_updated": datetime.utcnow()
        }
