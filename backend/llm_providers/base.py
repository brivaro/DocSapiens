# backend/llm_providers/base.py
from abc import ABC, abstractmethod
from typing import Iterator, List, Dict, Optional

from backend.models.document import DocumentChunk, DocumentCreate

class LLMProvider(ABC):
    """
    Clase base abstracta para cualquier proveedor de modelos de lenguaje (Google, Ollama, etc.).
    Define el "contrato" que cada proveedor debe cumplir.
    """
    @abstractmethod
    def get_model_name(self) -> str:
        """Devuelve el nombre del modelo de chat por defecto."""
        pass

    @abstractmethod
    def get_embedding_model_name(self) -> str:
        """Devuelve el nombre del modelo de embedding."""
        pass

    @abstractmethod
    def get_embedding_dimension(self) -> int:
        """Devuelve la dimensión del vector de embedding."""
        pass

    @abstractmethod
    def generate_embeddings(self, chunks: List[str], doc_id: str) -> List[List[float]]:
        """Genera embeddings para una lista de textos de un documento."""
        pass

    @abstractmethod
    def generate_chat_completion(self, context: str, question: str, model: str = None, **kwargs) -> str:
        """Genera una respuesta de chat usando un contexto y una pregunta."""
        pass

    @abstractmethod
    def generate_chat_completion_stream(self, context: str, question: str, model: str = None, **kwargs) -> Iterator[str]:
        """Genera una respuesta de chat en modo streaming."""
        pass

    @abstractmethod
    def generate_image(
        self,
        prompt: str,
        model: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Genera una imagen y un texto descriptivo a partir de un prompt.
        Devuelve un diccionario con 'text' y 'image_bytes'.
        """
        pass

    @abstractmethod
    def generate_multimodal_content(
        self,
        prompt: List[any], # Ahora acepta una lista para texto e imágenes
        model: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Genera contenido multimodal (texto e imagen) a partir de un prompt.
        Devuelve un diccionario con 'text' y 'image_bytes'.
        """
        pass

    @abstractmethod
    def generate_specialized_image(
        self,
        prompt: str,
        number_of_images: int = 1,
        aspect_ratio: str = "1:1",
        model: Optional[str] = None
    ) -> List[bytes]:
        """
        Genera solo imágenes usando un modelo especializado como Imagen.
        Devuelve una lista de bytes de imágenes.
        """
        pass

    @abstractmethod
    def generate_speech(
        self,
        text: str,
        voice_name: str,
        model: Optional[str] = None
    ) -> bytes:
        """
        Convierte texto a voz (TTS).
        Devuelve los bytes del archivo de audio.
        """
        pass