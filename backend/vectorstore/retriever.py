import re
from typing import List, Optional
from backend.models.chat import Chunk
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, MatchAny, MatchText
import os
from backend.llm_providers.factory import get_llm_provider

QDRANT_HOST = os.getenv("QDRANT_HOST")
QDRANT_PORT = int(os.getenv("QDRANT_PORT"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def retrieve_chunks(
    query: str, 
    top_k: int = 5, 
    document_ids: Optional[List[str]] = None,
    tags: Optional[List[str]] = None
) -> List[Chunk]:
    
    embeddings = get_llm_provider().generate_embeddings([query], doc_id="[RETRIEVE CHUNKS]")
    
    if not embeddings:
        raise ValueError("[ERROR] No se pudo generar el embedding para la consulta.")
    
    embedding = embeddings[0]
    
    # --- LÓGICA DE FILTRADO DINÁMICO ---
    search_filter = None
    
    # Caso 1: Se proporcionan AMBOS filtros (lógica OR)
    if document_ids and tags:
        print("[INFO] Filtrando por document_ids O tags.")
        search_filter = Filter(
            should=[
                FieldCondition(key="document_id", match=MatchAny(any=document_ids)),
                FieldCondition(key="tags", match=MatchAny(any=tags))
            ]
        )
    
    # Caso 2: Solo se proporcionan document_ids
    elif document_ids:
        print("[INFO] Filtrando solo por document_ids.")
        search_filter = Filter(
            must=[
                FieldCondition(key="document_id", match=MatchAny(any=document_ids))
            ]
        )
        
    # Caso 3: Solo se proporcionan tags
    elif tags:
        print("[INFO] Filtrando solo por tags.")
        search_filter = Filter(
            must=[
                FieldCondition(key="tags", match=MatchAny(any=tags))
            ]
        )
    
    # Caso 4: No se proporciona ningún filtro (search_filter sigue siendo None)
    else:
        print("[INFO] No se aplicaron filtros a la búsqueda de chunks.")

    # 4. Ejecutamos la búsqueda con el filtro dinámico
    hits = client.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=embedding,
        limit=top_k,
        query_filter=search_filter, # <-- Pasamos el filtro aquí
        with_payload=True
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