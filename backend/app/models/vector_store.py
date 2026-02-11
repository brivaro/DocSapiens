from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class VectorStoreCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$", description="Nombre único sin espacios")
    description: Optional[str] = None
    embedding_dimension: int = Field(768, description="Dimensión de los vectores (ej: 768, 1536)")

class VectorStoreResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    embedding_dimension: int
    created_at: datetime
    document_count: int = 0 # Campo calculado opcional para la UI

    class Config:
        from_attributes = True