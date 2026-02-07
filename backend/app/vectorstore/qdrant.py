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
BASE_COLLECTION_NAME = settings.QDRANT_COLLECTION

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def _get_collection_name(dimension: int) -> str:
    return f"{BASE_COLLECTION_NAME}_{dimension}"

def ensure_collection(dimension: int):
    collection_name = _get_collection_name(dimension)
    try:
        if not client.collection_exists(collection_name):
            logging.info(f"[QDRANT] Creando colección '{collection_name}' (dim={dimension})...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
            )
    except Exception as e:
        logging.error(f"[QDRANT ERROR] Fallo creando colección: {e}")

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

def upsert_vectors(vectors: list[dict], dimension: int):
    collection_name = _get_collection_name(dimension)
    points = [PointStruct(id=v["id"], vector=v["vector"], payload=v["payload"]) for v in vectors]
    client.upsert(collection_name=collection_name, points=points, wait=True)

def search_vectors(query_vector: List[float], dimension: int, top_k: int = 5, document_ids: List[str] = None, tags: List[str] = None):
    collection_name = _get_collection_name(dimension)
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

def fetch_chunks_by_document_id(doc_id: str, dimension: int, limit: int = 2000) -> List[DocumentChunk]:
    """Recupera los chunks de un documento en una colección específica."""
    collection_name = _get_collection_name(dimension)
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

def get_stored_document_ids(dimension: int) -> Set[str]:
    """Obtiene todos los IDs de documentos presentes en una dimensión específica."""
    collection_name = _get_collection_name(dimension)
    if not client.collection_exists(collection_name): return set()
    
    # Scroll simple (si hay muchísimos documentos, esto debería paginarse en bucle)
    response, _ = client.scroll(
        collection_name=collection_name, 
        limit=10000, 
        with_payload=["document_id"], 
        with_vectors=False
    )
    return {pt.payload["document_id"] for pt in response if "document_id" in pt.payload}

def delete_document_from_collection(doc_id: str, dimension: int):
    """Borra un documento solo de la colección especificada (Granular)."""
    collection_name = _get_collection_name(dimension)
    if client.collection_exists(collection_name):
        client.delete(
            collection_name=collection_name,
            points_selector=FilterSelector(
                filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))])
            )
        )
        logging.info(f"[QDRANT] Documento {doc_id} eliminado de {collection_name}")

def delete_all_chunks_for_document_globally(doc_id: str):
    """Borra un documento de TODAS las colecciones (Limpieza total)."""
    try:
        collections = client.get_collections().collections
        for col in collections:
            if col.name.startswith(BASE_COLLECTION_NAME):
                client.delete(
                    collection_name=col.name,
                    points_selector=FilterSelector(
                        filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))])
                    )
                )
    except Exception as e:
        logging.error(f"[QDRANT ERROR] Limpieza global falló: {e}")