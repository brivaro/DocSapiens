from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class APIKeyCreate(BaseModel):
    name: str

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    created_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None 