"""
User routes with permission-based authorization.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
    get_password_hash,
)
from app.core.permissions import (
    USER_CREATE,
    USER_VIEW,
    USER_VIEW_ALL,
    USER_EDIT,
    USER_DELETE,
    USER_ASSIGN_ROLE,
    USER_MANAGE_ROLES,
)
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.user_role import UserRole as UserRoleModel
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType
from app.services.permission_service import has_permission

class RoleChange(BaseModel):
    role_name: str

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_CREATE))
):
    """Create a new user. Requires USER_CREATE permission."""
    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email,
        User.is_deleted == False
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=get_password_hash(user_data.password),
        job_title=user_data.job_title,
        department=user_data.department,
        status=user_data.status or UserStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.PROJECT,  # Using available type
            entity_id=0,
            action="user_created",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return user

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_VIEW))
):
    """
    Get users.
    - If user has USER_VIEW_ALL -> return all
    - Else return users from projects they are assigned to (for task assignment display)
    """
    if has_permission(db, current_user.id, USER_VIEW_ALL):
        return db.query(User).filter(User.is_deleted == False).offset(skip).limit(limit).all()

    # Return users from projects the current user is assigned to
    from app.models.project_member import ProjectMember
    user_project_ids = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == current_user.id,
        ProjectMember.is_deleted == False
    ).subquery()

    project_users = db.query(User).join(ProjectMember).filter(
        ProjectMember.project_id.in_(user_project_ids),
        User.is_deleted == False,
        ProjectMember.is_deleted == False
    ).distinct().all()

    # Include current user if not already included
    if current_user not in project_users:
        project_users.append(current_user)

    return project_users

@router.get("/admin/users", response_model=List[UserResponse])
def get_all_users_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_VIEW_ALL))
):
    """Admin: list all users (excluding soft deleted)."""
    users = db.query(User).filter(User.is_deleted == False).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_VIEW))
):
    """Get a specific user by ID."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_EDIT))
):
    """Update a user. Requires USER_EDIT permission."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check email uniqueness if email is being updated
    if user_data.email and user_data.email != user.email:
        existing_user = db.query(User).filter(
            User.email == user_data.email,
            User.is_deleted == False
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update fields
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_DELETE))
):
    """Soft delete a user. Requires USER_DELETE permission."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    db.commit()
    
    return None

@router.post("/admin/users/{user_id}/role", status_code=status.HTTP_200_OK)
def change_user_role(
    user_id: int,
    role_data: RoleChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """
    Change a user's role (admin-only).
    Removes existing roles and sets the new one.
    Users cannot change their own role.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    role = db.query(Role).filter(Role.name == role_data.role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Remove existing roles
    db.query(UserRoleModel).filter(UserRoleModel.user_id == user_id).delete()
    db.commit()
    
    # Assign new role
    user_role = UserRoleModel(user_id=user_id, role_id=role.id)
    db.add(user_role)
    db.commit()
    
    return {"message": f"User role set to {role_data.role_name}"}
