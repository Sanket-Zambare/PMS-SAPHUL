"""
Admin routes for user management (view all users, change roles).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_db, get_current_user, require_permission
from app.core.permissions import USER_VIEW_ALL, USER_MANAGE_ROLES
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.schemas.user import UserResponse, UserWithRoles
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


