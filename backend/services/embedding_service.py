import os
import vertexai
from vertexai.language_models import TextEmbeddingModel
from typing import List
import google.generativeai as genai

# --- Configuración ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "text-embedding-004"

# --- Configuración de la API Key ---
try:
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"Error al configurar la API de Google Generative AI: {e}")


class EmbeddingService:
    """
    Servicio para generar embeddings usando la API de Google AI Studio.
    """
    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            # El modelo se especifica en la llamada
            result = genai.embed_content(
                model=f"models/{MODEL_NAME}",
                content=texts,
                task_type="RETRIEVAL_DOCUMENT" # O el tipo de tarea que necesites: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types?hl=es-419
            )
            return result['embedding']
        except Exception as e:
            print(f"Error al generar embedding con Google AI: {e}")
            raise RuntimeError(f"Fallo en la generación de embedding: {e}")


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
#    print(f"Error al inicializar Vertex AI SDK: {e}")
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
#            print(f"Error al generar embedding con Vertex AI: {e}")
#            # Devuelve una lista vacía o vuelve a lanzar la excepción según la lógica de tu app.
#            raise RuntimeError(f"Fallo en la generación de embedding: {e}")
#
#
## Se crea una única instancia del servicio para ser importada en otros módulos.
#embedding_service = EmbeddingService()