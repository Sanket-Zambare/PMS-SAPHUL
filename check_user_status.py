import sys
sys.path.append('PMS-backend')

from app.database import SessionLocal
from app.services.permission_service import get_user_permissions, get_user_roles

def fix_user_role(email):
    db = SessionLocal()
    try:
from app.models.user import User
from app.models.user_role import UserRole
from app.models.role import Role
        user = db.query(User).filter(User.email == email, User.is_deleted == False).first()
        if not user:
            print(f"❌ User {email} not found")
            return

        print(f"✅ Found user: {user.name} ({user.email})")

        # Get roles
        member_role = db.query(Role).filter(Role.name == "MEMBER").first()
        pm_role = db.query(Role).filter(Role.name == "PROJECT_MANAGER").first()

        if not member_role or not pm_role:
            print("❌ Roles not found")
            return

        # Remove MEMBER role
        member_user_role = db.query(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.role_id == member_role.id
        ).first()
        if member_user_role:
            db.delete(member_user_role)
            print("   Removed MEMBER role")

        # Add PROJECT_MANAGER role
        pm_user_role = db.query(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.role_id == pm_role.id
        ).first()
        if not pm_user_role:
            pm_user_role = UserRole(user_id=user.id, role_id=pm_role.id)
            db.add(pm_user_role)
            print("   Added PROJECT_MANAGER role")

        db.commit()

        # Verify the fix
        roles = get_user_roles(db, user.id)
        permissions = get_user_permissions(db, user.id)

        print(f"   ✅ Fixed - Roles: {roles}")
        print(f"   ✅ Fixed - Permissions: {permissions}")
        print(f"   ✅ Fixed - Has FILE_UPLOAD: {'FILE_UPLOAD' in permissions}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_role("Saurabh13@gmail.com")
