from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from datetime import datetime
from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)
    meet_link = Column(String(500), nullable=True)
    is_urgent = Column(Boolean, default=False, nullable=False)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MeetingAttendee(Base):
    __tablename__ = "meeting_attendees"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
