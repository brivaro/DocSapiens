from typing import List
from backend.models.chat import Chunk
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import os
from backend.services.embedding_service import embedding_service

QDRANT_HOST = os.getenv("QDRANT_HOST")
QDRANT_PORT = int(os.getenv("QDRANT_PORT"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def retrieve_chunks(query: str, top_k: int = 5, document_ids: List[str] = None) -> List[Chunk]:
    # Pasamos una lista y tomamos el primer resultado.
    embeddings_list = embedding_service.embed([query])
    if not embeddings_list:
        raise ValueError("No se pudo generar el embedding para la consulta.")
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
    # Devuelve los chunks y metadatos
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