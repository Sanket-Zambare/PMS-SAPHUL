import sys
sys.path.append('PMS-backend')

from app.database import SessionLocal
from app.models.user import User
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.user_role import UserRole
from app.models.role import Role
from app.models.project import Project

db = SessionLocal()

try:
    # Check client@example.com
    user = db.query(User).filter(User.email == 'client@example.com').first()
    print(f"User client@example.com found: {user is not None}")

    if user:
        # Check user roles
        user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        print(f"User roles: {[r.name for r in roles]}")

        # Check project assignments
        assignments = db.query(ProjectMember).filter(
            ProjectMember.user_id == user.id,
            ProjectMember.is_deleted == False
        ).all()
        print(f"Project assignments: {len(assignments)}")

        for assignment in assignments:
            project = db.query(Project).filter(Project.id == assignment.project_id).first()
            if project:
                print(f"  - Project: {project.name}, Role: {assignment.role}")

        # Check all projects
        all_projects = db.query(Project).filter(Project.is_deleted == False).all()
        print(f"Total projects in system: {len(all_projects)}")

finally:
    db.close()
