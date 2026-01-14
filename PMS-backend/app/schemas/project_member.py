from pydantic import BaseModel
from datetime import datetime
from app.models.project_member import ProjectMemberRole

class ProjectMemberBase(BaseModel):
    project_id: int
    user_id: int
    role: ProjectMemberRole

class ProjectMemberCreate(ProjectMemberBase):
    pass

class ProjectMemberResponse(ProjectMemberBase):
    id: int
    assigned_at: datetime

    class Config:
        from_attributes = True
