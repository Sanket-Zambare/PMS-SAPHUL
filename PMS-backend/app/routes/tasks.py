"""
Task routes with permission-based authorization.
Task completion requires PROJECT_MANAGER approval.
Only assigned members can update task progress.
Tasks are only visible to project members (except ADMIN who sees all).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from decimal import Decimal
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    TASK_CREATE,
    TASK_VIEW,
    TASK_EDIT,
    TASK_DELETE,
    TASK_ASSIGN,
    TASK_APPROVE,
    PROJECT_VIEW_ALL,
)
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.models.task import Task, TaskStatus, TaskReviewStatus, TaskApprovalStatus, TaskPriority
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType
from app.services.permission_service import has_permission

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def has_global_project_view(db: Session, user_id: int) -> bool:
    """Check if user has global project view (admin equivalent)."""
    return has_permission(db, user_id, PROJECT_VIEW_ALL)

def can_access_project(db: Session, user_id: int, project_id: int) -> bool:
    """Check if user can access a project (admin or project member)."""
    # Admin can access all projects
    if has_global_project_view(db, user_id):
        return True
    
    # Check if user is a project member
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
        ProjectMember.is_deleted == False
    ).first()
    
    return member is not None

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_CREATE))
):
    """Create a new task. Requires TASK_CREATE permission and project access."""
    # Verify project exists
    project = db.query(Project).filter(
        Project.id == task_data.project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task_data.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project"
        )
    
    # Verify assigned user exists if provided
    if task_data.assigned_to:
        user = db.query(User).filter(
            User.id == task_data.assigned_to,
            User.is_deleted == False
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
    
    task = Task(
        title=task_data.title,
        description=task_data.description,
        project_id=task_data.project_id,
        sprint_id=task_data.sprint_id,
        parent_task_id=task_data.parent_task_id,
        backlog_order=task_data.backlog_order,
        assigned_to=task_data.assigned_to,
        created_by=current_user.id,
        priority=task_data.priority or TaskPriority.MEDIUM,
        start_date=task_data.start_date,
        due_date=task_data.due_date,
        estimated_hours=task_data.estimated_hours,
        billable=task_data.billable or False,
        billing_rate=task_data.billing_rate,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action="create",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    project_id: int = None,
    sprint_id: int = None,
    assigned_to: int = None,
    status_filter: TaskStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_VIEW))
):
    """
    Get tasks. 
    - ADMIN sees all tasks
    - Others see only tasks from projects they are members of
    - Can filter by assigned_to to see only own tasks
    """
    # Check if user has global project view (admin-equivalent)
    if has_global_project_view(db, current_user.id):
        query = db.query(Task).filter(Task.is_deleted == False)
    else:
        # Others see only tasks from their projects
        project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.is_deleted == False
        ).subquery()
        query = db.query(Task).filter(
            Task.project_id.in_(project_ids),
            Task.is_deleted == False
        )
    
    if project_id:
        # Verify access to this project
        if not can_access_project(db, current_user.id, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project"
            )
        query = query.filter(Task.project_id == project_id)
    if sprint_id:
        query = query.filter(Task.sprint_id == sprint_id)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_VIEW))
):
    """Get a specific task by ID. Only accessible to project members or admin."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a task. 
    - Only assigned members can update task progress/status
    - PROJECT_MANAGER/ADMIN can update all fields
    """
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    # Check permissions
    has_edit_permission = has_permission(db, current_user.id, TASK_EDIT)
    is_assigned = task.assigned_to == current_user.id
    
    # Only assigned members can update progress/status without TASK_EDIT permission
    if not has_edit_permission and not is_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only assigned members can update this task"
        )
    
    # If not admin/pm, only allow status/progress updates
    if not has_edit_permission and is_assigned:
        # Only allow status and review_status updates
        update_data = task_data.dict(exclude_unset=True)
        allowed_fields = ['status', 'review_status']
        for field in list(update_data.keys()):
            if field not in allowed_fields:
                del update_data[field]
    else:
        update_data = task_data.dict(exclude_unset=True)
    
    # Track changes
    status_changed = 'status' in update_data and update_data['status'] != task.status
    
    # Update fields
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Set completed_at if status changed to DONE
    if task.status == TaskStatus.DONE and not task.completed_at:
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        action = "status_changed" if status_changed else "update"
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action=action,
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return task

@router.post("/{task_id}/request-approval", response_model=TaskResponse)
def request_task_approval(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request task approval. Only assigned members can request approval."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    # Only assigned member can request approval
    if task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only assigned member can request approval"
        )
    
    if task.status != TaskStatus.DONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task must be DONE before requesting approval"
        )
    
    task.review_status = TaskReviewStatus.UNDER_REVIEW
    task.approval_status = TaskApprovalStatus.PENDING
    task.review_requested_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action="approval_requested",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return task

@router.post("/{task_id}/approve", response_model=TaskResponse)
def approve_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_APPROVE))
):
    """Approve task completion. Requires TASK_APPROVE permission."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    if task.approval_status != TaskApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not pending approval"
        )
    
    task.review_status = TaskReviewStatus.APPROVED
    task.approval_status = TaskApprovalStatus.APPROVED
    task.reviewed_at = datetime.utcnow()
    task.reviewed_by = current_user.id
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action="approved",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return task

@router.post("/{task_id}/reject", response_model=TaskResponse)
def reject_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_APPROVE))
):
    """Reject task completion. Requires TASK_APPROVE permission."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    task.review_status = TaskReviewStatus.REJECTED
    task.approval_status = TaskApprovalStatus.REJECTED
    task.reviewed_at = datetime.utcnow()
    task.reviewed_by = current_user.id
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action="rejected",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(TASK_DELETE))
):
    """Soft delete a task. Requires TASK_DELETE permission."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check project access
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task"
        )
    
    # Soft delete
    task.is_deleted = True
    task.deleted_at = datetime.utcnow()
    db.commit()
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.TASK,
            entity_id=task.id,
            action="delete",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return None
