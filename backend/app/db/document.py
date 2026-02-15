from sqlalchemy.orm import Session
from app.db.models import Document
from app.models.document import DocumentCreate
from typing import List, Optional
from datetime import datetime

def create_document(db: Session, doc_in: DocumentCreate) -> Document:
    db_doc = Document(
        vector_store_id=doc_in.vector_store_id,
        filename=doc_in.filename,
        content_type=doc_in.content_type,
        content=doc_in.content,
        size=len(doc_in.content),
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

def get_document_by_id(db: Session, doc_id: str) -> Optional[Document]:
    return db.query(Document).filter(Document.id == doc_id).first()

def get_document_by_filename_in_store(db: Session, filename: str, vector_store_id: str) -> Optional[Document]:
    return db.query(Document).filter(
        Document.filename == filename,
        Document.vector_store_id == vector_store_id
    ).first()

def list_documents(db: Session, vector_store_id: Optional[str] = None) -> List[Document]:
    query = db.query(Document)
    if vector_store_id:
        query = query.filter(Document.vector_store_id == vector_store_id)
    return query.order_by(Document.uploaded_at.desc()).all()

def update_document(db: Session, db_doc: Document, doc_in: DocumentCreate) -> Document:
    db_doc.content = doc_in.content
    db_doc.size = len(doc_in.content)
    db_doc.content_type = doc_in.content_type
    db_doc.uploaded_at = datetime.utcnow()
    if doc_in.vector_store_id:
        db_doc.vector_store_id = doc_in.vector_store_id
    db_doc.split_by = doc_in.split_by
    db_doc.split_mode = doc_in.split_mode
    db_doc.chunk_size = doc_in.chunk_size
    db_doc.overlap = doc_in.overlap
    db_doc.tags = doc_in.tags
    db_doc.status = "pending"
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

def delete_document(db: Session, doc_id: str) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False