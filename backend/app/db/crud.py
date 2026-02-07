from app.db.models import Document, RagConfiguration
from app.models.document import DocumentCreate
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

# --- Document CRUD ---

def create_document(db: Session, doc_in: DocumentCreate) -> Document:
    db_doc = Document(
        filename=doc_in.filename,
        content_type=doc_in.content_type,
        content=doc_in.content,
        size=len(doc_in.content),
        # Guardamos config inicial
        split_by=doc_in.split_by,
        split_mode=doc_in.split_mode,
        chunk_size=doc_in.chunk_size,
        overlap=doc_in.overlap,
        tags=doc_in.tags,
        status="pending"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def update_document(db: Session, db_doc: Document, doc_in: DocumentCreate) -> Document:
    """Actualiza el contenido y la configuración de un documento."""
    db_doc.content = doc_in.content
    db_doc.size = len(doc_in.content)
    db_doc.content_type = doc_in.content_type
    db_doc.uploaded_at = datetime.utcnow()
    
    # Actualizar configuración
    db_doc.split_by = doc_in.split_by
    db_doc.split_mode = doc_in.split_mode
    db_doc.chunk_size = doc_in.chunk_size
    db_doc.overlap = doc_in.overlap
    db_doc.tags = doc_in.tags
    
    # Reset estado
    db_doc.status = "pending"
    db_doc.error_message = None
    
    db.commit()
    db.refresh(db_doc)
    return db_doc

def update_document_config(db: Session, doc_id: str, updates: dict) -> Optional[Document]:
    """Actualiza solo la configuración (para re-indexing sin re-upload)."""
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc: return None
    
    for key, value in updates.items():
        if hasattr(db_doc, key) and value is not None:
            setattr(db_doc, key, value)
            
    db_doc.status = "pending" # Reset status para procesar
    db_doc.error_message = None
    db.commit()
    db.refresh(db_doc)
    return db_doc

def update_document_field(db: Session, doc_id: str, field: str, value) -> Optional[Document]:
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc: return None
    setattr(db_doc, field, value)
    db.commit()
    return db_doc

def get_document_by_filename(db: Session, filename: str) -> Optional[Document]:
    return db.query(Document).filter(Document.filename == filename).first()

def get_document_by_id(db: Session, doc_id: str) -> Optional[Document]:
    return db.query(Document).filter(Document.id == doc_id).first()

def list_documents(db: Session) -> List[Document]:
    return db.query(Document).all()

def delete_document(db: Session, doc_id: str) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False

# --- Config CRUD ---

def get_active_rag_config(db: Session) -> RagConfiguration:
    return db.query(RagConfiguration).filter(RagConfiguration.is_active == True).order_by(RagConfiguration.created_at.desc()).first()

def set_rag_config(db: Session, dimension: int, model: str = "gemini-embedding-001") -> RagConfiguration:
    db.query(RagConfiguration).update({RagConfiguration.is_active: False})
    new_config = RagConfiguration(embedding_model=model, embedding_dimension=dimension, is_active=True)
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

def initialize_rag_config(db: Session):
    if not get_active_rag_config(db):
        set_rag_config(db, dimension=768)