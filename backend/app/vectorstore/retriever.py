import logging
from typing import List, Optional
from app.models.chat import Chunk
from app.services.google_service import google_service
from app.db.session import SessionLocal
from app.db import crud
from app.vectorstore import qdrant

def retrieve_chunks(
    query: str, 
    top_k: int = 5, 
    document_ids: Optional[List[str]] = None,
    tags: Optional[List[str]] = None
) -> List[Chunk]:
    
    # 1. Obtener configuración activa
    with SessionLocal() as db:
        config = crud.get_active_rag_config(db)
        if not config:
            dimension = 768
            model_name = "gemini-embedding-001"
            ingestion_task_type = "RETRIEVAL_DOCUMENT"
        else:
            dimension = config.embedding_dimension
            model_name = config.embedding_model
            ingestion_task_type = config.embedding_task_type

    # 2. Determinar el task_type para la QUERY
    # Regla: Si indexamos como DOCUMENT, buscamos como QUERY. 
    # Si indexamos como SIMILARITY, buscamos como SIMILARITY.
    query_task_type = "RETRIEVAL_QUERY" 
    if ingestion_task_type == "SEMANTIC_SIMILARITY":
        query_task_type = "SEMANTIC_SIMILARITY"
    elif ingestion_task_type == "CLASSIFICATION":
        query_task_type = "CLASSIFICATION"
    # Por defecto RETRIEVAL_QUERY funciona bien contra RETRIEVAL_DOCUMENT

    logging.info(f"[RETRIEVER] Embedding query con task_type: {query_task_type}")

    # 3. Generar embedding de la pregunta
    embeddings = google_service.generate_embeddings(
        texts=[query], 
        model=model_name, 
        dimension=dimension,
        task_type=query_task_type
    )
    
    if not embeddings:
        raise ValueError("[ERROR] No se pudo generar el embedding para la consulta.")
    
    query_vector = embeddings[0]

    # 3. Buscar en Qdrant en la colección específica de esa dimensión
    hits = qdrant.search_vectors(
        query_vector=query_vector,
        dimension=dimension,
        top_k=top_k,
        document_ids=document_ids,
        tags=tags
    )

    # 4. Mapear resultados
    return [
        Chunk(
            chunk_id=hit.payload.get("chunk_id"),
            document_id=hit.payload.get("document_id"),
            chunk_tags=hit.payload.get("tags", []),
            text=hit.payload.get("text"),
            start=hit.payload.get("start"),
            end=hit.payload.get("end"),
            score=hit.score
        ) for hit in hits
    ]