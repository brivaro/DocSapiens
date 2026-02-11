from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.vector_store import VectorStoreCreate, VectorStoreResponse
from app.services.vector_store_service import vector_store_service

router = APIRouter()

@router.post("/", response_model=VectorStoreResponse)
def create_vector_store(vs: VectorStoreCreate, db: Session = Depends(get_db)):
    try:
        return vector_store_service.create_vector_store(db, vs)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[VectorStoreResponse])
def list_vector_stores(db: Session = Depends(get_db)):
    return vector_store_service.list_vector_stores(db)

@router.delete("/{vs_id}", status_code=204)
def delete_vector_store(vs_id: str, db: Session = Depends(get_db)):
    try:
        vector_store_service.delete_vector_store(db, vs_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))