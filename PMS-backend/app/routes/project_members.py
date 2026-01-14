"""
Project member routes with permission-based authorization.
Admin can assign PM and members to projects.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    PROJECT_EDIT,
    PROJECT_VIEW_ASSIGNED,
)
from app.schemas.project_member import ProjectMemberCreate, ProjectMemberResponse
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.project import Project
from app.models.user import User
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType
from app.services.permission_service import has_permission

router = APIRouter(prefix="/project-members", tags=["Project Members"])

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

@router.post("/", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_project_member(
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a member to a project. 
    - ADMIN can add anyone to any project
    - Others need PROJECT_EDIT permission
    """
    # Check if admin or has permission
    if not is_admin(db, current_user.id) and not has_permission(db, current_user.id, PROJECT_EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    # Verify project exists
    project = db.query(Project).filter(
        Project.id == member_data.project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify user exists
    user = db.query(User).filter(
        User.id == member_data.user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if member already exists (including soft-deleted)
    existing_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == member_data.project_id,
        ProjectMember.user_id == member_data.user_id
    ).first()
    
    if existing_member:
        if existing_member.is_deleted:
            # Restore soft-deleted member
            existing_member.is_deleted = False
            existing_member.deleted_at = None
            existing_member.role = member_data.role
            db.commit()
            db.refresh(existing_member)
            return existing_member
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this project"
            )
    
    member = ProjectMember(
        project_id=member_data.project_id,
        user_id=member_data.user_id,
        role=member_data.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=project.id,
            action="member_added",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return member

@router.get("/project/{project_id}", response_model=List[ProjectMemberResponse])
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_VIEW_ASSIGNED))
):
    """Get all members of a project. Requires PROJECT_VIEW_ASSIGNED permission."""
    # Verify project exists
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.is_deleted == False
    ).all()
    return members

@router.get("/user/{user_id}", response_model=List[ProjectMemberResponse])
def get_user_projects(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all projects for a user.
    - ADMIN can view anyone's projects
    - Users can view their own projects
    """
    # Check if admin or viewing own projects
    if not is_admin(db, current_user.id) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    # Verify user exists
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    members = db.query(ProjectMember).filter(
        ProjectMember.user_id == user_id,
        ProjectMember.is_deleted == False
    ).all()
    return members

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a member from a project.
    - ADMIN can remove anyone
    - Others need PROJECT_EDIT permission
    """
    # Check if admin or has permission
    if not is_admin(db, current_user.id) and not has_permission(db, current_user.id, PROJECT_EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.is_deleted == False
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project member not found"
        )

    # Soft delete
    member.is_deleted = True
    member.deleted_at = datetime.utcnow()
    db.commit()

    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,
            entity_id=member.project_id,
            action="member_removed",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")

    return None
