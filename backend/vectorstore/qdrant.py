import os
from typing import List, Set
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    PointStruct, VectorParams, Distance, Filter, 
    FieldCondition, MatchValue, MatchAny, FilterSelector
)
from backend.models.document import DocumentChunk, DocumentCreate

# Configuración básica
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
BASE_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "docsapiens")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def _get_collection_name(dimension: int) -> str:
    """
    Genera el nombre de la colección basado en la dimensión.
    Ej: 'docsapiens_768'
    """
    return f"{BASE_COLLECTION_NAME}_{dimension}"

def ensure_collection(dimension: int):
    """
    Asegura que exista la colección para la dimensión específica.
    """
    collection_name = _get_collection_name(dimension)
    try:
        if not client.collection_exists(collection_name):
            print(f"[QDRANT] Creando colección '{collection_name}' con dimensión {dimension}...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
            )
        else:
            print(f"[QDRANT] La colección '{collection_name}' ya existe.")
    except Exception as e:
        print(f"[ERROR] Fallo al asegurar colección Qdrant: {e}")

def generate_vector_objects(
        embeddings: List[List[float]], 
        chunks: List[DocumentChunk], 
        doc_id: str, 
        doc: DocumentCreate
) -> List[dict]:
    """
    Prepara los objetos (puntos) para insertar en Qdrant.
    """
    vectors = []
    for i, chunk in enumerate(chunks):
        # Validación de seguridad para asegurar que hay un embedding para cada chunk
        if i < len(embeddings):
            vectors.append({
                "id": str(uuid.uuid4()),
                "vector": embeddings[i],
                "payload": {
                    "document_id": doc_id, 
                    "chunk_id": chunk.chunk_id,
                    "filename": doc.filename,
                    "content_type": doc.content_type,
                    "start": chunk.start, 
                    "end": chunk.end, 
                    "text": chunk.text,
                    "tags": doc.tags or []
                }
            })
    return vectors

def upsert_vectors(vectors: list[dict], dimension: int):
    """
    Inserta vectores en la colección correspondiente a la dimensión.
    """
    collection_name = _get_collection_name(dimension)
    
    # Convertimos dicts a PointStruct
    points = [
        PointStruct(id=v["id"], vector=v["vector"], payload=v["payload"]) 
        for v in vectors
    ]
    
    # Batch upsert
    # Qdrant maneja bien batches grandes, pero por seguridad si son miles se podría paginar.
    client.upsert(collection_name=collection_name, points=points, wait=True)

def search_vectors(
    query_vector: List[float], 
    dimension: int,
    top_k: int = 5, 
    document_ids: List[str] = None,
    tags: List[str] = None
):
    """
    Busca chunks similares en la colección específica.
    """
    collection_name = _get_collection_name(dimension)
    
    # Construcción dinámica de filtros
    search_filter = None
    conditions = []

    if document_ids:
        conditions.append(
            FieldCondition(key="document_id", match=MatchAny(any=document_ids))
        )
    
    if tags:
        conditions.append(
            FieldCondition(key="tags", match=MatchAny(any=tags))
        )

    if conditions:
        # Usamos lógica 'should' (OR) si hay múltiples criterios, o 'must' si quieres ser estricto.
        # En tu código anterior usabas una lógica mixta. Aquí la simplifico a:
        # Si hay docs Y tags -> Debe cumplir (Docs O Tags) -> Filter(should=...)
        # Ajusta esto según tu lógica de negocio deseada. 
        # Aquí asumiré que si filtra por doc y tag, quiere que cumpla AL MENOS UNO de los criterios.
        search_filter = Filter(should=conditions)

    return client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True
    )

def get_stored_document_ids(dimension: int) -> Set[str]:
    """
    Crucial para la sincronización: Devuelve un SET con los IDs de documentos 
    que YA existen en la colección de esta dimensión.
    """
    collection_name = _get_collection_name(dimension)
    
    # Verificamos si existe primero para no dar error
    if not client.collection_exists(collection_name):
        return set()

    # Usamos scroll para recuperar solo los IDs únicos (agregación manual)
    # Nota: Qdrant tiene una API de 'Facet' o 'Group By' que es más eficiente,
    # pero scroll es seguro para versiones estándar.
    
    # Optimizacion: Solo traemos el payload 'document_id'
    response, _ = client.scroll(
        collection_name=collection_name,
        limit=10000, # Límite alto para chequear. Si tienes >10k docs, necesitarás paginar este loop.
        with_payload=["document_id"],
        with_vectors=False
    )
    
    existing_ids = set()
    for point in response:
        if "document_id" in point.payload:
            existing_ids.add(point.payload["document_id"])
            
    return existing_ids

def delete_chunks_by_document_id(doc_id: str, dimension: int):
    """
    Elimina chunks de un documento en una colección específica.
    """
    collection_name = _get_collection_name(dimension)
    if client.collection_exists(collection_name):
        client.delete(
            collection_name=collection_name,
            points_selector=FilterSelector(
                filter=Filter(must=[FieldCondition(key="document_id", match=MatchValue(value=doc_id))])
            )
        )

def delete_all_chunks_for_document_globally(doc_id: str):
    """
    Si borramos un documento de la base de datos, debemos borrarlo de TODAS 
    las colecciones posibles (768, 1536, etc.) para limpiar basura.
    """
    # Intentamos borrar en todas las dimensiones conocidas o iteramos colecciones
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
                print(f"[QDRANT] Documento {doc_id} eliminado de {col.name}")
    except Exception as e:
        print(f"[ERROR] Limpieza global falló: {e}")