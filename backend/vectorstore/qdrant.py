from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue, FilterSelector
import os

QDRANT_HOST = os.getenv("QDRANT_HOST")
QDRANT_PORT = int(os.getenv("QDRANT_PORT"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

VECTOR_SIZE = 768  # Ajusta según el modelo de embeddings: para el text-...-004 de google es 768

def ensure_collection():
    try:
        collections_response = client.get_collections()
        collection_names = [c.name for c in collections_response.collections]
        if QDRANT_COLLECTION not in collection_names:
            client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            )
    except Exception as e:
        print(f"[ERROR] Error al conectar o crear colección en Qdrant: {e}")

def upsert_vectors(vectors: list[dict]):
    points = [PointStruct(id=chunk["id"], vector=chunk["embedding"], payload=chunk["metadata"]) for chunk in vectors]
    client.upsert(collection_name=QDRANT_COLLECTION, points=points, wait=True)

def get_distinct_documents() -> list[dict]:
    """Obtiene una lista de documentos únicos basados en los metadatos de Qdrant."""
    seen_doc_ids = set()
    distinct_docs = []
    
    # Hacemos scroll para obtener una muestra de puntos y extraer los documentos
    # TODO: Para producción, se podría necesitar paginación más robusta.
    response, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        limit=1000, # Aumentar si tienes más de 1000 documentos
        with_payload=True,
    )
    
    for hit in response:
        doc_id = hit.payload.get("document_id")
        if doc_id and doc_id not in seen_doc_ids:
            seen_doc_ids.add(doc_id)
            distinct_docs.append({
                "id": doc_id,
                "filename": hit.payload.get("filename"),
                "content_type": hit.payload.get("content_type"),
                "tags": hit.payload.get("tags"),
                "status": "Processed"
            })
            
    return distinct_docs

def get_chunks_by_document_id(doc_id: str, limit: int = 500) -> list:
    """Recupera todos los chunks de un documento específico."""
    response, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        scroll_filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))]),
        limit=limit,
        with_payload=True,
    )
    return [hit.payload for hit in response]

def document_exists(filename: str) -> bool:
    """Comprueba si un documento con el mismo nombre ya existe."""
    response, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        scroll_filter=Filter(must=[FieldCondition(key="filename", match=MatchValue(value=filename))]),
        limit=1
    )
    return len(response) > 0

def delete_chunks_by_document_id(doc_id: str):
    """Elimina todos los puntos (chunks) asociados a un document_id."""
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=FilterSelector(
            filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))])
        )
    )