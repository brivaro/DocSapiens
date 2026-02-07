from typing import List, Optional
from pydantic import BaseModel

class DocumentCreate(BaseModel):
    filename: str
    content_type: str
    content: bytes
    # Parámetros de configuración inicial
    split_mode: str = "delimiter" # Puede ser "delimiter", "size" o "pages"
    split_by: Optional[str] = "\n\n"
    chunk_size: Optional[int] = 1000
    overlap: Optional[int] = 200
    tags: Optional[List[str]] = []

class DocumentUpdateParams(BaseModel):
    """Modelo para re-indexar un documento existente con nuevos parámetros."""
    split_mode: Optional[str] = None
    split_by: Optional[str] = None
    chunk_size: Optional[int] = None
    overlap: Optional[int] = None
    tags: Optional[List[str]] = None

class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: str = None
    size: int = None
    uploaded_at: str = None
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    split_mode: str
    split_by: Optional[str]
    chunk_size: Optional[int]
    overlap: Optional[int]
    tags: Optional[List[str]] = []

    class Config:
        from_attributes = True

class DocumentChunk(BaseModel):
    document_id: str
    chunk_id: int
    text: str
    start: int = 0
    end: int = 0