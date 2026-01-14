from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, Enum
from datetime import datetime
from app.database import Base
import enum

class ProjectMemberRole(enum.Enum):
    PROJECT_MANAGER = "PROJECT_MANAGER"
    MEMBER = "MEMBER"

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(ProjectMemberRole), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
