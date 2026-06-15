"""
Admin routes for user management (view all users, change roles).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_db, get_current_user, require_permission
from app.core.permissions import USER_VIEW_ALL, USER_MANAGE_ROLES, PROJECT_CREATE
from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.project import Project, ProjectStatus, ReviewStatus
from app.schemas.user import UserResponse, UserWithRoles
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType
from pydantic import BaseModel

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

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

class RoleChange(BaseModel):
    role_name: str


@admin_router.get("/users", response_model=list[UserWithRoles])
def list_users(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_VIEW_ALL))
):
    """List all users (excluding soft-deleted). Requires USER_VIEW_ALL permission."""
    users = db.query(User).filter(User.is_deleted == False).offset(skip).limit(limit).all()

    # Get roles and permissions for each user
    from app.services.permission_service import get_user_roles, get_user_permissions

    result = []
    for user in users:
        roles = get_user_roles(db, user.id)
        permissions = get_user_permissions(db, user.id)

        # Convert to dict and add roles/permissions
        user_dict = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "job_title": user.job_title,
            "department": user.department,
            "status": user.status,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "roles": roles,
            "permissions": permissions,
            "role": roles[0] if roles else "MEMBER"  # Primary role for display
        }
        result.append(user_dict)

    return result


@admin_router.post("/users/{user_id}/promote-to-pm", status_code=status.HTTP_200_OK)
def promote_to_project_manager(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Promote a MEMBER to PROJECT_MANAGER. Requires USER_MANAGE_ROLES permission. Cannot self-promote."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if user is currently a MEMBER
    member_role = db.query(Role).filter(Role.name == "MEMBER").first()
    pm_role = db.query(Role).filter(Role.name == "PROJECT_MANAGER").first()
    if not member_role or not pm_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Roles not found")

    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == member_role.id
    ).first()
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a MEMBER and cannot be promoted to PROJECT_MANAGER"
        )

    # Remove MEMBER role
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.commit()

    # Assign PROJECT_MANAGER role
    db.add(UserRole(user_id=user_id, role_id=pm_role.id))
    db.commit()

    return {"message": "User promoted to PROJECT_MANAGER"}

@admin_router.post("/users/{user_id}/demote-to-member", status_code=status.HTTP_200_OK)
def demote_to_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Demote a PROJECT_MANAGER to MEMBER. Requires USER_MANAGE_ROLES permission. Cannot self-demote."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if user is currently a PROJECT_MANAGER
    member_role = db.query(Role).filter(Role.name == "MEMBER").first()
    pm_role = db.query(Role).filter(Role.name == "PROJECT_MANAGER").first()
    if not member_role or not pm_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Roles not found")

    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == pm_role.id
    ).first()
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a PROJECT_MANAGER and cannot be demoted to MEMBER"
        )

    # Remove PROJECT_MANAGER role
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.commit()

    # Assign MEMBER role
    db.add(UserRole(user_id=user_id, role_id=member_role.id))
    db.commit()

    return {"message": "User demoted to MEMBER"}

@admin_router.post("/users/{user_id}/make-admin", status_code=status.HTTP_200_OK)
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Promote any user to ADMIN."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    if not admin_role:
        raise HTTPException(status_code=500, detail="ADMIN role not found")

    already = db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role_id == admin_role.id).first()
    if already:
        raise HTTPException(status_code=400, detail="User is already an ADMIN")

    # Remove all existing roles, assign ADMIN
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.add(UserRole(user_id=user_id, role_id=admin_role.id))
    db.commit()

    return {"message": "User promoted to ADMIN"}

@admin_router.post("/users/{user_id}/remove-admin", status_code=status.HTTP_200_OK)
def remove_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Demote an ADMIN back to MEMBER."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    member_role = db.query(Role).filter(Role.name == "MEMBER").first()
    if not admin_role or not member_role:
        raise HTTPException(status_code=500, detail="Roles not found")

    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.add(UserRole(user_id=user_id, role_id=member_role.id))
    db.commit()

    return {"message": "User demoted to MEMBER"}

@admin_router.post("/users/{user_id}/deactivate", status_code=status.HTTP_200_OK)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Deactivate (soft-disable) a user. They cannot log in but data is preserved."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = UserStatus.INACTIVE
    db.commit()
    return {"message": "User deactivated"}

@admin_router.post("/users/{user_id}/activate", status_code=status.HTTP_200_OK)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(USER_MANAGE_ROLES))
):
    """Re-activate a deactivated user."""
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = UserStatus.ACTIVE
    db.commit()
    return {"message": "User activated"}

@admin_router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project_admin(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(PROJECT_CREATE))
):
    """Create a new project. Only ADMIN can create projects via admin route."""
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






