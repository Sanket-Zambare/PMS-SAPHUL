"""
Approval routes for centralized approval workflow.
Handles approvals for projects and tasks.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    PROJECT_APPROVE,
    TASK_APPROVE,
)
from app.models.approval import Approval, ApprovalEntityType, ApprovalStatus as ApprovalStatusEnum
from app.models.project import Project, ProjectStatus, ReviewStatus
from app.models.task import Task, TaskReviewStatus, TaskApprovalStatus
from app.models.user import User

router = APIRouter(prefix="/approvals", tags=["Approvals"])

class ApprovalCreate(BaseModel):
    entity_type: ApprovalEntityType
    entity_id: int
    remarks: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: int
    entity_type: ApprovalEntityType
    entity_id: int
    requested_by: int
    requested_at: datetime
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    status: ApprovalStatusEnum
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval_request(
    approval_data: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an approval request for a project or task."""
    # Verify entity exists
    if approval_data.entity_type == ApprovalEntityType.PROJECT:
        entity = db.query(Project).filter(
            Project.id == approval_data.entity_id,
            Project.is_deleted == False
        ).first()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    elif approval_data.entity_type == ApprovalEntityType.TASK:
        entity = db.query(Task).filter(
            Task.id == approval_data.entity_id,
            Task.is_deleted == False
        ).first()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
    
    # Check if approval already exists
    existing = db.query(Approval).filter(
        Approval.entity_type == approval_data.entity_type,
        Approval.entity_id == approval_data.entity_id,
        Approval.status == ApprovalStatusEnum.PENDING
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval request already pending"
        )
    
    approval = Approval(
        entity_type=approval_data.entity_type,
        entity_id=approval_data.entity_id,
        requested_by=current_user.id,
        status=ApprovalStatusEnum.PENDING,
        remarks=approval_data.remarks
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    
    return approval

@router.get("/", response_model=List[ApprovalResponse])
def get_approvals(
    entity_type: Optional[ApprovalEntityType] = None,
    entity_id: Optional[int] = None,
    status_filter: Optional[ApprovalStatusEnum] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all approvals. Can be filtered by entity type, entity ID, or status."""
    query = db.query(Approval)
    
    if entity_type:
        query = query.filter(Approval.entity_type == entity_type)
    if entity_id:
        query = query.filter(Approval.entity_id == entity_id)
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    
    approvals = query.order_by(Approval.requested_at.desc()).offset(skip).limit(limit).all()
    return approvals

@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific approval by ID."""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )
    return approval

@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
def approve(
    approval_id: int,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve an approval request."""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )
    
    if approval.status != ApprovalStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval is not pending"
        )
    
    # Check permission based on entity type
    if approval.entity_type == ApprovalEntityType.PROJECT:
        from app.services.permission_service import has_permission
        if not has_permission(db, current_user.id, PROJECT_APPROVE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: PROJECT_APPROVE required"
            )
    elif approval.entity_type == ApprovalEntityType.TASK:
        from app.services.permission_service import has_permission
        if not has_permission(db, current_user.id, TASK_APPROVE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: TASK_APPROVE required"
            )
    
    # Update approval
    approval.status = ApprovalStatusEnum.APPROVED
    approval.approved_by = current_user.id
    approval.approved_at = datetime.utcnow()
    if remarks:
        approval.remarks = remarks
    
    # Update entity based on type
    if approval.entity_type == ApprovalEntityType.PROJECT:
        project = db.query(Project).filter(Project.id == approval.entity_id).first()
        if project:
            project.review_status = ReviewStatus.APPROVED
            project.status = ProjectStatus.CLOSED
            project.reviewed_at = datetime.utcnow()
            project.reviewed_by = current_user.id
    elif approval.entity_type == ApprovalEntityType.TASK:
        task = db.query(Task).filter(Task.id == approval.entity_id).first()
        if task:
            task.review_status = TaskReviewStatus.APPROVED
            task.approval_status = TaskApprovalStatus.APPROVED
            task.reviewed_at = datetime.utcnow()
            task.reviewed_by = current_user.id
    
    db.commit()
    db.refresh(approval)
    return approval

@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
def reject(
    approval_id: int,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject an approval request."""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )
    
    if approval.status != ApprovalStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval is not pending"
        )
    
    # Check permission
    if approval.entity_type == ApprovalEntityType.PROJECT:
        from app.services.permission_service import has_permission
        if not has_permission(db, current_user.id, PROJECT_APPROVE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
    elif approval.entity_type == ApprovalEntityType.TASK:
        from app.services.permission_service import has_permission
        if not has_permission(db, current_user.id, TASK_APPROVE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
    
    # Update approval
    approval.status = ApprovalStatusEnum.REJECTED
    approval.approved_by = current_user.id
    approval.approved_at = datetime.utcnow()
    if remarks:
        approval.remarks = remarks
    
    # Update entity
    if approval.entity_type == ApprovalEntityType.PROJECT:
        project = db.query(Project).filter(Project.id == approval.entity_id).first()
        if project:
            project.review_status = ReviewStatus.REJECTED
            project.reviewed_at = datetime.utcnow()
            project.reviewed_by = current_user.id
    elif approval.entity_type == ApprovalEntityType.TASK:
        task = db.query(Task).filter(Task.id == approval.entity_id).first()
        if task:
            task.review_status = TaskReviewStatus.REJECTED
            task.approval_status = TaskApprovalStatus.REJECTED
            task.reviewed_at = datetime.utcnow()
            task.reviewed_by = current_user.id
    
    db.commit()
    db.refresh(approval)
    return approval

