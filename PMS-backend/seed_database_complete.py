"""
Complete database seeding script with roles, permissions, and initial data.
This ensures the system has all required roles, permissions, and at least one admin.
"""
from app.database import SessionLocal
from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.project import Project, ProjectMethodology, ProjectStatus, ReviewStatus
from app.models.sprint import Sprint
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.task import Task, TaskStatus, TaskReviewStatus, TaskApprovalStatus, TaskPriority
from app.models.time_log import TimeLog
from app.models.activity_log import ActivityLog, EntityType
from app.models.approval import Approval, ApprovalEntityType, ApprovalStatus as ApprovalStatusEnum
from app.core.security import get_password_hash
from datetime import datetime, timedelta, date
from decimal import Decimal

def seed_database():
    from app.database import engine
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Starting complete database seeding...")
        print("=" * 60)
        
        # Step 1: Create Roles
        print("\n1. Creating roles...")
        roles_data = [
            {"name": "ADMIN"},
            {"name": "PROJECT_MANAGER"},
            {"name": "MEMBER"},
            {"name": "CLIENT"},
            {"name": "QA"},
        ]
        
        roles_dict = {}
        for role_data in roles_data:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                role = Role(**role_data)
                db.add(role)
            roles_dict[role_data["name"]] = role
        
        db.commit()
        for role_name, role in roles_dict.items():
            db.refresh(role)
        print(f"   ✓ Created {len(roles_dict)} roles")
        
        # Step 2: Create Permissions
        print("\n2. Creating permissions...")
        permissions_data = [
            # Project permissions
            {"code": "PROJECT_CREATE"},
            {"code": "PROJECT_VIEW_ALL"},
            {"code": "PROJECT_VIEW_ASSIGNED"},
            {"code": "PROJECT_EDIT"},
            {"code": "PROJECT_DELETE"},
            {"code": "PROJECT_CLOSE"},
            {"code": "PROJECT_APPROVE"},
            # Task permissions
            {"code": "TASK_CREATE"},
            {"code": "TASK_VIEW"},
            {"code": "TASK_EDIT"},
            {"code": "TASK_DELETE"},
            {"code": "TASK_ASSIGN"},
            {"code": "TASK_APPROVE"},
            # User permissions
            {"code": "USER_CREATE"},
            {"code": "USER_VIEW"},
            {"code": "USER_VIEW_ALL"},
            {"code": "USER_EDIT"},
            {"code": "USER_DELETE"},
            {"code": "USER_ASSIGN_ROLE"},
            {"code": "USER_MANAGE_ROLES"},
            # Sprint permissions
            {"code": "SPRINT_CREATE"},
            {"code": "SPRINT_VIEW"},
            {"code": "SPRINT_EDIT"},
            {"code": "SPRINT_DELETE"},
            # Time log permissions
            {"code": "TIME_LOG_CREATE"},
            {"code": "TIME_LOG_VIEW"},
            {"code": "TIME_LOG_EDIT"},
            {"code": "TIME_LOG_DELETE"},
            # File permissions
            {"code": "FILE_UPLOAD"},
            {"code": "FILE_VIEW"},
            {"code": "FILE_DELETE"},
            # Billing permissions
            {"code": "BILLING_VIEW"},
            {"code": "BILLING_EDIT"},
            # Dashboard permissions
            {"code": "DASHBOARD_VIEW"},
        ]
        
        permissions_dict = {}
        for perm_data in permissions_data:
            perm = db.query(Permission).filter(Permission.code == perm_data["code"]).first()
            if not perm:
                perm = Permission(**perm_data)
                db.add(perm)
            permissions_dict[perm_data["code"]] = perm
        
        db.commit()
        for perm_code, perm in permissions_dict.items():
            db.refresh(perm)
        print(f"   ✓ Created {len(permissions_dict)} permissions")
        
        # Step 3: Assign permissions to roles
        print("\n3. Assigning permissions to roles...")
        
        # ADMIN gets all permissions
        admin_permissions = list(permissions_dict.keys())
        for perm_code in admin_permissions:
            role_perm = db.query(RolePermission).filter(
                RolePermission.role_id == roles_dict["ADMIN"].id,
                RolePermission.permission_id == permissions_dict[perm_code].id
            ).first()
            if not role_perm:
                role_perm = RolePermission(
                    role_id=roles_dict["ADMIN"].id,
                    permission_id=permissions_dict[perm_code].id
                )
                db.add(role_perm)
        
        # PROJECT_MANAGER permissions
        pm_permissions = [
            "PROJECT_VIEW_ASSIGNED",
            "TASK_CREATE", "TASK_VIEW", "TASK_EDIT", "TASK_APPROVE",
            "USER_VIEW",
            "TIME_LOG_CREATE",
            "SPRINT_CREATE", "SPRINT_VIEW", "SPRINT_EDIT", "SPRINT_DELETE",
            "DASHBOARD_VIEW",
        ]
        for perm_code in pm_permissions:
            if perm_code in permissions_dict:
                role_perm = db.query(RolePermission).filter(
                    RolePermission.role_id == roles_dict["PROJECT_MANAGER"].id,
                    RolePermission.permission_id == permissions_dict[perm_code].id
                ).first()
                if not role_perm:
                    role_perm = RolePermission(
                        role_id=roles_dict["PROJECT_MANAGER"].id,
                        permission_id=permissions_dict[perm_code].id
                    )
                    db.add(role_perm)
        
        # MEMBER permissions
        member_permissions = [
            "PROJECT_VIEW_ASSIGNED",
            "TASK_VIEW",
            "USER_VIEW",
            "TIME_LOG_CREATE",
            "DASHBOARD_VIEW",
        ]
        for perm_code in member_permissions:
            if perm_code in permissions_dict:
                role_perm = db.query(RolePermission).filter(
                    RolePermission.role_id == roles_dict["MEMBER"].id,
                    RolePermission.permission_id == permissions_dict[perm_code].id
                ).first()
                if not role_perm:
                    role_perm = RolePermission(
                        role_id=roles_dict["MEMBER"].id,
                        permission_id=permissions_dict[perm_code].id
                    )
                    db.add(role_perm)
        
        # CLIENT permissions
        client_permissions = [
            "PROJECT_VIEW_ASSIGNED",
            "TASK_VIEW", "TASK_APPROVE",
            "USER_VIEW",
            "DASHBOARD_VIEW",
        ]
        for perm_code in client_permissions:
            if perm_code in permissions_dict:
                role_perm = db.query(RolePermission).filter(
                    RolePermission.role_id == roles_dict["CLIENT"].id,
                    RolePermission.permission_id == permissions_dict[perm_code].id
                ).first()
                if not role_perm:
                    role_perm = RolePermission(
                        role_id=roles_dict["CLIENT"].id,
                        permission_id=permissions_dict[perm_code].id
                    )
                    db.add(role_perm)
        
        db.commit()
        print("   ✓ Permissions assigned to roles")
        
        # Step 4: Create Users
        print("\n4. Creating users...")
        users = [
            {
                "name": "Admin User",
                "email": "admin@saphul.com",
                "password": "admin123",
                "job_title": "System Administrator",
                "department": "IT",
                "roles": ["ADMIN"]
            },
            {
                "name": "John Manager",
                "email": "john@example.com",
                "password": "password123",
                "job_title": "Project Manager",
                "department": "Engineering",
                "roles": ["PROJECT_MANAGER"]
            },
            {
                "name": "Sarah Developer",
                "email": "sarah@example.com",
                "password": "password123",
                "job_title": "Senior Developer",
                "department": "Engineering",
                "roles": ["MEMBER"]
            },
            {
                "name": "Mike Designer",
                "email": "mike@example.com",
                "password": "password123",
                "job_title": "UI/UX Designer",
                "department": "Design",
                "roles": ["MEMBER"]
            },
            {
                "name": "Client User",
                "email": "client@example.com",
                "password": "password123",
                "job_title": "Product Owner",
                "department": "Client",
                "roles": ["CLIENT"]
            },
        ]
        
        created_users = []
        for user_data in users:
            existing_user = db.query(User).filter(
                User.email == user_data["email"],
                User.is_deleted == False
            ).first()
            
            if not existing_user:
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    password=get_password_hash(user_data["password"]),
                    job_title=user_data.get("job_title"),
                    department=user_data.get("department"),
                    status=UserStatus.ACTIVE
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                created_users.append((user, user_data["roles"]))
            else:
                created_users.append((existing_user, user_data["roles"]))
        
        # Assign roles to users
        for user, role_names in created_users:
            for role_name in role_names:
                if role_name in roles_dict:
                    user_role = db.query(UserRole).filter(
                        UserRole.user_id == user.id,
                        UserRole.role_id == roles_dict[role_name].id
                    ).first()
                    if not user_role:
                        user_role = UserRole(
                            user_id=user.id,
                            role_id=roles_dict[role_name].id
                        )
                        db.add(user_role)
        
        db.commit()
        print(f"   ✓ Created {len(created_users)} users with roles")
        
        # Step 5: Create Projects
        print("\n5. Creating projects...")
        admin_user = created_users[0][0]
        projects_data = [
            {
                "name": "Website Redesign",
                "description": "Complete redesign of the company website with modern UI/UX",
                "methodology": ProjectMethodology.AGILE,
                "status": ProjectStatus.IN_PROGRESS,
                "review_status": ReviewStatus.PENDING,
                "created_by": admin_user.id,
                "start_date": date.today() - timedelta(days=10),
                "end_date": date.today() + timedelta(days=50),
            },
            {
                "name": "Mobile App Development",
                "description": "Develop a cross-platform mobile application",
                "methodology": ProjectMethodology.AGILE,
                "status": ProjectStatus.PENDING,
                "review_status": ReviewStatus.PENDING,
                "created_by": admin_user.id,
            },
            {
                "name": "Legacy System Migration",
                "description": "Migrate legacy system to new architecture",
                "methodology": ProjectMethodology.WATERFALL,
                "status": ProjectStatus.IN_PROGRESS,
                "review_status": ReviewStatus.PENDING,
                "created_by": admin_user.id,
                "start_date": date.today() - timedelta(days=15),
                "end_date": date.today() + timedelta(days=30),
            },
        ]

        projects = []
        for project_data in projects_data:
            existing_project = db.query(Project).filter(
                Project.name == project_data["name"],
                Project.is_deleted == False
            ).first()

            if not existing_project:
                project = Project(**project_data)
                db.add(project)
                db.commit()
                db.refresh(project)
                projects.append(project)
            else:
                projects.append(existing_project)

        print(f"   ✓ Found/Created {len(projects)} projects")
        
        # Step 6: Create Project Members
        print("\n6. Creating project members...")
        pm_user = created_users[1][0]
        member_user = created_users[2][0]
        client_user = created_users[4][0]  # Client user

        project_members_data = [
            {
                "project_id": projects[0].id,
                "user_id": pm_user.id,
                "role": ProjectMemberRole.PROJECT_MANAGER
            },
            {
                "project_id": projects[0].id,
                "user_id": member_user.id,
                "role": ProjectMemberRole.MEMBER
            },
            {
                "project_id": projects[0].id,
                "user_id": client_user.id,
                "role": ProjectMemberRole.MEMBER
            },
            {
                "project_id": projects[1].id,
                "user_id": pm_user.id,
                "role": ProjectMemberRole.PROJECT_MANAGER
            },
            {
                "project_id": projects[1].id,
                "user_id": client_user.id,
                "role": ProjectMemberRole.MEMBER
            },
        ]

        project_members = []
        for member_data in project_members_data:
            existing_member = db.query(ProjectMember).filter(
                ProjectMember.project_id == member_data["project_id"],
                ProjectMember.user_id == member_data["user_id"],
                ProjectMember.role == member_data["role"],
                ProjectMember.is_deleted == False
            ).first()

            if not existing_member:
                member = ProjectMember(**member_data)
                db.add(member)
                project_members.append(member)

        db.commit()
        print(f"   ✓ Created {len(project_members)} project members")
        
        # Step 7: Create Sprints (for Agile projects)
        print("\n7. Creating sprints...")
        sprints_data = [
            {
                "project_id": projects[0].id,
                "name": "Sprint 1 - Foundation",
                "start_date": date.today() - timedelta(days=7),
                "end_date": date.today() + timedelta(days=7),
                "status": "ACTIVE"
            },
            {
                "project_id": projects[0].id,
                "name": "Sprint 2 - Features",
                "start_date": date.today() + timedelta(days=8),
                "end_date": date.today() + timedelta(days=22),
                "status": "PLANNED"
            },
        ]

        sprints = []
        for sprint_data in sprints_data:
            existing_sprint = db.query(Sprint).filter(
                Sprint.name == sprint_data["name"],
                Sprint.project_id == sprint_data["project_id"]
            ).first()

            if not existing_sprint:
                sprint = Sprint(**sprint_data)
                db.add(sprint)
                sprints.append(sprint)

        db.commit()
        for sprint in sprints:
            db.refresh(sprint)
        print(f"   ✓ Created {len(sprints)} sprints")
        
        # Step 8: Create Tasks
        print("\n8. Creating tasks...")
        tasks_data = [
            {
                "project_id": projects[0].id,
                "sprint_id": sprints[0].id,
                "backlog_order": 1,
                "title": "Design Homepage Layout",
                "description": "Create wireframes and mockups",
                "assigned_to": member_user.id,
                "created_by": pm_user.id,
                "status": TaskStatus.IN_PROGRESS,
                "review_status": TaskReviewStatus.NONE,
                "approval_status": TaskApprovalStatus.NONE,
                "priority": TaskPriority.HIGH,
                "due_date": date.today() + timedelta(days=7),
                "estimated_hours": Decimal("8.0"),
                "billable": True,
                "billing_rate": Decimal("100.00"),
            },
            {
                "project_id": projects[0].id,
                "sprint_id": sprints[0].id,
                "backlog_order": 2,
                "title": "Implement Authentication",
                "description": "Set up JWT-based authentication",
                "assigned_to": member_user.id,
                "created_by": pm_user.id,
                "status": TaskStatus.DONE,
                "review_status": TaskReviewStatus.APPROVED,
                "approval_status": TaskApprovalStatus.APPROVED,
                "priority": TaskPriority.HIGH,
                "due_date": date.today() - timedelta(days=2),
                "completed_at": datetime.utcnow() - timedelta(days=2),
                "estimated_hours": Decimal("16.0"),
                "actual_hours": Decimal("14.5"),
                "billable": True,
                "billing_rate": Decimal("100.00"),
            },
            {
                "project_id": projects[1].id,
                "backlog_order": 1,
                "title": "Setup Development Environment",
                "description": "Configure React Native environment",
                "assigned_to": member_user.id,
                "created_by": pm_user.id,
                "status": TaskStatus.TODO,
                "review_status": TaskReviewStatus.NONE,
                "approval_status": TaskApprovalStatus.NONE,
                "priority": TaskPriority.MEDIUM,
                "due_date": date.today() + timedelta(days=20),
                "estimated_hours": Decimal("4.0"),
            },
        ]

        tasks = []
        for task_data in tasks_data:
            existing_task = db.query(Task).filter(
                Task.title == task_data["title"],
                Task.project_id == task_data["project_id"],
                Task.is_deleted == False
            ).first()

            if not existing_task:
                task = Task(**task_data)
                db.add(task)
                tasks.append(task)

        db.commit()
        for task in tasks:
            db.refresh(task)
        print(f"   ✓ Created {len(tasks)} tasks")
        
        # Step 9: Create Time Logs
        print("\n9. Creating time logs...")
        time_logs = [
            TimeLog(
                task_id=tasks[1].id,
                user_id=member_user.id,
                log_date=date.today() - timedelta(days=3),
                hours=Decimal("4.0"),
                description="Implemented JWT authentication"
            ),
            TimeLog(
                task_id=tasks[1].id,
                user_id=member_user.id,
                log_date=date.today() - timedelta(days=2),
                hours=Decimal("6.5"),
                description="Added refresh token functionality"
            ),
            TimeLog(
                task_id=tasks[0].id,
                user_id=member_user.id,
                log_date=date.today(),
                hours=Decimal("2.0"),
                description="Working on homepage design"
            ),
        ]
        
        for time_log in time_logs:
            db.add(time_log)
        db.commit()
        print(f"   ✓ Created {len(time_logs)} time logs")
        
        # Step 10: Create Activity Logs
        print("\n10. Creating activity logs...")
        activity_logs_data = [
            {
                "entity_type": EntityType.PROJECT,
                "entity_id": projects[0].id,
                "action": "create",
                "performed_by": admin_user.id,
            },
            {
                "entity_type": EntityType.TASK,
                "entity_id": tasks[0].id,
                "action": "create",
                "performed_by": pm_user.id,
            },
            {
                "entity_type": EntityType.TASK,
                "entity_id": tasks[1].id,
                "action": "update",
                "performed_by": member_user.id,
            },
        ]

        activity_logs = []
        for log_data in activity_logs_data:
            existing_log = db.query(ActivityLog).filter(
                ActivityLog.entity_type == log_data["entity_type"],
                ActivityLog.entity_id == log_data["entity_id"],
                ActivityLog.action == log_data["action"],
                ActivityLog.performed_by == log_data["performed_by"]
            ).first()

            if not existing_log:
                log = ActivityLog(**log_data)
                db.add(log)
                activity_logs.append(log)

        db.commit()
        print(f"   ✓ Created {len(activity_logs)} activity logs")
        
        print("\n" + "=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print("\nLogin Credentials:")
        print("  Admin: admin@saphul.com / admin123")
        print("  PM: john@example.com / password123")
        print("  Member: sarah@example.com / password123")
        print("  Client: client@example.com / password123")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

