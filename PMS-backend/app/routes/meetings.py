from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.security import get_db, get_current_user
from app.models.meeting import Meeting, MeetingAttendee
from app.models.user import User
from app.models.project_member import ProjectMember
from app.services.notification_service import create_notification


def is_admin(db: Session, user_id: int) -> bool:
    from app.models.user_role import UserRole
    from app.models.role import Role
    role = (
        db.query(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id, Role.name == "ADMIN")
        .first()
    )
    return role is not None

router = APIRouter(prefix="/meetings", tags=["Meetings"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = 60
    meet_link: Optional[str] = None
    is_urgent: bool = False
    project_id: Optional[int] = None
    attendee_ids: List[int] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meet_link: Optional[str] = None
    is_urgent: Optional[bool] = None
    project_id: Optional[int] = None

class AttendeeAdd(BaseModel):
    user_id: int

class AttendeeOut(BaseModel):
    user_id: int
    user_name: str
    class Config:
        from_attributes = True

class MeetingOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    scheduled_at: datetime
    duration_minutes: int
    meet_link: Optional[str]
    is_urgent: bool
    project_id: Optional[int]
    created_by: int
    created_by_name: Optional[str] = None
    attendees: List[AttendeeOut] = []
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_out(meeting: Meeting, db: Session) -> dict:
    creator = db.query(User).filter(User.id == meeting.created_by).first()
    rows = db.query(MeetingAttendee).filter(MeetingAttendee.meeting_id == meeting.id).all()
    attendees = []
    for r in rows:
        u = db.query(User).filter(User.id == r.user_id).first()
        if u:
            attendees.append({"user_id": u.id, "user_name": u.name})
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "scheduled_at": meeting.scheduled_at,
        "duration_minutes": meeting.duration_minutes,
        "meet_link": meeting.meet_link,
        "is_urgent": meeting.is_urgent,
        "project_id": meeting.project_id,
        "created_by": meeting.created_by,
        "created_by_name": creator.name if creator else None,
        "attendees": attendees,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
    }


def _notify_attendees(meeting: Meeting, actor: User, db: Session, action: str = "invited"):
    rows = db.query(MeetingAttendee).filter(MeetingAttendee.meeting_id == meeting.id).all()
    time_str = meeting.scheduled_at.strftime("%d %b %Y %I:%M %p")
    urgent_prefix = "URGENT — " if meeting.is_urgent else ""
    for r in rows:
        if r.user_id == actor.id:
            continue
        link_text = f" Join: {meeting.meet_link}" if meeting.meet_link else ""
        create_notification(
            db=db,
            user_id=r.user_id,
            title=f"{urgent_prefix}Meeting {action}: {meeting.title}",
            message=f'{actor.name} {action} you to "{meeting.title}" on {time_str}.{link_text}',
            entity_type="MEETING",
            entity_id=meeting.id,
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = Meeting(
        title=data.title,
        description=data.description,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        meet_link=data.meet_link,
        is_urgent=data.is_urgent,
        project_id=data.project_id,
        created_by=current_user.id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Add creator as attendee
    attendee_ids = list(set(data.attendee_ids + [current_user.id]))
    for uid in attendee_ids:
        db.add(MeetingAttendee(meeting_id=meeting.id, user_id=uid))
    db.commit()

    # Notify attendees
    _notify_attendees(meeting, current_user, db, action="invited")

    return _build_out(meeting, db)


@router.get("/")
def list_meetings(
    year: Optional[int] = None,
    month: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Meeting).filter(Meeting.is_deleted == False)
    if year and month:
        from datetime import date as _date
        start = datetime(year, month, 1)
        end_month = month + 1 if month < 12 else 1
        end_year = year if month < 12 else year + 1
        end = datetime(end_year, end_month, 1)
        q = q.filter(Meeting.scheduled_at >= start, Meeting.scheduled_at < end)
    if project_id:
        q = q.filter(Meeting.project_id == project_id)

    # Non-admins see only meetings they're invited to or created
    if not is_admin(db, current_user.id):
        invited_ids = [
            r.meeting_id for r in db.query(MeetingAttendee)
            .filter(MeetingAttendee.user_id == current_user.id).all()
        ]
        q = q.filter(
            (Meeting.created_by == current_user.id) | Meeting.id.in_(invited_ids)
        )

    meetings = q.order_by(Meeting.scheduled_at.asc()).all()
    return [_build_out(m, db) for m in meetings]


@router.get("/{meeting_id}")
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.is_deleted == False).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _build_out(meeting, db)


@router.put("/{meeting_id}")
def update_meeting(
    meeting_id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.is_deleted == False).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.created_by != current_user.id and not is_admin(db, current_user.id):
        raise HTTPException(status_code=403, detail="Only the creator can edit this meeting")

    for field, val in data.dict(exclude_unset=True).items():
        setattr(meeting, field, val)
    meeting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)

    _notify_attendees(meeting, current_user, db, action="updated a")
    return _build_out(meeting, db)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.is_deleted == False).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.created_by != current_user.id and not is_admin(db, current_user.id):
        raise HTTPException(status_code=403, detail="Only the creator can delete this meeting")
    meeting.is_deleted = True
    db.commit()
    return None


@router.post("/{meeting_id}/attendees", status_code=201)
def add_attendee(
    meeting_id: int,
    body: AttendeeAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.is_deleted == False).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    exists = db.query(MeetingAttendee).filter(
        MeetingAttendee.meeting_id == meeting_id,
        MeetingAttendee.user_id == body.user_id,
    ).first()
    if not exists:
        db.add(MeetingAttendee(meeting_id=meeting_id, user_id=body.user_id))
        db.commit()
        # Notify the newly added attendee
        u = db.query(User).filter(User.id == body.user_id).first()
        if u and u.id != current_user.id:
            time_str = meeting.scheduled_at.strftime("%d %b %Y %I:%M %p")
            urgent_prefix = "URGENT — " if meeting.is_urgent else ""
            link_text = f" Join: {meeting.meet_link}" if meeting.meet_link else ""
            create_notification(
                db=db,
                user_id=u.id,
                title=f"{urgent_prefix}Meeting invite: {meeting.title}",
                message=f'{current_user.name} invited you to "{meeting.title}" on {time_str}.{link_text}',
                entity_type="MEETING",
                entity_id=meeting.id,
            )
    return {"ok": True}


@router.delete("/{meeting_id}/attendees/{user_id}", status_code=204)
def remove_attendee(
    meeting_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(MeetingAttendee).filter(
        MeetingAttendee.meeting_id == meeting_id,
        MeetingAttendee.user_id == user_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()
    return None
