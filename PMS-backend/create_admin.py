"""
Script to create an admin user for initial setup.
Run this script to create the first admin user.
"""
from app.database import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(
            User.email == "admin@saphul.com",
            User.is_deleted == False
        ).first()
        
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin = User(
            name="Admin User",
            email="admin@saphul.com",
            password_hash=get_password_hash("admin123"),  # Change this password!
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("=" * 50)
        print("Admin user created successfully!")
        print("=" * 50)
        print(f"Email: admin@saphul.com")
        print(f"Password: admin123")
        print("=" * 50)
        print("⚠️  IMPORTANT: Change the password after first login!")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()





