import sys
sys.path.append('PMS-backend')

from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.services.permission_service import has_permission, has_any_permission

db = SessionLocal()

try:
    # Get client user
    user = db.query(User).filter(User.email == 'client@example.com').first()
    if not user:
        print("Client user not found")
        exit()

    print(f"User: {user.email}, ID: {user.id}")

    # Get user roles
    user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    print(f"Roles: {[r.name for r in roles]}")

    # Get permissions for each role
    for role in roles:
        role_permissions = db.query(RolePermission).filter(RolePermission.role_id == role.id).all()
        perm_ids = [rp.permission_id for rp in role_permissions]
        permissions = db.query(Permission).filter(Permission.id.in_(perm_ids)).all()
        print(f"Role {role.name} permissions: {[p.code for p in permissions]}")

    # Test specific permissions
    print("\nTesting permissions:")
    print(f"PROJECT_VIEW_ALL: {has_permission(db, user.id, 'PROJECT_VIEW_ALL')}")
    print(f"PROJECT_VIEW_ASSIGNED: {has_permission(db, user.id, 'PROJECT_VIEW_ASSIGNED')}")
    print(f"has_any_permission [PROJECT_VIEW_ALL, PROJECT_VIEW_ASSIGNED]: {has_any_permission(db, user.id, ['PROJECT_VIEW_ALL', 'PROJECT_VIEW_ASSIGNED'])}")

finally:
    db.close()
