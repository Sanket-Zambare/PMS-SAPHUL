"""
Permission service to fetch and check user permissions.
All authorization must use permissions, not roles directly.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.project_member import ProjectMember, ProjectMemberRole

def get_user_permissions(db: Session, user_id: int) -> list[str]:
    """
    Get all permission codes for a user based on their roles and project assignments.
    If a user is assigned as PROJECT_MANAGER for any project, they get PROJECT_MANAGER permissions.
    Returns empty list if user has no roles or permissions.
    Must not crash if data is missing.
    """
    try:
        # Get user roles
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == user_id
        ).all()

        role_ids = [ur.role_id for ur in user_roles] if user_roles else []

        # Check if user is a project manager for any project
        project_manager_assignments = db.query(ProjectMember).filter(
            ProjectMember.user_id == user_id,
            ProjectMember.role == ProjectMemberRole.PROJECT_MANAGER,
            ProjectMember.is_deleted == False
        ).all()

        # If user is a project manager for any project, add PROJECT_MANAGER role permissions
        if project_manager_assignments:
            pm_role = db.query(Role).filter(Role.name == "PROJECT_MANAGER").first()
            if pm_role and pm_role.id not in role_ids:
                role_ids.append(pm_role.id)

        if not role_ids:
            return []

        # Get permissions for these roles
        role_permissions = db.query(RolePermission).filter(
            RolePermission.role_id.in_(role_ids)
        ).all()

        if not role_permissions:
            return []

        permission_ids = [rp.permission_id for rp in role_permissions]

        # Get permission codes
        permissions = db.query(Permission).filter(
            Permission.id.in_(permission_ids)
        ).all()

        return [p.code for p in permissions]
    except Exception as e:
        print(f"Error fetching permissions: {e}")
        return []  # Fail gracefully - return empty list

def get_user_roles(db: Session, user_id: int) -> list[str]:
    """
    Get role names for a user.
    Returns empty list if user has no roles.
    """
    try:
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == user_id
        ).all()
        
        if not user_roles:
            return []
        
        role_ids = [ur.role_id for ur in user_roles]
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        
        return [r.name for r in roles]
    except Exception as e:
        print(f"Error fetching roles: {e}")
        return []

def has_permission(db: Session, user_id: int, permission_code: str) -> bool:
    """
    Check if user has a specific permission.
    Returns False if permission check fails (fail-safe).
    """
    try:
        permissions = get_user_permissions(db, user_id)
        return permission_code in permissions
    except Exception as e:
        print(f"Error checking permission: {e}")
        return False

def has_any_permission(db: Session, user_id: int, permission_codes: list[str]) -> bool:
    """
    Check if user has any of the specified permissions.
    Returns False if check fails.
    """
    try:
        permissions = get_user_permissions(db, user_id)
        return any(code in permissions for code in permission_codes)
    except Exception as e:
        print(f"Error checking permissions: {e}")
        return False

def has_all_permissions(db: Session, user_id: int, permission_codes: list[str]) -> bool:
    """
    Check if user has all specified permissions.
    Returns False if check fails.
    """
    try:
        permissions = get_user_permissions(db, user_id)
        return all(code in permissions for code in permission_codes)
    except Exception as e:
        print(f"Error checking permissions: {e}")
        return False


