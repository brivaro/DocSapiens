import logging
from typing import List, Set, Any
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

    # Usamos query_points en lugar de search (deprecado/eliminado)
    result = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True
    )
    
    # query_points devuelve un objeto QueryResponse, accedemos a la lista de puntos
    return result.points

def fetch_chunks_by_document_id(collection_name: str, doc_id: str, limit: int = 2000) -> List[DocumentChunk]:
    if not client.collection_exists(collection_name):
        logging.warning(f"[QDRANT] La colección {collection_name} no existe.")
        return []

    str_doc_id = str(doc_id)
    logging.info(f"[QDRANT] Buscando chunks para DocID: {str_doc_id} en {collection_name}")

    try:
        response, _ = client.scroll(
            collection_name=collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="document_id", match=MatchValue(value=str_doc_id))
                ]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        
        logging.info(f"[QDRANT] Encontrados {len(response)} puntos/chunks.")

        chunks = []
        for i, pt in enumerate(response):
            # Asegurar que el payload es un diccionario
            payload: dict = dict(pt.payload) if pt.payload else {}
            
            # LOG DE DEBUG (Solo el primero para no saturar)
            if i == 0:
                logging.info(f"[QDRANT DEBUG] Payload del primer chunk: {payload.keys()}")

            # Extracción robusta con logs de error si falta texto
            text_val = str(payload.get("text", ""))
            if not text_val:
                # Intento de fallback por si la clave cambió
                text_val = str(payload.get("page_content", ""))
            
            chunks.append(
                DocumentChunk(
                    document_id=str(payload.get("document_id", str_doc_id)),
                    chunk_id=int(payload.get("chunk_id", 0)),
                    text=text_val,
                    start=int(payload.get("start", 0)),
                    end=int(payload.get("end", 0))
                )
            )
        
        return sorted(chunks, key=lambda x: x.chunk_id)
        
    except Exception as e:
        logging.error(f"[QDRANT ERROR] Error al recuperar chunks: {e}")
        return []

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