from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from datetime import datetime
from app.database import Base
import enum

class EntityType(enum.Enum):
    PROJECT = "PROJECT"
    TASK = "TASK"
    FILE = "FILE"

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(Enum(EntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
