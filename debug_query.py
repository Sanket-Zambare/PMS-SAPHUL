import sys
sys.path.append('PMS-backend')

from app.database import SessionLocal
from app.models.user import User
from app.models.project_member import ProjectMember
from app.models.project import Project

db = SessionLocal()

try:
    # Get client user
    user = db.query(User).filter(User.email == 'client@example.com').first()
    if not user:
        print("Client user not found")
        exit()

    print(f"User ID: {user.id}")

    # Check ProjectMember records
    members = db.query(ProjectMember).filter(
        ProjectMember.user_id == user.id,
        ProjectMember.is_deleted == False
    ).all()
    print(f"ProjectMember records: {len(members)}")
    for m in members:
        print(f"  Member ID: {m.id}, Project ID: {m.project_id}, Role: {m.role}, Deleted: {m.is_deleted}")

    # Check projects
    projects = db.query(Project).filter(Project.is_deleted == False).all()
    print(f"Total projects: {len(projects)}")
    for p in projects:
        print(f"  Project ID: {p.id}, Name: {p.name}, Deleted: {p.is_deleted}")

    # Try the join query
    query = db.query(Project).join(ProjectMember).filter(
        ProjectMember.user_id == user.id,
        Project.is_deleted == False,
        ProjectMember.is_deleted == False
    )
    results = query.all()
    print(f"Join query results: {len(results)}")
    for r in results:
        print(f"  Project: {r.name}")

finally:
    db.close()
