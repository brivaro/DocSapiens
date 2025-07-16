from typing import List, Optional
from pydantic import BaseModel

class DocumentCreate(BaseModel):
    filename: str
    content_type: str
    content: bytes
    split_by: Optional[str] = "\n\n"
    split_mode: Optional[str] = "delimiter" # Puede ser "delimiter", "size" o "pages"
    chunk_size: Optional[int] = 1000
    overlap: Optional[int] = 200
    tags: Optional[List[str]] = []

class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    uploaded_at: Optional[str] = None
    status: str # Hacemos que siempre se devuelva un status
    text_content: Optional[str] = None
    tags: List[str] = [] # Devolvemos una lista vacía por defecto

class Config:
    from_attributes = True # Permite mapear desde modelos SQLAlchemy si fuera necesario

class DocumentChunk(BaseModel):
    document_id: str
    chunk_id: int
    text: str
    start: int
    end: int 