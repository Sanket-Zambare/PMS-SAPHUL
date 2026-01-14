"""
File routes with permission-based authorization.
Files store metadata only - actual files in cloud storage.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.security import (
    get_db, 
    get_current_user, 
    require_permission,
)
from app.core.permissions import (
    FILE_UPLOAD,
    FILE_VIEW,
    FILE_DELETE,
)
from app.schemas.project_file import FileCreate, FileResponse
from app.models.project_file import File
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.services.activity_log_service import create_activity_log
from app.models.activity_log import EntityType

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_file(
    file_data: FileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(FILE_UPLOAD))
):
    """Create file metadata. Requires FILE_UPLOAD permission."""
    # Verify project exists
    project = db.query(Project).filter(
        Project.id == file_data.project_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify task exists if provided
    if file_data.task_id:
        task = db.query(Task).filter(
            Task.id == file_data.task_id,
            Task.is_deleted == False
        ).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
    
    # If this is marked as latest, unmark other latest files
    if file_data.is_latest:
        existing_latest = db.query(File).filter(
            File.project_id == file_data.project_id,
            File.task_id == file_data.task_id,
            File.is_latest == True,
            File.is_deleted == False
        ).all()
        for file in existing_latest:
            file.is_latest = False
    
    # Get next version number
    max_version_file = db.query(File).filter(
        File.project_id == file_data.project_id,
        File.task_id == file_data.task_id,
        File.is_deleted == False
    ).order_by(File.version.desc()).first()
    
    version = str(int(max_version_file.version) + 1) if max_version_file and max_version_file.version else "1"
    
    file = File(
        project_id=file_data.project_id,
        task_id=file_data.task_id,
        uploaded_by=current_user.id,
        file_name=file_data.file_name,
        file_type=file_data.file_type,
        file_url=file_data.file_url,
        version=version or file_data.version,
        is_latest=file_data.is_latest if file_data.is_latest is not None else True
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.FILE,
            entity_id=file.id,
            action="upload",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return file

@router.get("/", response_model=List[FileResponse])
def get_files(
    project_id: int = None,
    task_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(FILE_VIEW))
):
    """Get files. Requires FILE_VIEW permission."""
    query = db.query(File).filter(File.is_deleted == False)
    
    if project_id:
        query = query.filter(File.project_id == project_id)
    if task_id:
        query = query.filter(File.task_id == task_id)
    
    files = query.order_by(File.created_at.desc()).offset(skip).limit(limit).all()
    return files

@router.get("/{file_id}", response_model=FileResponse)
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(FILE_VIEW))
):
    """Get a specific file by ID."""
    file = db.query(File).filter(
        File.id == file_id,
        File.is_deleted == False
    ).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(FILE_DELETE))
):
    """Soft delete a file. Requires FILE_DELETE permission."""
    file = db.query(File).filter(
        File.id == file_id,
        File.is_deleted == False
    ).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Soft delete
    file.is_deleted = True
    file.deleted_at = datetime.utcnow()
    db.commit()
    
    # Log activity
    try:
        create_activity_log(
            db=db,
            entity_type=EntityType.FILE,
            entity_id=file.id,
            action="delete",
            performed_by=current_user.id
        )
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
    
    return None
