from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from app.models.project import ProjectMethodology, ProjectStatus, ReviewStatus

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    methodology: ProjectMethodology
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    methodology: Optional[ProjectMethodology] = None
    status: Optional[ProjectStatus] = None
    review_status: Optional[ReviewStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectResponse(ProjectBase):
    id: int
    created_by: int
    status: ProjectStatus
    review_status: ReviewStatus
    review_requested_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
