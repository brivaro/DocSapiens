from typing import List, Optional
from pydantic import BaseModel

class DocumentCreate(BaseModel):
    filename: str
    content_type: str
    content: bytes
    split_by: Optional[str] = "\n\n"
    split_mode: str = "delimiter" # Puede ser "delimiter", "size" o "pages"
    chunk_size: Optional[int] = 1000
    overlap: Optional[int] = 200
    tags: Optional[List[str]] = []

class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: str = None
    size: int = None
    uploaded_at: str = None
    status: str
    text_content: str = None
    tags: Optional[List[str]] = [] 

class DocumentChunk(BaseModel):
    document_id: str
    chunk_id: int
    text: str
    start: int
    end: int 

class Config:
    from_attributes = True