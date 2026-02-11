from typing import List, Optional
from app.models.chat import Chunk
from app.services.google_service import google_service
from app.db.session import SessionLocal
from app.db import crud
from app.vectorstore import qdrant
import logging

def retrieve_chunks(
    query: str, 
    vector_store_id: str,
    top_k: int = 5, 
    document_ids: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    search_task_type: str = "RETRIEVAL_QUERY" # Query por defecto
) -> List[Chunk]:
    
    with SessionLocal() as db:
        vs = crud.get_vector_store(db, vector_store_id)
        if not vs:
            raise ValueError("Vector Store no encontrado.")
        
        dimension = vs.embedding_dimension
        model_name = vs.embedding_model
        collection_name = f"{vs.name}_{dimension}"

    # Generar embedding de la pregunta
    embeddings = google_service.generate_embeddings(
        texts=[query], 
        model=model_name, 
        dimension=dimension,
        task_type=search_task_type
    )
    
    if not embeddings: return []
    query_vector = embeddings[0]

    hits = qdrant.search_vectors(
        collection_name=collection_name,
        query_vector=query_vector,
        top_k=top_k,
        document_ids=document_ids,
        tags=tags
    )

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