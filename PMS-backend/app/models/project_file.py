from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from app.database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_url = Column(String(500), nullable=False)  # Changed from file_path
    version = Column(String(20), nullable=True)
    is_latest = Column(Boolean, default=True, nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
