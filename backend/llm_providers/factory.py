import os
from .base import LLMProvider
from .google import GoogleGeminiProvider
# Más adelante: from .ollama import OllamaProvider

def get_llm_provider() -> LLMProvider:
    """
    Fábrica que lee una variable de entorno para decidir qué proveedor de LLM instanciar.
    """
    provider_name = os.getenv("LLM_PROVIDER").lower()
    
    if provider_name == "google":
        chat_model = os.getenv("GEMINI_MODEL")
        embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL")
        tts_model = os.getenv("GEMINI_TTS_MODEL")
        image_model = os.getenv("GEMINI_IMAGE_GENERATION_MODEL")
        return GoogleGeminiProvider(chat_model=chat_model, embedding_model=embedding_model, 
                                    speech_model=tts_model, image_model=image_model)
    # Más adelante:
    # if provider_name == "ollama":
    #     return OllamaProvider(...)
    
    raise ValueError(f"[ERROR] Proveedor de LLM desconocido: {provider_name}")