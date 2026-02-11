import logging
from typing import List, Set
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    PointStruct, VectorParams, Distance, Filter, 
    FieldCondition, MatchValue, MatchAny, FilterSelector
)
from app.models.document import DocumentChunk
from app.settings.config import settings

QDRANT_HOST = settings.QDRANT_HOST
QDRANT_PORT = int(settings.QDRANT_PORT)

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def ensure_collection(collection_name: str, dimension: int):
    """Crea una colección si no existe."""
    try:
        if not client.collection_exists(collection_name):
            logging.info(f"[QDRANT] Creando colección '{collection_name}' (dim={dimension})...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
            )
    except Exception as e:
        logging.error(f"[QDRANT ERROR] Fallo creando colección {collection_name}: {e}")
        raise e

def delete_collection(collection_name: str):
    """Borra una colección entera."""
    try:
        if client.collection_exists(collection_name):
            client.delete_collection(collection_name)
            logging.info(f"[QDRANT] Colección '{collection_name}' eliminada.")
    except Exception as e:
        logging.error(f"[QDRANT ERROR] Fallo borrando colección {collection_name}: {e}")

def upsert_vectors(collection_name: str, vectors: list[dict]):
    """Inserta vectores en una colección específica."""
    points = [PointStruct(id=v["id"], vector=v["vector"], payload=v["payload"]) for v in vectors]
    client.upsert(collection_name=collection_name, points=points, wait=True)

def search_vectors(
    collection_name: str, 
    query_vector: List[float], 
    top_k: int = 5, 
    document_ids: List[str] = None, 
    tags: List[str] = None
):
    """Busca en una colección específica."""
    conditions = []
    if document_ids:
        conditions.append(FieldCondition(key="document_id", match=MatchAny(any=document_ids)))
    if tags:
        conditions.append(FieldCondition(key="tags", match=MatchAny(any=tags)))
    
    search_filter = Filter(should=conditions) if conditions else None

    return client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True
    )

def fetch_chunks_by_document_id(collection_name: str, doc_id: str, limit: int = 2000) -> List[DocumentChunk]:
    if not client.collection_exists(collection_name): return []

    response, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))]),
        limit=limit,
        with_payload=True,
        with_vectors=False
    )
    
    chunks = [
        DocumentChunk(
            document_id=pt.payload.get("document_id"),
            chunk_id=pt.payload.get("chunk_id"),
            text=pt.payload.get("text"),
            start=pt.payload.get("start", 0),
            end=pt.payload.get("end", 0)
        ) for pt in response
    ]
    return sorted(chunks, key=lambda x: x.chunk_id)

def delete_document_from_collection(collection_name: str, doc_id: str):
    if client.collection_exists(collection_name):
        client.delete(
            collection_name=collection_name,
            points_selector=FilterSelector(
                filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))])
            )
        )
        logging.info(f"[QDRANT] Documento {doc_id} eliminado de {collection_name}")

def generate_vector_objects(embeddings: List[List[float]], chunks: List[DocumentChunk], doc_id: str, filename: str, tags: List[str]) -> List[dict]:
    vectors = []
    for i, chunk in enumerate(chunks):
        if i < len(embeddings):
            vectors.append({
                "id": str(uuid.uuid4()),
                "vector": embeddings[i],
                "payload": {
                    "document_id": doc_id, 
                    "chunk_id": chunk.chunk_id,
                    "filename": filename,
                    "text": chunk.text,
                    "start": chunk.start,
                    "end": chunk.end,
                    "tags": tags or []
                }
            })
    return vectors