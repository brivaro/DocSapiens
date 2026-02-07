import logging
from app.db.models import Document, RagConfiguration
from app.models.document import DocumentCreate
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional

### --- CRUD Document (PostgreSQL) ---

def create_document(db: Session, doc_in: DocumentCreate) -> Document:
    db_doc = Document(
        filename=doc_in.filename,
        content_type=doc_in.content_type,
        content=doc_in.content,
        size=len(doc_in.content),
        split_by=doc_in.split_by,
        tags=doc_in.tags,
        status="pending"
    )
    db.add(db_doc)
    db.commit()
    return db_doc

def update_document(db: Session, db_doc: Document, doc_in: DocumentCreate) -> Document:
    db_doc.content = doc_in.content
    db_doc.size = len(doc_in.content)
    db_doc.tags = doc_in.tags
    db_doc.content_type = doc_in.content_type
    db_doc.uploaded_at = datetime.utcnow()
    db_doc.split_by = doc_in.split_by
    db_doc.status = "pending"
    db.commit()
    return db_doc

def update_document_field(db: Session, doc_id: str, field: str, value) -> Optional[Document]:
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        return None
    setattr(db_doc, field, value)
    db.commit()
    return db_doc

def update_document_text(db: Session, doc_id: str, text: str) -> Optional[Document]:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        doc.text_content = text
        db.commit()
    return doc 

def refresh_document(db: Session, doc_id: str) -> Optional[Document]:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        db.refresh(doc)
    return doc

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

### --- CRUD Settings (RAG Configuration) ---

def get_active_rag_config(db: Session) -> RagConfiguration:
    """Obtiene la configuración activa. Si hay varias, toma la última creada que esté activa."""
    return db.query(RagConfiguration).filter(RagConfiguration.is_active == True).order_by(RagConfiguration.created_at.desc()).first()

def set_rag_config(db: Session, dimension: int, model: str = "gemini-embedding-001") -> RagConfiguration:
    """
    Crea una nueva configuración y desactiva las anteriores (historial).
    Esto es útil si en el futuro queremos ver qué configuración se usó antes.
    """
    # Desactivar configuraciones previas
    db.query(RagConfiguration).update({RagConfiguration.is_active: False})
    
    new_config = RagConfiguration(
        embedding_model=model,
        embedding_dimension=dimension,
        is_active=True
    )
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

def initialize_rag_config(db: Session):
    """Crea una configuración por defecto si no existe ninguna."""
    config = get_active_rag_config(db)
    if not config:
        logging.info("[INFO] No se encontró configuración RAG. Inicializando por defecto (768 dim).")
        set_rag_config(db, dimension=768) # Default recomendado por Google