"""
Update database schema to match new requirements.
WARNING: This will drop all existing tables and recreate them.
All data will be lost!
"""
from app.database import engine, Base
from app.models import (
    User,
    Role,
    UserRole,
    Permission,
    RolePermission,
    Project,
    Sprint,
    ProjectMember,
    Task,
    TimeLog,
    File,
    ActivityLog,
    Approval,
    ProjectTaskStats,
)

def update_schema():
    print("=" * 60)
    print("Updating database schema...")
    print("WARNING: This will delete all existing data!")
    print("=" * 60)
    
    # Drop all tables
    print("\nDropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ Tables dropped")
    
    # Create all tables with new schema
    print("\nCreating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    print("\n" + "=" * 60)
    print("Schema update completed!")
    print("=" * 60)
    print("\nNext step: Run seed_database_complete.py to populate initial data")
    print("=" * 60)

if __name__ == "__main__":
    update_schema()


