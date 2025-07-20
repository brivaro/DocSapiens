from typing import List
from backend.models.chat import Chunk
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import os
from backend.llm_providers.factory import get_llm_provider

QDRANT_HOST = os.getenv("QDRANT_HOST")
QDRANT_PORT = int(os.getenv("QDRANT_PORT"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def retrieve_chunks(query: str, top_k: int = 5, document_ids: List[str] = None) -> List[Chunk]:
    embeddings_list = get_llm_provider().generate_embeddings([query], doc_id="[RETRIEVE CHUNKS]")
    
    if not embeddings_list:
        print("[ERROR] No se pudo generar el embedding para la consulta.")
        raise ValueError("[ERROR] No se pudo generar el embedding para la consulta.")
    
    embedding = embeddings_list[0]
    search_filter = None
    
    if document_ids:
        search_filter = Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=document_ids))])
    
    hits = client.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=embedding,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True
    )

    return [
        Chunk(
            chunk_id=hit.payload.get("chunk_id"),
            document_id=hit.payload.get("document_id"),
            text=hit.payload.get("text"),
            start=hit.payload.get("start"),
            end=hit.payload.get("end"),
            score=hit.score
        ) for hit in hits
    ]