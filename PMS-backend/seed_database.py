"""
Database seeding script to populate initial dummy data.
Run this after creating the database schema.
"""
from app.database import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.models.project import Project, ProjectStatus, ReviewStatus
from app.models.project_member import ProjectMember
from app.models.task import Task, TaskStatus, TaskReviewStatus
from app.models.activity_log import ActivityLog, ActivityType
from app.models.project_task_stats import ProjectTaskStats
from app.core.security import get_password_hash
from datetime import datetime, timedelta
from decimal import Decimal

def seed_database():
    db = SessionLocal()
    try:
        print("Starting database seeding...")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("Clearing existing data...")
        db.query(ActivityLog).delete()
        db.query(ProjectTaskStats).delete()
        db.query(Task).delete()
        db.query(ProjectMember).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()
        
        # Create Users
        print("Creating users...")
        users = [
            User(
                name="Admin User",
                email="admin@saphul.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            ),
            User(
                name="John Manager",
                email="john@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.PROJECT_MANAGER,
                status=UserStatus.ACTIVE
            ),
            User(
                name="Sarah Developer",
                email="sarah@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.MEMBER,
                status=UserStatus.ACTIVE
            ),
            User(
                name="Mike Designer",
                email="mike@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.MEMBER,
                status=UserStatus.ACTIVE
            ),
            User(
                name="Emily Tester",
                email="emily@example.com",
                password_hash=get_password_hash("password123"),
                role=UserRole.MEMBER,
                status=UserStatus.ACTIVE
            ),
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        print(f"Created {len(users)} users")
        
        # Create Projects
        print("Creating projects...")
        projects = [
            Project(
                name="Website Redesign",
                description="Complete redesign of the company website with modern UI/UX",
                status=ProjectStatus.IN_PROGRESS,
                review_status=ReviewStatus.PENDING,
                created_by=users[0].id,
                start_date=datetime.utcnow() - timedelta(days=10),
                end_date=datetime.utcnow() + timedelta(days=50),
            ),
            Project(
                name="Mobile App Development",
                description="Develop a cross-platform mobile application for iOS and Android",
                status=ProjectStatus.PENDING,
                review_status=ReviewStatus.PENDING,
                created_by=users[0].id,
                start_date=None,
                end_date=None,
            ),
            Project(
                name="API Integration",
                description="Integrate third-party APIs for payment processing",
                status=ProjectStatus.COMPLETED,
                review_status=ReviewStatus.APPROVED,
                created_by=users[0].id,
                start_date=datetime.utcnow() - timedelta(days=40),
                end_date=datetime.utcnow() - timedelta(days=20),
            ),
            Project(
                name="Database Migration",
                description="Migrate legacy database to new PostgreSQL schema",
                status=ProjectStatus.IN_PROGRESS,
                review_status=ReviewStatus.PENDING,
                created_by=users[0].id,
                start_date=datetime.utcnow() - timedelta(days=15),
                end_date=datetime.utcnow() + timedelta(days=30),
            ),
        ]
        
        for project in projects:
            db.add(project)
        db.commit()
        
        for project in projects:
            db.refresh(project)
        
        print(f"Created {len(projects)} projects")
        
        # Create Project Members
        print("Creating project members...")
        project_members = [
            ProjectMember(project_id=projects[0].id, user_id=users[1].id),  # Website Redesign - John
            ProjectMember(project_id=projects[0].id, user_id=users[2].id),  # Website Redesign - Sarah
            ProjectMember(project_id=projects[0].id, user_id=users[3].id),  # Website Redesign - Mike
            ProjectMember(project_id=projects[1].id, user_id=users[1].id),  # Mobile App - John
            ProjectMember(project_id=projects[1].id, user_id=users[2].id),  # Mobile App - Sarah
            ProjectMember(project_id=projects[3].id, user_id=users[1].id),  # Database Migration - John
            ProjectMember(project_id=projects[3].id, user_id=users[2].id),  # Database Migration - Sarah
        ]
        
        for member in project_members:
            db.add(member)
        db.commit()
        
        print(f"Created {len(project_members)} project members")
        
        # Create Tasks
        print("Creating tasks...")
        tasks = [
            Task(
                title="Design Homepage Layout",
                description="Create wireframes and mockups for the new homepage",
                status=TaskStatus.IN_PROGRESS,
                review_status=TaskReviewStatus.PENDING,
                progress=Decimal("65.5"),
                project_id=projects[0].id,
                assigned_to=users[3].id,  # Mike
                due_date=datetime.utcnow() + timedelta(days=7),
            ),
            Task(
                title="Implement User Authentication",
                description="Set up JWT-based authentication system",
                status=TaskStatus.COMPLETED,
                review_status=TaskReviewStatus.APPROVED,
                progress=Decimal("100.0"),
                project_id=projects[0].id,
                assigned_to=users[2].id,  # Sarah
                due_date=datetime.utcnow() - timedelta(days=2),
                completed_at=datetime.utcnow() - timedelta(days=2),
            ),
            Task(
                title="Setup Development Environment",
                description="Configure React Native development environment",
                status=TaskStatus.PENDING,
                review_status=TaskReviewStatus.PENDING,
                progress=Decimal("0.0"),
                project_id=projects[1].id,
                assigned_to=users[2].id,  # Sarah
                due_date=datetime.utcnow() + timedelta(days=20),
            ),
            Task(
                title="Payment Gateway Integration",
                description="Integrate Stripe payment gateway",
                status=TaskStatus.COMPLETED,
                review_status=TaskReviewStatus.APPROVED,
                progress=Decimal("100.0"),
                project_id=projects[2].id,
                assigned_to=users[2].id,  # Sarah
                due_date=datetime.utcnow() - timedelta(days=20),
                completed_at=datetime.utcnow() - timedelta(days=20),
            ),
            Task(
                title="Create Database Schema",
                description="Design and implement new database schema",
                status=TaskStatus.IN_PROGRESS,
                review_status=TaskReviewStatus.PENDING,
                progress=Decimal("45.0"),
                project_id=projects[3].id,
                assigned_to=users[2].id,  # Sarah
                due_date=datetime.utcnow() + timedelta(days=12),
            ),
            Task(
                title="Migrate User Data",
                description="Transfer existing user data to new schema",
                status=TaskStatus.PENDING,
                review_status=TaskReviewStatus.PENDING,
                progress=Decimal("0.0"),
                project_id=projects[3].id,
                assigned_to=users[2].id,  # Sarah
                due_date=datetime.utcnow() + timedelta(days=25),
            ),
        ]
        
        for task in tasks:
            db.add(task)
        db.commit()
        
        for task in tasks:
            db.refresh(task)
        
        print(f"Created {len(tasks)} tasks")
        
        # Create Activity Logs
        print("Creating activity logs...")
        activity_logs = [
            ActivityLog(
                activity_type=ActivityType.PROJECT_CREATED,
                description=f"Project '{projects[0].name}' created",
                user_id=users[0].id,
                project_id=projects[0].id,
                created_at=datetime.utcnow() - timedelta(days=10),
            ),
            ActivityLog(
                activity_type=ActivityType.TASK_CREATED,
                description=f"Task 'Design Homepage Layout' created",
                user_id=users[1].id,
                project_id=projects[0].id,
                task_id=tasks[0].id,
                created_at=datetime.utcnow() - timedelta(days=9),
            ),
            ActivityLog(
                activity_type=ActivityType.TASK_STATUS_CHANGED,
                description="Task status changed to IN_PROGRESS",
                user_id=users[3].id,
                project_id=projects[0].id,
                task_id=tasks[0].id,
                created_at=datetime.utcnow() - timedelta(days=7),
            ),
            ActivityLog(
                activity_type=ActivityType.TASK_PROGRESS_UPDATED,
                description="Task progress updated to 65%",
                user_id=users[3].id,
                project_id=projects[0].id,
                task_id=tasks[0].id,
                created_at=datetime.utcnow() - timedelta(days=3),
            ),
            ActivityLog(
                activity_type=ActivityType.TASK_APPROVED,
                description="Task 'Implement User Authentication' approved",
                user_id=users[1].id,
                project_id=projects[0].id,
                task_id=tasks[1].id,
                created_at=datetime.utcnow() - timedelta(days=2),
            ),
        ]
        
        for log in activity_logs:
            db.add(log)
        db.commit()
        
        print(f"Created {len(activity_logs)} activity logs")
        
        # Create Project Task Stats
        print("Creating project task stats...")
        from app.services.project_task_stats_service import update_project_task_stats
        
        for project in projects:
            update_project_task_stats(db, project.id)
        
        print("Created project task stats")
        
        db.commit()
        
        print("=" * 50)
        print("Database seeding completed successfully!")
        print("=" * 50)
        print("\nDefault login credentials:")
        print("  Admin: admin@saphul.com / admin123")
        print("  Manager: john@example.com / password123")
        print("  Member: sarah@example.com / password123")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()




