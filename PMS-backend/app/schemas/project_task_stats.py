from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class ProjectTaskStatsResponse(BaseModel):
    project_id: int
    total_tasks: int
    completed_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    billable_hours: Decimal
    non_billable_hours: Decimal
    last_updated: datetime

    class Config:
        from_attributes = True
