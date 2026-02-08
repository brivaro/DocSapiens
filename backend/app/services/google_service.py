import logging
import numpy as np
from typing import List, Optional, Iterator
from google import genai
from google.genai import types

from app.settings.config import settings

class GoogleService:
    def __init__(self):
        try:
            self.client = genai.Client()
        except Exception as e:
            logging.info(f"[CRITICAL] Error inicializando Google GenAI Client: {e}")
            raise

    def generate_embeddings(
        self, 
        texts: List[str], 
        model: str, 
        dimension: int,
        task_type: str = "RETRIEVAL_DOCUMENT", # Default para documentos
        doc_title: Optional[str] = None # Google recomienda título para documentos
    ) -> List[List[float]]:
        """
        Genera embeddings usando task_type específico y MRL.
        """
        try:
            config = types.EmbedContentConfig(
                output_dimensionality=dimension,
                task_type=task_type,
                title=doc_title if task_type == "RETRIEVAL_DOCUMENT" else None
            )

            # Nota: Si doc_title se pasa, Google prefiere que sea un solo contenido o 
            # que todos los chunks pertenezcan a ese título. 
            # Como procesamos por documento en el service, esto es válido.
            
            response = self.client.models.embed_content(
                model=model,
                contents=texts,
                config=config
            )
            
            final_embeddings = []
            embeddings_list = response.embeddings if hasattr(response, 'embeddings') else []
            
            for emb in embeddings_list:
                vector = np.array(emb.values)
                # Normalización L2 manual si usamos MRL (dimensiones reducidas)
                if dimension != 3072:
                    norm = np.linalg.norm(vector)
                    if norm > 0: vector = vector / norm
                final_embeddings.append(vector.tolist())
                
            return final_embeddings
        except Exception as e:
            logging.info(f"[ERROR] Fallo generando embeddings ({task_type}): {e}")
            raise

    def chat_completion(
        self, 
        model: str = None,
        prompt: str = "", 
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = None
    ) -> str:
        """Generación de texto simple (no streaming)."""
        config = self._build_gen_config(temperature, max_tokens, thinking_budget)
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=config.model_copy(update={"system_instruction": system_instruction}) if system_instruction else config
            )
            return response.text
        except Exception as e:
            logging.info(f"[ERROR] Chat completion falló: {e}")
            raise

    # --- NUEVO MÉTODO PARA STREAMING ---
    def chat_stream_generator(
        self, 
        model: str = None, 
        prompt: str = "", 
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = None
    ) -> Iterator[str]:
        """
        Generador que cede (yields) tokens de texto a medida que llegan de Google.
        """
        config = self._build_gen_config(temperature, max_tokens, thinking_budget)

        try:
            # Usamos generate_content_stream
            response = self.client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=config.model_copy(update={"system_instruction": system_instruction}) if system_instruction else config
            )
            
            for chunk in response:
                # Dependiendo de la versión de la librería, el texto puede estar en chunk.text o chunk.parts[0].text
                if hasattr(chunk, 'text') and chunk.text:
                    yield chunk.text
                elif hasattr(chunk, 'candidates') and chunk.candidates:
                     for part in chunk.candidates[0].content.parts:
                         if part.text:
                             yield part.text

        except Exception as e:
            logging.error(f"[ERROR] Google Chat Stream falló: {e}")
            yield f"\n[Error de generación: {str(e)}]"

    def generate_audio(self, text: str, voice_name: str = "Kore", model: str = None) -> bytes:
        """Generación de audio simple."""
        model_to_use = model or settings.DEFAULT_TTS_MODEL
        try:
            prompt = f"Please read the following text clearly and professionally: {text}"
            response = self.client.models.generate_content(
                model=model_to_use,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name
                            )
                        )
                    )
                )
            )
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("audio"):
                        return part.inline_data.data
            raise ValueError("No audio data returned")
        except Exception as e:
            logging.info(f"[ERROR] TTS falló: {e}")
            raise

    def _build_gen_config(self, temp, max_tokens, thinking_budget) -> types.GenerateContentConfig:
        """Helper para construir la configuración, manejando thinking_budget solo si aplica."""
        
        # Configuración base
        conf = types.GenerateContentConfig(
            temperature=temp,
            max_output_tokens=max_tokens
        )

        if thinking_budget is not None and thinking_budget > 0:
            conf.thinking_config = types.ThinkingConfig(thinking_budget=thinking_budget)
        return conf

google_service = GoogleService()