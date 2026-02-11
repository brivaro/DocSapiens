from app.db.models import Document, VectorStore
from app.models.document import DocumentCreate
from app.models.vector_store import VectorStoreCreate
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

# --- VECTOR STORE CRUD ---

def create_vector_store(db: Session, vs_in: VectorStoreCreate) -> VectorStore:
    db_vs = VectorStore(
        name=vs_in.name,
        description=vs_in.description,
        embedding_dimension=vs_in.embedding_dimension
    )
    db.add(db_vs)
    db.commit()
    db.refresh(db_vs)
    return db_vs

def get_vector_store(db: Session, vs_id: str) -> Optional[VectorStore]:
    return db.query(VectorStore).filter(VectorStore.id == vs_id).first()

def get_vector_store_by_name(db: Session, name: str) -> Optional[VectorStore]:
    return db.query(VectorStore).filter(VectorStore.name == name).first()

def list_vector_stores(db: Session) -> List[VectorStore]:
    return db.query(VectorStore).order_by(VectorStore.created_at.desc()).all()

def delete_vector_store(db: Session, vs_id: str) -> bool:
    vs = db.query(VectorStore).filter(VectorStore.id == vs_id).first()
    if vs:
        db.delete(vs)
        db.commit()
        return True
    return False

# --- DOCUMENT CRUD ---

def create_document(db: Session, doc_in: DocumentCreate) -> Document:
    db_doc = Document(
        vector_store_id=doc_in.vector_store_id, # Link a la colección
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

def update_document(db: Session, db_doc: Document, doc_in: DocumentCreate) -> Document:
    # Actualizamos contenido y configuración
    db_doc.content = doc_in.content
    db_doc.size = len(doc_in.content)
    db_doc.content_type = doc_in.content_type
    db_doc.uploaded_at = datetime.utcnow()
    
    # Importante: Si se re-sube, puede cambiar de colección
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

def update_document_config(db: Session, doc_id: str, updates: dict) -> Optional[Document]:
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc: return None
    
    for key, value in updates.items():
        if hasattr(db_doc, key) and value is not None:
            setattr(db_doc, key, value)
            
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

def get_document_by_filename_in_store(db: Session, filename: str, vector_store_id: str) -> Optional[Document]:
    """Busca si el archivo ya existe EN ESA COLECCIÓN específica."""
    return db.query(Document).filter(
        Document.filename == filename,
        Document.vector_store_id == vector_store_id
    ).first()

def get_document_by_id(db: Session, doc_id: str) -> Optional[Document]:
    return db.query(Document).filter(Document.id == doc_id).first()

def list_documents(db: Session, vector_store_id: Optional[str] = None) -> List[Document]:
    query = db.query(Document)
    if vector_store_id:
        query = query.filter(Document.vector_store_id == vector_store_id)
    return query.order_by(Document.uploaded_at.desc()).all()

def delete_document(db: Session, doc_id: str) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False