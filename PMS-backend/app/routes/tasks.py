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
from app.services.notification_service import (
    notify_task_assigned,
    notify_task_approved,
    notify_task_rejected,
    notify_approval_requested,
)
from app.services.email_service import email_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

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

def has_global_project_view(db: Session, user_id: int) -> bool:
    """Check if user has global project view (admin equivalent)."""
    return is_admin(db, user_id)

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

def is_project_manager(db: Session, user_id: int) -> bool:
    """Check if user is assigned as PROJECT_MANAGER for any project."""
    from app.models.project_member import ProjectMember, ProjectMemberRole

    # Check if user is assigned as project manager for any project
    pm_assignment = db.query(ProjectMember).filter(
        ProjectMember.user_id == user_id,
        ProjectMember.role == ProjectMemberRole.PROJECT_MANAGER,
        ProjectMember.is_deleted == False
    ).first()
    return pm_assignment is not None

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
        pass

    # Notify assignee
    if task.assigned_to and task.assigned_to != current_user.id:
        try:
            notify_task_assigned(db, task.assigned_to, task.title, task.id)
            assignee = db.query(User).filter(User.id == task.assigned_to).first()
            if assignee:
                email_service.send_task_assigned_email(assignee.email, assignee.name, task.title, task.id)
        except Exception:
            pass

    return task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    project_id: int = None,
    project_ids: str = None,
    sprint_id: int = None,
    assigned_to: int = None,
    status_filter: TaskStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get tasks.
    - CLIENT users see only tasks from projects they are members of
    - Admin users see all tasks (unless CLIENT role)
    - PROJECT_MANAGER users see all tasks from projects they manage
    - Other users see only tasks assigned to them from projects they are members of
    - Can filter by assigned_to to see only own tasks
    - Can filter by project_ids (comma-separated) for multiple projects
    """
    # Permission gate (with CLIENT fallback for read-only access)
    if not has_permission(db, current_user.id, TASK_VIEW) and not is_client(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {TASK_VIEW}"
        )

    # CLIENT users are ALWAYS restricted to tasks from assigned projects
    if is_client(db, current_user.id):
        user_project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.is_deleted == False
        ).all()
        user_project_id_list = [pm.project_id for pm in user_project_ids]

        if not user_project_id_list:
            # User has no project memberships
            return []

        query = db.query(Task).filter(
            Task.project_id.in_(user_project_id_list),
            Task.is_deleted == False
        )
    # Check if user is admin - they can see all tasks
    elif has_global_project_view(db, current_user.id):
        query = db.query(Task).filter(Task.is_deleted == False)
    # Check if user is project manager - they can see all tasks from their projects
    elif is_project_manager(db, current_user.id):
        user_project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.is_deleted == False
        ).all()
        user_project_id_list = [pm.project_id for pm in user_project_ids]

        if not user_project_id_list:
            # User has no project memberships
            return []

        query = db.query(Task).filter(
            Task.project_id.in_(user_project_id_list),
            Task.is_deleted == False
        )
    else:
        # Regular members see only tasks assigned to them from their projects
        user_project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.is_deleted == False
        ).all()
        user_project_id_list = [pm.project_id for pm in user_project_ids]

        if not user_project_id_list:
            # User has no project memberships
            return []

        query = db.query(Task).filter(
            Task.project_id.in_(user_project_id_list),
            Task.assigned_to == current_user.id,
            Task.is_deleted == False
        )

    if project_id:
        # Verify access to this project (for non-admin users)
        if not has_global_project_view(db, current_user.id) and not can_access_project(db, current_user.id, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project"
            )
        query = query.filter(Task.project_id == project_id)
    if project_ids:
        # Handle multiple project IDs (comma-separated)
        try:
            project_id_list = [int(pid.strip()) for pid in project_ids.split(',') if pid.strip()]
            # Verify access to all projects (for non-admin users)
            if not has_global_project_view(db, current_user.id):
                for pid in project_id_list:
                    if not can_access_project(db, current_user.id, pid):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"You do not have access to project {pid}"
                        )
            query = query.filter(Task.project_id.in_(project_id_list))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project_ids format"
            )
    if sprint_id:
        query = query.filter(Task.sprint_id == sprint_id)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    if status_filter:
        query = query.filter(Task.status == status_filter)

    # Exclude subtasks — they only appear inside their parent task's detail view
    query = query.filter(Task.parent_task_id == None)

    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task by ID. Only accessible to project members or admin."""
    # Permission gate (with CLIENT fallback for read-only access)
    if not has_permission(db, current_user.id, TASK_VIEW) and not is_client(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {TASK_VIEW}"
        )

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
    
    # If not admin/pm, restrict what assigned members can edit
    if not has_edit_permission and is_assigned:
        # Members can NEVER edit title or description, only status
        update_data = task_data.dict(exclude_unset=True)
        restricted_fields = ['title', 'description']
        allowed_fields = ['status']

        # Remove restricted fields
        for field in restricted_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Members cannot edit the {field} of tasks"
                )

        # Only allow status updates for assigned members
        for field in list(update_data.keys()):
            if field not in allowed_fields:
                del update_data[field]

        # Validate status value - only allow TODO, IN_PROGRESS, BLOCKED, DONE
        if 'status' in update_data:
            allowed_statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.DONE]
            if update_data['status'] not in allowed_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Members can only change status to TODO, IN_PROGRESS, BLOCKED, or DONE"
                )
    else:
        update_data = task_data.dict(exclude_unset=True)
    
    # Validate status transitions - prevent regression once task is in final states
    if 'status' in update_data:
        new_status = update_data['status']

        # Prevent changing back to TODO or IN_PROGRESS once task is DONE, APPROVED, or UNDER_REVIEW
        if task.status in [TaskStatus.DONE] or task.review_status in [TaskReviewStatus.UNDER_REVIEW, TaskReviewStatus.APPROVED]:
            if new_status in [TaskStatus.TODO, TaskStatus.IN_PROGRESS]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot change task status back to {new_status.value} once it has been completed or is under review"
                )

        # Block marking a parent task DONE if it has incomplete subtasks
        if new_status == TaskStatus.DONE and task.parent_task_id is None:
            incomplete_subtasks = db.query(Task).filter(
                Task.parent_task_id == task.id,
                Task.is_deleted == False,
                Task.status != TaskStatus.DONE
            ).count()
            if incomplete_subtasks > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot mark task as done — {incomplete_subtasks} subtask(s) are not yet completed"
                )

    # Track changes
    status_changed = 'status' in update_data and update_data['status'] != task.status
    old_assignee = task.assigned_to
    assignee_changed = 'assigned_to' in update_data and update_data['assigned_to'] != old_assignee

    # Update fields
    for field, value in update_data.items():
        setattr(task, field, value)

    # Auto-set progress based on status for assigned members
    if not has_edit_permission and is_assigned:
        if task.status == TaskStatus.TODO:
            task.progress = Decimal("0.00")
        elif task.status == TaskStatus.IN_PROGRESS:
            task.progress = Decimal("50.00")
        elif task.status == TaskStatus.DONE:
            task.progress = Decimal("100.00")

    # Set completed_at if status changed to DONE
    if task.status == TaskStatus.DONE and not task.completed_at:
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    # Auto-complete parent task when all subtasks are DONE
    if task.parent_task_id and task.status == TaskStatus.DONE:
        remaining = db.query(Task).filter(
            Task.parent_task_id == task.parent_task_id,
            Task.is_deleted == False,
            Task.status != TaskStatus.DONE
        ).count()
        if remaining == 0:
            parent = db.query(Task).filter(Task.id == task.parent_task_id).first()
            if parent and parent.status != TaskStatus.DONE:
                parent.status = TaskStatus.DONE
                parent.progress = Decimal("100.00")
                parent.completed_at = datetime.utcnow()
                db.commit()

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
        pass

    # Notify new assignee if assignment changed
    if assignee_changed and task.assigned_to and task.assigned_to != current_user.id:
        try:
            notify_task_assigned(db, task.assigned_to, task.title, task.id)
            new_assignee = db.query(User).filter(User.id == task.assigned_to).first()
            if new_assignee:
                email_service.send_task_assigned_email(new_assignee.email, new_assignee.name, task.title, task.id)
        except Exception:
            pass

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

    # Notify project managers about approval request
    try:
        from app.models.project_member import ProjectMember, ProjectMemberRole
        pms = db.query(ProjectMember).filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.role == ProjectMemberRole.PROJECT_MANAGER,
            ProjectMember.is_deleted == False,
        ).all()
        for pm in pms:
            notify_approval_requested(db, pm.user_id, task.title, task.id, current_user.name)
    except Exception:
        pass

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
    task.progress = Decimal("100.00")  # Automatically set progress to 100% on approval
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
        pass

    # Notify assignee
    if task.assigned_to:
        try:
            notify_task_approved(db, task.assigned_to, task.title, task.id)
            assignee = db.query(User).filter(User.id == task.assigned_to).first()
            if assignee:
                email_service.send_task_approved_email(assignee.email, assignee.name, task.title, task.id)
        except Exception:
            pass

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
        pass

    # Notify assignee
    if task.assigned_to:
        try:
            notify_task_rejected(db, task.assigned_to, task.title, task.id)
            assignee = db.query(User).filter(User.id == task.assigned_to).first()
            if assignee:
                email_service.send_task_rejected_email(assignee.email, assignee.name, task.title, task.id)
        except Exception:
            pass

    return task

@router.get("/{task_id}/subtasks", response_model=List[TaskResponse])
def get_subtasks(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all subtasks for a given parent task."""
    parent = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not can_access_project(db, current_user.id, parent.project_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this task")

    subtasks = db.query(Task).filter(
        Task.parent_task_id == task_id,
        Task.is_deleted == False,
    ).all()
    return subtasks


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
        pass
    
    return None


# ─────────────────── Comments ───────────────────

from app.models.task_comment import TaskComment
from pydantic import BaseModel as PydanticBase

class CommentCreate(PydanticBase):
    content: str

class CommentUpdate(PydanticBase):
    content: str

class CommentResponse(PydanticBase):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user_name: str = ""
    user_initial: str = ""

    class Config:
        from_attributes = True


@router.get("/{task_id}/comments", response_model=List[CommentResponse])
def get_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(status_code=403, detail="Access denied")

    comments = (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id, TaskComment.is_deleted == False)
        .order_by(TaskComment.created_at.asc())
        .all()
    )
    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        name = user.name if user else "Unknown"
        result.append(CommentResponse(
            id=c.id, task_id=c.task_id, user_id=c.user_id,
            content=c.content, created_at=c.created_at, updated_at=c.updated_at,
            user_name=name,
            user_initial=name[0].upper() if name else "?",
        ))
    return result


@router.post("/{task_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    task_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_access_project(db, current_user.id, task.project_id):
        raise HTTPException(status_code=403, detail="Access denied")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    comment = TaskComment(task_id=task_id, user_id=current_user.id, content=body.content.strip())
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id, task_id=comment.task_id, user_id=comment.user_id,
        content=comment.content, created_at=comment.created_at, updated_at=comment.updated_at,
        user_name=current_user.name,
        user_initial=current_user.name[0].upper() if current_user.name else "?",
    )


@router.put("/{task_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    task_id: int,
    comment_id: int,
    body: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id,
        TaskComment.is_deleted == False,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    comment.content = body.content.strip()
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id, task_id=comment.task_id, user_id=comment.user_id,
        content=comment.content, created_at=comment.created_at, updated_at=comment.updated_at,
        user_name=current_user.name,
        user_initial=current_user.name[0].upper() if current_user.name else "?",
    )


@router.delete("/{task_id}/comments/{comment_id}", status_code=204)
def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id,
        TaskComment.is_deleted == False,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    is_admin_user = is_admin(db, current_user.id)
    if comment.user_id != current_user.id and not is_admin_user:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    comment.is_deleted = True
    db.commit()
    return None
