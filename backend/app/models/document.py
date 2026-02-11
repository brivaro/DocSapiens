from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class DocumentCreate(BaseModel):
    filename: str
    content_type: str
    content: bytes
    vector_store_id: str
    split_mode: str = "delimiter" # Puede ser "delimiter", "size", "pages" o "whole"
    split_by: Optional[str] = "\n\n"
    chunk_size: Optional[int] = 1000
    overlap: Optional[int] = 200
    tags: Optional[List[str]] = []

class DocumentUpdateParams(BaseModel):
    split_mode: Optional[str] = None
    split_by: Optional[str] = None
    chunk_size: Optional[int] = None
    overlap: Optional[int] = None
    tags: Optional[List[str]] = None

class DocumentResponse(BaseModel):
    id: UUID 
    vector_store_id: UUID
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    split_mode: str
    split_by: Optional[str] = None
    chunk_size: Optional[int] = None
    overlap: Optional[int] = None
    tags: Optional[List[str]] = []
    model_config = ConfigDict(from_attributes=True)

class DocumentChunk(BaseModel):
    document_id: str
    chunk_id: int
    text: str
    start: int = 0
    end: int = 0