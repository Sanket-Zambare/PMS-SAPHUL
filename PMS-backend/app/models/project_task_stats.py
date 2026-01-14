from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric, PrimaryKeyConstraint
from datetime import datetime
from app.database import Base

class ProjectTaskStats(Base):
    __tablename__ = "project_task_stats"

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, primary_key=True)
    
    # Statistics
    total_tasks = Column(Integer, default=0, nullable=False)
    completed_tasks = Column(Integer, default=0, nullable=False)
    blocked_tasks = Column(Integer, default=0, nullable=False)
    overdue_tasks = Column(Integer, default=0, nullable=False)
    billable_hours = Column(Numeric(8, 2), default=0.0, nullable=False)
    non_billable_hours = Column(Numeric(8, 2), default=0.0, nullable=False)
    
    # Timestamp
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
