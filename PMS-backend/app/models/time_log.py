from sqlalchemy import Column, Integer, Date, Numeric, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class TimeLog(Base):
    __tablename__ = "time_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    hours = Column(Numeric(5, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


