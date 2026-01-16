from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.security import get_db, get_current_user, get_password_hash
from app.models.user import User, UserStatus
from app.models.role import Role
from app.models.user_role import UserRole as UserRoleModel
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.services.email_service import email_service
import logging
import secrets
import string
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"]
)

# ✅ FIX 1: define logger once
logger = logging.getLogger(__name__)

class InviteRequest(BaseModel):
    email: str
    project_id: int

class AcceptInvite(BaseModel):
    token: str
    password: str

# In-memory storage for invites (Redis recommended for production)
invites = {}

def has_role(db: Session, user_id: int, role_name: str) -> bool:
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        return False

    return db.query(UserRoleModel).filter(
        UserRoleModel.user_id == user_id,
        UserRoleModel.role_id == role.id
    ).first() is not None


@router.post("/invite")
def invite_client(
    invite_data: InviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Permission check
    if not (
        has_role(db, current_user.id, "ADMIN")
        or has_role(db, current_user.id, "PROJECT_MANAGER")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    expires_at = datetime.utcnow() + timedelta(days=7)

    invites[token] = {
        "email": invite_data.email,
        "project_id": invite_data.project_id,
        "expires_at": expires_at,
        "inviter_id": current_user.id
    }

    # Best-effort email
    try:
        email_service.send_invite_email(
            invite_data.email,
            token,
            current_user.name
        )
    except Exception as e:
        logger.warning(f"Failed to send invite email to {invite_data.email}: {e}")

    return {"message": "Invitation sent successfully"}


@router.post("/accept")
def accept_invitation(
    accept_data: AcceptInvite,
    db: Session = Depends(get_db)
):
    invite = invites.get(accept_data.token)

    if not invite or datetime.utcnow() > invite["expires_at"]:
        invites.pop(accept_data.token, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation"
        )

    # ✅ FIX 2: block deleted users
    user = db.query(User).filter(
        User.email == invite["email"],
        User.is_deleted == False
    ).first()

    if not user:
        user = User(
            name=invite["email"].split("@")[0],
            email=invite["email"],
            password=get_password_hash(accept_data.password),
            status=UserStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Assign CLIENT role
    role = db.query(Role).filter(Role.name == "CLIENT").first()
    if role:
        exists = db.query(UserRoleModel).filter(
            UserRoleModel.user_id == user.id,
            UserRoleModel.role_id == role.id
        ).first()

        if not exists:
            db.add(UserRoleModel(user_id=user.id, role_id=role.id))

    # Assign project membership
    exists = db.query(ProjectMember).filter(
        ProjectMember.project_id == invite["project_id"],
        ProjectMember.user_id == user.id
    ).first()

    if not exists:
        db.add(ProjectMember(
            project_id=invite["project_id"],
            user_id=user.id,
            role=ProjectMemberRole.MEMBER
        ))

    invites.pop(accept_data.token, None)
    db.commit()

    return {"message": "Invitation accepted successfully"}
