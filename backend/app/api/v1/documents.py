from fastapi import APIRouter, UploadFile, File, HTTPException, Form, BackgroundTasks, Depends, status
from app.models.document import DocumentCreate, DocumentResponse, DocumentChunk
from app.services.document_service import document_service
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter()

@router.post("/upload/", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_document(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    split_mode: str = Form("delimiter"), # "delimiter", "size", "pages"
    split_by: str = Form("\n\n"),      # Delimitador
    chunk_size: Optional[int] = Form(None),
    overlap: Optional[int] = Form(0),
    tags: Optional[str] = Form(None) 
) -> DocumentResponse:
    
    content = file.file.read()
    # TODO: Validar el tamaño del archivo
    # Descomentar si se desea limitar el tamaño del archivo
    #if len(content) > 20 * 1024 * 1024:
    #    raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx 20MB)")
    
    tags_list = tags.split(',') if tags and tags.strip() else []
    
    doc_create = DocumentCreate(
        filename=file.filename,
        content_type=file.content_type,
        content=content,
        split_by=split_by,
        split_mode=split_mode,
        chunk_size=chunk_size,
        overlap=overlap,
        tags=tags_list
    )

    db_doc = document_service.create_document(doc_create, background_tasks, db)

    return DocumentResponse(
        id=str(db_doc.id),
        filename=db_doc.filename,
        content_type=db_doc.content_type,
        size=db_doc.size,
        uploaded_at=db_doc.uploaded_at.isoformat(),
        status=db_doc.status,
        tags=db_doc.tags or []
    )

@router.get("/", response_model=list[DocumentResponse])
def list_documents() -> list[DocumentResponse]:
    return document_service.list_documents()

@router.get("/{doc_id}/chunks/", response_model=list[DocumentChunk]) 
def get_document_chunks_endpoint(doc_id: str) -> list[DocumentChunk]:
    return document_service.get_document_chunks(doc_id)

@router.delete("/{doc_id}/", status_code=200)
def delete_document_endpoint(doc_id: str) -> dict:
    try:
        document_service.delete_document(doc_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))