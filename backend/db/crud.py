from backend.db.models import APIKey
from backend.models.apikey import APIKeyCreate
from datetime import datetime
import secrets
from sqlalchemy.orm import Session
from backend.db.models import Document
from backend.models.document import DocumentCreate
from typing import Optional

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

### --- CRUD Document ---

def get_document_by_filename(db: Session, filename: str) -> Optional[Document]:
    return db.query(Document).filter(Document.filename == filename).first()

def update_document(db: Session, db_doc: Document, doc_in: DocumentCreate) -> Document:
    db_doc.content = doc_in.content
    db_doc.size = len(doc_in.content)
    db_doc.tags = doc_in.tags
    db_doc.content_type = doc_in.content_type
    db_doc.uploaded_at = datetime.utcnow()
    db_doc.split_by = doc_in.split_by
    db.commit()
    db.refresh(db_doc)
    return db_doc

def create_document(db: Session, doc_in: DocumentCreate) -> Document:
    db_doc = Document(
        filename=doc_in.filename,
        content_type=doc_in.content_type,
        content=doc_in.content,
        size=len(doc_in.content),
        split_by=doc_in.split_by,
        tags=doc_in.tags
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def list_documents(db: Session):
    return db.query(Document).all()

def update_document_text(db: Session, doc_id: str, text: str):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        doc.text_content = text
        db.commit()
    return doc 

def delete_document(db: Session, doc_id: str) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False