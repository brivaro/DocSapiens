from sqlalchemy.orm import Session
from app.db.models import VectorStore
from app.models.vector_store import VectorStoreCreate
from typing import List, Optional

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