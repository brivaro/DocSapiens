from backend.db.models import APIKey
from backend.models.apikey import APIKeyCreate
from datetime import datetime
import secrets
from sqlalchemy.orm import Session
from backend.db.models import Document
from backend.models.document import DocumentCreate
from typing import List, Optional

### --- CRUD APIKey ---
def create_apikey(db: Session, apikey_in: APIKeyCreate) -> APIKey:
    key = secrets.token_urlsafe(32)
    db_apikey = APIKey(name=apikey_in.name, key=key)
    db.add(db_apikey)
    db.commit()
    db.refresh(db_apikey)
    return db_apikey

def list_apikeys(db: Session):
    return db.query(APIKey).all()

def revoke_apikey(db: Session, key_id: str):
    apikey = db.query(APIKey).filter(APIKey.id == key_id).first()
    if apikey:
        apikey.revoked = True
        apikey.revoked_at = datetime.utcnow()
        db.commit()
    return apikey 

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
    #db.refresh(db_doc)
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
    #db.refresh(db_doc)
    return db_doc

def update_document_field(db: Session, doc_id: str, field: str, value) -> Document:
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        return None
    setattr(db_doc, field, value)
    db.commit()
    #db.refresh(db_doc)
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