from pydantic import BaseModel
from datetime import datetime
from app.models.activity_log import EntityType

class ActivityLogResponse(BaseModel):
    id: int
    entity_type: EntityType
    entity_id: int
    action: str
    performed_by: int
    created_at: datetime

    class Config:
        from_attributes = True
