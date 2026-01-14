from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from datetime import datetime
from app.database import Base
import enum

class ApprovalEntityType(enum.Enum):
    PROJECT = "PROJECT"
    TASK = "TASK"

class ApprovalStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(Enum(ApprovalEntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    remarks = Column(Text, nullable=True)


