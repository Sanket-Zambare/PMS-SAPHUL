"""
Sprint routes with permission-based authorization.
Sprints are only for AGILE and HYBRID projects.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    SPRINT_CREATE,
    SPRINT_VIEW,
    SPRINT_EDIT,
    SPRINT_DELETE,
)
from app.models.sprint import Sprint
from app.models.project import Project, ProjectMethodology
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/sprints", tags=["Sprints"])

class SprintCreate(BaseModel):
    project_id: int
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = "PLANNED"

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class SprintResponse(BaseModel):
    id: int
    project_id: int
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str

    class Config:
        from_attributes = True

@router.post("/", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(SPRINT_CREATE))
):
    """Create a new sprint. Only for AGILE or HYBRID projects."""
    # Verify project exists and is AGILE or HYBRID
    project = db.query(Project).filter(
        Project.id == sprint_data.project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.methodology not in [ProjectMethodology.AGILE, ProjectMethodology.HYBRID]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sprints are only available for AGILE or HYBRID projects"
        )
    
    sprint = Sprint(
        project_id=sprint_data.project_id,
        name=sprint_data.name,
        start_date=sprint_data.start_date,
        end_date=sprint_data.end_date,
        status=sprint_data.status or "PLANNED"
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    
    return sprint

@router.get("/", response_model=List[SprintResponse])
def get_sprints(
    project_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(SPRINT_VIEW))
):
    """Get all sprints. Can be filtered by project."""
    query = db.query(Sprint)
    
    if project_id:
        query = query.filter(Sprint.project_id == project_id)
    
    sprints = query.offset(skip).limit(limit).all()
    return sprints

@router.get("/{sprint_id}", response_model=SprintResponse)
def get_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(SPRINT_VIEW))
):
    """Get a specific sprint by ID."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    return sprint

@router.put("/{sprint_id}", response_model=SprintResponse)
def update_sprint(
    sprint_id: int,
    sprint_data: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(SPRINT_EDIT))
):
    """Update a sprint. Requires SPRINT_EDIT permission."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    
    update_data = sprint_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sprint, field, value)
    
    db.commit()
    db.refresh(sprint)
    return sprint

@router.delete("/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(SPRINT_DELETE))
):
    """Delete a sprint. Requires SPRINT_DELETE permission."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    
    db.delete(sprint)
    db.commit()
    return None

