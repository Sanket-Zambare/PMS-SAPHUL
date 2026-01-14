"""
Script to update database schema.
This will drop existing tables and recreate them with the correct schema.
WARNING: This will delete all existing data!
"""
from app.database import engine, Base
from app.models import (
    User,
    Project,
    ProjectMember,
    Task,
    ProjectFile,
    ActivityLog,
    ProjectTaskStats,
)

def update_database():
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    print("=" * 50)
    print("Database schema updated successfully!")
    print("=" * 50)
    print("You can now run: python create_admin.py")
    print("=" * 50)

if __name__ == "__main__":
    update_database()



