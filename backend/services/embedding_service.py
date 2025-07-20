# TODO: SE PUEDE BORRAR YA LO HACE LA LÓGICA DEL LLM_PROVIDER

import random
from fastapi import HTTPException
import os
import uuid
from backend.models.document import DocumentChunk, DocumentCreate
import vertexai
from vertexai.language_models import TextEmbeddingModel
from typing import List
from google import genai

# --- Configuración ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "text-embedding-004"

# --- Configuración de la API Key ---
try:
    client = genai.Client()
except Exception as e:
    print(f"[ERROR] Error al configurar la API de Google Generative AI: {e}")


class EmbeddingService:
    """
    Servicio para generar embeddings usando la API de Google AI Studio.
    """
    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            # El modelo se especifica en la llamada
            result = client.models.embed_content(
                model=f"models/{MODEL_NAME}",
                content=texts,
                task_type="RETRIEVAL_DOCUMENT" # O el tipo de tarea que necesites: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types?hl=es-419
            )
            return result['embedding']
        except Exception as e:
            print(f"[ERROR] Error al generar embedding con Google AI: {e}")
            raise RuntimeError(f"Fallo en la generación de embedding: {e}")
    
    def generate_embeddings(self, chunks: List[DocumentChunk], doc_id: str, doc: DocumentCreate) -> List[dict]:
        """
        Genera embeddings para los chunks del documento y los prepara para subir a Qdrant.
        """
        texts = [chunk.text for chunk in chunks]
        if not texts:
            print(f"[ERROR] No hay texto para generar embeddings en el documento {doc_id}.")
            return []

        try:
            # TODO: Generar embedding randoms de tamaño 768, generar con numpy o random (evitamos llamadas a la API)
            embeddings = [[random.uniform(-1, 1) for _ in range(768)] for _ in range(len(texts))]
            #embeddings = self.embed(texts)
            
            print(f"[INFO] Generados {len(embeddings)} embeddings para el documento {doc_id}.")
            vectors = []
            for i, chunk in enumerate(chunks):
                if chunk.text and chunk.text.strip() and len(embeddings) > i:
                    vectors.append({
                        "id": str(uuid.uuid4()),
                        "embedding": embeddings[i],
                        "metadata": {
                            "document_id": doc_id, 
                            "chunk_id": chunk.chunk_id,
                            "filename": doc.filename,
                            "content_type": doc.content_type,
                            "start": chunk.start, 
                            "end": chunk.end, 
                            "text": chunk.text,
                            "tags": doc.tags 
                        }
                    })
            return vectors
        
        except Exception as e:
            print(f"[ERROR] Error al generar embeddings para el documento {doc_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Error al generar embeddings: {e}")

embedding_service = EmbeddingService()

## --- Configuración CON LA VERTEX AI API --- https://cloud.google.com/vertex-ai/docs/python-sdk/use-vertex-ai-python-sdk?hl=es-419
## NOTEBOOKS: https://cloud.google.com/vertex-ai/docs/tutorials/jupyter-notebooks?hl=es-419#colab
#GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
#GCP_REGION = os.getenv("GCP_REGION")
#MODEL_NAME = "text-embedding-004"  # text-embedding-005, text-embedding-004, text-multilingual-embedding-002
#
## --- Inicialización del SDK de Vertex AI ---
## Esto se hace una vez cuando el módulo se importa.
## El SDK usará las credenciales de GOOGLE_APPLICATION_CREDENTIALS automáticamente.
#try:
#    vertexai.init(project=GCP_PROJECT_ID, location=GCP_REGION)
#except Exception as e:
#    print(f"[ERROR] Error al inicializar Vertex AI SDK: {e}")
#    # En un entorno real, podrías querer manejar esto con más detalle.
#
#class EmbeddingService:
#    """
#    Servicio para generar embeddings usando el SDK de Vertex AI.
#    """
#    def __init__(self):
#        # Carga el modelo una sola vez para reutilizarlo.
#        self.model = TextEmbeddingModel.from_pretrained(MODEL_NAME)
#
#    def embed(self, texts: List[str]) -> List[List[float]]:
#        """
#        Genera embeddings para una lista de textos.
#
#        Args:
#            texts: Una lista de strings para los que generar embeddings.
#
#        Returns:
#            Una lista de embeddings, donde cada embedding es una lista de floats.
#        """
#        if not texts:
#            return []
#        
#        try:
#            # El método get_embeddings está optimizado para procesar lotes.
#            embeddings = self.model.get_embeddings(texts)
#            # Retorna la lista de valores numéricos de cada embedding.
#            return [embedding.values for embedding in embeddings]
#        except Exception as e:
#            # Manejo de errores más robusto.
#            print(f"[ERROR] Error al generar embedding con Vertex AI: {e}")
#            # Devuelve una lista vacía o vuelve a lanzar la excepción según la lógica de tu app.
#            raise RuntimeError(f"Fallo en la generación de embedding: {e}")
#
#
## Se crea una única instancia del servicio para ser importada en otros módulos.
#embedding_service = EmbeddingService()