from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    file_name: str
    file_type: Optional[str] = None
    file_url: str
    version: Optional[str] = None

class FileCreate(FileBase):
    pass

class FileResponse(FileBase):
    id: int
    uploaded_by: int
    is_latest: bool
    created_at: datetime

    class Config:
        from_attributes = True
