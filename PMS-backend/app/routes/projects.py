"""
Project routes with permission-based authorization.
Only ADMIN can create projects. Project completion requires ADMIN approval.
Projects are only visible to assigned members (except ADMIN who sees all).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import exists
from typing import List
from datetime import datetime
from app.core.security import (
    get_db,
    get_current_user,
    require_permission,
    require_any_permission,
)
from app.core.permissions import (
    PROJECT_CREATE,
    PROJECT_VIEW_ALL,
    PROJECT_VIEW_ASSIGNED,
    PROJECT_EDIT,
    PROJECT_DELETE,
    PROJECT_CLOSE,
    PROJECT_APPROVE,
)
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.project import Project, ProjectMethodology, ProjectStatus, ReviewStatus
from app.models.user import User
from app.models.project_member import ProjectMember
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType
from app.services.permission_service import has_permission, has_any_permission

router = APIRouter(prefix="/projects", tags=["Projects"])

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
    """Check if user has global project view (admin-equivalent)."""
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

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_CREATE))
):
    """Create a new project. Only ADMIN can create projects."""
    project = Project(
        name=project_data.name,
        description=project_data.description,
        methodology=project_data.methodology,
        status=ProjectStatus.PENDING,
        review_status=ReviewStatus.PENDING,
        created_by=current_user.id,
        start_date=project_data.start_date,
        end_date=project_data.end_date
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="create",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status_filter: ProjectStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get projects.
    - Admin users see all projects (unless CLIENT role)
    - CLIENT users see only projects they are assigned to
    - Other users see only projects they are assigned to (any role)
    """
    # Permission gate (with CLIENT fallback for read-only access)
    if not has_any_permission(db, current_user.id, [PROJECT_VIEW_ALL, PROJECT_VIEW_ASSIGNED]) and not is_client(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these permissions required: {PROJECT_VIEW_ALL}, {PROJECT_VIEW_ASSIGNED}"
        )

    # CLIENT users are ALWAYS restricted to assigned projects
    if is_client(db, current_user.id):
        query = db.query(Project).join(ProjectMember, Project.id == ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        )
    # Check if user has PROJECT_VIEW_ALL permission (admin)
    elif has_permission(db, current_user.id, PROJECT_VIEW_ALL):
        # Admin sees all projects
        query = db.query(Project).filter(Project.is_deleted == False)
    else:
        # Non-admin users see only assigned projects
        query = db.query(Project).join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id,
            Project.is_deleted == False,
            ProjectMember.is_deleted == False
        )

    if status_filter:
        query = query.filter(Project.status == status_filter)

    projects = query.offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project by ID. Only accessible to project members or admin."""
    # Permission gate (with CLIENT fallback for read-only access)
    if not has_permission(db, current_user.id, PROJECT_VIEW_ASSIGNED) and not is_client(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {PROJECT_VIEW_ASSIGNED}"
        )

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if not can_access_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project"
        )
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_EDIT))
):
    """Update a project. Requires PROJECT_EDIT permission and project access."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if not can_access_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project"
        )
    
    # Track status change
    status_changed = project_data.status and project_data.status != project.status
    
    # Update fields
    update_data = project_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="update",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return project

@router.post("/{project_id}/request-completion", response_model=ProjectResponse)
def request_project_completion(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_CLOSE))
):
    """Request project completion. PM can request, sets review_status to PENDING."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if not can_access_project(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project"
        )
    
    if project.status != ProjectStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only IN_PROGRESS projects can be completed"
        )
    
    project.status = ProjectStatus.COMPLETED
    project.review_status = ReviewStatus.PENDING
    project.review_requested_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="completion_requested",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return project

@router.post("/{project_id}/approve", response_model=ProjectResponse)
def approve_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_APPROVE))
):
    """Approve project completion. Only ADMIN can approve."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.review_status != ReviewStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not pending approval"
        )
    
    project.review_status = ReviewStatus.APPROVED
    project.status = ProjectStatus.CLOSED
    project.reviewed_at = datetime.utcnow()
    project.reviewed_by = current_user.id
    db.commit()
    db.refresh(project)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="approved",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return project

@router.post("/{project_id}/reject", response_model=ProjectResponse)
def reject_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_APPROVE))
):
    """Reject project completion. Only ADMIN can reject."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    project.review_status = ReviewStatus.REJECTED
    project.reviewed_at = datetime.utcnow()
    project.reviewed_by = current_user.id
    db.commit()
    db.refresh(project)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="rejected",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_DELETE))
):
    """Soft delete a project. Requires PROJECT_DELETE permission."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Soft delete
    project.is_deleted = True
    project.deleted_at = datetime.utcnow()
    db.commit()
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="delete",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return None
