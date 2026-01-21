import sys
sys.path.append('PMS-backend')

from app.database import SessionLocal
from app.models.user import User
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.user_role import UserRole
from app.models.role import Role

db = SessionLocal()

try:
    # Check john@example.com
    user = db.query(User).filter(User.email == 'john@example.com').first()
    print(f"User john@example.com found: {user is not None}")

    if user:
        # Check user roles
        user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        print(f"User roles: {[r.name for r in roles]}")

        # Check project manager assignments
        pm_assignments = db.query(ProjectMember).filter(
            ProjectMember.user_id == user.id,
            ProjectMember.role == ProjectMemberRole.PROJECT_MANAGER
        ).all()
        print(f"Project manager assignments: {len(pm_assignments)}")

    # Check sarah@example.com (MEMBER)
    member_user = db.query(User).filter(User.email == 'sarah@example.com').first()
    print(f"\nUser sarah@example.com found: {member_user is not None}")

    if member_user:
        # Check user roles
        user_roles = db.query(UserRole).filter(UserRole.user_id == member_user.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        print(f"User roles: {[r.name for r in roles]}")

        # Check project manager assignments
        pm_assignments = db.query(ProjectMember).filter(
            ProjectMember.user_id == member_user.id,
            ProjectMember.role == ProjectMemberRole.PROJECT_MANAGER
        ).all()
        print(f"Project manager assignments: {len(pm_assignments)}")

finally:
    db.close()
