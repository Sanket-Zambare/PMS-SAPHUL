from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="PLANNED")  # PLANNED, ACTIVE, COMPLETED


