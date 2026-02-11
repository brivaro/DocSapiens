from fastapi import APIRouter, UploadFile, File, HTTPException, Form, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from app.models.document import DocumentCreate, DocumentResponse, DocumentChunk, DocumentUpdateParams
from app.services.document_service import document_service
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
import io
import urllib.parse

router = APIRouter()

@router.post("/upload/", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_document(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    vector_store_id: str = Form(...),
    split_mode: str = Form("delimiter"),
    split_by: str = Form("\n\n"),
    chunk_size: Optional[int] = Form(1000),
    overlap: Optional[int] = Form(200),
    tags: Optional[str] = Form(None) 
) -> DocumentResponse:
    
    content = file.file.read()
    tags_list = tags.split(',') if tags and tags.strip() else []
    
    doc_create = DocumentCreate(
        filename=file.filename,
        content_type=file.content_type,
        content=content,
        vector_store_id=vector_store_id,
        split_by=split_by,
        split_mode=split_mode,
        chunk_size=chunk_size,
        overlap=overlap,
        tags=tags_list
    )

    try:
        return document_service.create_document(doc_create, background_tasks, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{doc_id}/reindex", response_model=DocumentResponse)
def reindex_document(
    doc_id: str,
    params: DocumentUpdateParams,
    background_tasks: BackgroundTasks
):
    """
    Re-procesa un documento existente con nuevos parámetros de split.
    Solo afecta a la colección activa actual.
    """
    try:
        return document_service.reindex_document(doc_id, params, background_tasks)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list[DocumentResponse])
def list_documents(vector_store_id: Optional[str] = None) -> list[DocumentResponse]:
    # Filtrar por colección si se pide
    return document_service.list_documents(vector_store_id)

@router.get("/{doc_id}/chunks/", response_model=list[DocumentChunk]) 
def get_document_chunks_endpoint(doc_id: str) -> list[DocumentChunk]:
    return document_service.get_document_chunks(doc_id)

@router.get("/{doc_id}/download")
def download_document(doc_id: str, db: Session = Depends(get_db)):
    """Descarga el archivo original almacenado en la base de datos."""
    db_doc = document_service.crud.get_document_by_id(db, doc_id)
    
    if not db_doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Crear stream desde bytes
    file_stream = io.BytesIO(db_doc.content)
    
    # Codificar nombre de archivo para evitar errores con espacios/tildes
    encoded_filename = urllib.parse.quote(db_doc.filename)
    
    return StreamingResponse(
        file_stream, 
        media_type=db_doc.content_type,
        headers={
            "Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"
        }
    )

@router.delete("/{doc_id}/", status_code=200)
def delete_document_endpoint(doc_id: str) -> dict:
    try:
        document_service.delete_document(doc_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))