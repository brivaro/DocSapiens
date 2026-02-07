import os
import numpy as np
from typing import List, Optional, Iterator
from google import genai
from google.genai import types

class GoogleService:
    def __init__(self):
        # La API Key se toma automáticamente de os.environ["GEMINI_API_KEY"]
        try:
            self.client = genai.Client()
        except Exception as e:
            print(f"[CRITICAL] Error inicializando Google GenAI Client: {e}")
            raise

    def generate_embeddings(self, texts: List[str], model: str, dimension: int) -> List[List[float]]:
        """
        Genera embeddings usando el modelo especificado y aplica MRL (Matryoshka Representation Learning).
        Si la dimensión es menor a la nativa (3072), normaliza los vectores usando L2 norm.
        """
        try:
            # Petición a la API de Google
            # Nota: embed_content acepta una lista de textos
            response = self.client.models.embed_content(
                model=model,
                contents=texts,
                config=types.EmbedContentConfig(
                    output_dimensionality=dimension
                )
            )

            # Procesamiento y Normalización
            final_embeddings = []
            for emb in response.embeddings:
                vector = np.array(emb.values)
                
                # Google Docs dice: "For other dimensions (than 3072)... you need to normalize"
                if dimension != 3072:
                    norm = np.linalg.norm(vector)
                    if norm > 0:
                        vector = vector / norm
                
                final_embeddings.append(vector.tolist())

            return final_embeddings

        except Exception as e:
            print(f"[ERROR] Fallo generando embeddings ({model}, dim={dimension}): {e}")
            raise

    def chat_completion(
        self, 
        model: str, 
        prompt: str, 
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
            print(f"[ERROR] Chat completion falló: {e}")
            raise

    def chat_stream(
        self, 
        model: str, 
        prompt: str, 
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = None
    ) -> Iterator[str]:
        """Generación de texto en streaming."""
        config = self._build_gen_config(temperature, max_tokens, thinking_budget)

        try:
            response = self.client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=config.model_copy(update={"system_instruction": system_instruction}) if system_instruction else config
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"[ERROR] Chat stream falló: {e}")
            yield f"\n[Error genernado respuesta: {str(e)}]"

    def generate_audio(self, text: str, voice_name: str = "Kore", model: str = "gemini-2.5-flash-preview-tts") -> bytes:
        """
        Genera audio usando las capacidades multimodales de Gemini 2.5 Flash.
        """
        try:
            # Prompt específico para controlar la generación de audio
            prompt = f"Please read the following text clearly and professionally: {text}"
            
            response = self.client.models.generate_content(
                model=model,
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
            
            # Extraer bytes de audio del primer candidato
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("audio"):
                        return part.inline_data.data
            
            raise ValueError("El modelo no devolvió datos de audio.")

        except Exception as e:
            print(f"[ERROR] TTS falló: {e}")
            raise

    def _build_gen_config(self, temp, max_tokens, thinking_budget) -> types.GenerateContentConfig:
        """Helper para construir la configuración, manejando thinking_budget solo si aplica."""
        
        # Configuración base
        conf = types.GenerateContentConfig(
            temperature=temp,
            max_output_tokens=max_tokens
        )

        # Thinking budget (solo para modelos 2.5 flash/pro que lo soporten)
        # Nota: Aquí asumimos que si el usuario lo envía, el modelo lo soporta. 
        # O podríamos filtrar por nombre de modelo si fuera estricto.
        if thinking_budget is not None and thinking_budget > 0:
            conf.thinking_config = types.ThinkingConfig(thinking_budget=thinking_budget)
        
        return conf

# Instancia singleton para usar en toda la app
google_service = GoogleService()