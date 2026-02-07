from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import crud
from app.models.rag_settings import RagConfigUpdate, RagConfigResponse
from app.services.document_service import document_service

router = APIRouter()

@router.get("/", response_model=RagConfigResponse)
def get_current_config(db: Session = Depends(get_db)):
    """Obtiene la configuración activa del sistema RAG."""
    config = crud.get_active_rag_config(db)
    if not config:
        # Fallback de seguridad si no existe (aunque el arranque lo crea)
        config = crud.set_rag_config(db, 768)
    return config

@router.post("/", response_model=RagConfigResponse)
def update_config(
    config_in: RagConfigUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Actualiza la dimensión de los embeddings.
    Esto desencadena una sincronización en segundo plano:
    1. Crea/Verifica la colección en Qdrant para la nueva dimensión.
    2. Detecta qué documentos faltan en esa colección.
    3. Genera embeddings y los sube sin tener que volver a subir el archivo.
    """
    # 1. Guardar nueva configuración
    new_config = crud.set_rag_config(db, dimension=config_in.embedding_dimension)
    
    # 2. Lanzar sincronización en background
    background_tasks.add_task(document_service.sync_active_collection)
    
    return new_config