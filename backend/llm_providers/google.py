import os
import base64
import random
from typing import List, Iterator, Optional, Dict
from backend.models.document import DocumentChunk
import numpy as np
from .base import LLMProvider
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

class GoogleGeminiProvider(LLMProvider):
    """
    Implementación de LLMProvider para los modelos de Google Gemini usando
    el nuevo SDK 'google-genai'.
    """
    def __init__(
            self, chat_model: str = "gemini-2.5-flash", 
            embedding_model: str = "text-embedding-001", 
            image_model: str = "gemini-2.0-flash-preview-image-generation", # ya no esta en la API, no se puede usar
            speech_model: str = "gemini-2.5-flash-preview-tts"):
        try:
            # La nueva API usa un objeto Client centralizado.
            # La API key se tomará automáticamente de la variable de entorno GEMINI_API_KEY.
            self.client = genai.Client()

            #print("\n[INFO] List of models that support generateContent:\n")
            #for m in self.client.models.list():
            #    for action in m.supported_actions:
            #        if action == "generateContent":
            #            print(m.name)

            #print("[INFO] List of models that support embedContent:\n")
            #for m in self.client.models.list():
            #    for action in m.supported_actions:
            #        if action == "embedContent":
            #            print(m.name)

        except Exception as e:
            raise RuntimeError(f"[ERROR] Error al inicializar el cliente de Google GenAI: {e}")

        self._chat_model = chat_model
        self._embedding_model = embedding_model
        self._image_model = image_model
        self._speech_model = speech_model
        
        self._embedding_dimensions = {
            "text-embedding-004": 768, # TODO: se depreca en septiembre octubre
            "gemini-embedding-001": 3072 # Por defecto, la dimensión completa. Admite: 128 a 3072, recomendado: 768, 1536, 3072. Para otras dimensiones, incluidas 768 y 1536, debes normalizar las incorporaciones.
        }

    def get_model_name(self) -> str:
        return self._chat_model

    def get_embedding_model_name(self) -> str:
        return self._embedding_model

    def get_embedding_dimension(self) -> int:
        # Devuelve la dimensión según el modelo seleccionado.
        # Podemos permitir que se sobreescriba con una variable de entorno.
        default_dim = self._embedding_dimensions.get(self._embedding_model, 3072)
        return int(os.getenv("GEMINI_EMBEDDING_DIM", default_dim))
    
    def _embed(self, texts: List[str], output_dim: int = 3072) -> List[List[float]]:
        try:
            result = self.client.models.embed_content(
                model=f"models/{self._embedding_model}",
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=output_dim
                )
            )
            return result.embeddings
        except Exception as e:
            print(f"[ERROR] Error al generar embedding con Google AI: {e}")
            raise RuntimeError(f"Fallo en la generación de embedding: {e}")

    def generate_embeddings(self, texts: List[str], doc_id: str) -> List[List[float]]:
        if not texts:
            print(f"[ERROR] No hay texto para generar embeddings en el documento {doc_id}.")
            return []
            
        output_dim = self.get_embedding_dimension()

        try:
            # TODO: comentado para evitar ahora en las pruebas llamadas a la API
            # embeddings = self._embed(texts, output_dim=output_dim)

            # Simulación de embeddings aleatorios para pruebas
            embeddings = [[random.uniform(-1, 1) for _ in range(output_dim)] for _ in range(len(texts))]

            if doc_id == "[RETRIEVE CHUNKS]":
                print(f"[INFO] Generados {len(embeddings)} embeddings para la consulta de recuperación de chunks.")
            else:
                print(f"[INFO] Generados {len(embeddings)} embeddings para el documento {doc_id}.")
            
            # ¡IMPORTANTE! Normalizar embeddings si no usamos la dimensión completa como recomienda la documentación.
            if self._embedding_model == 'gemini-embedding-001' and output_dim != 3072:
                print(f"[INFO] Normalizando {len(embeddings)} embeddings a dimensión {output_dim}...")
                np_embeddings = np.array(embeddings)
                norms = np.linalg.norm(np_embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1e-9
                normalized_embeddings = np_embeddings / norms
                return normalized_embeddings.tolist()

            return embeddings

        except Exception as e:
            print(f"[ERROR] Error al generar embeddings para el documento {doc_id}: {e}")
            raise RuntimeError(f"[ERROR] Fallo en la generación de embedding de Google: {e}")

    def _prepare_generation_config(self, **kwargs) -> types.GenerateContentConfig:
        """
        Helper para construir la configuración de generación de contenido.
        Permite pasar parámetros como 'temperature', 'top_k', 'max_output_tokens', etc
        """
        config_params = {key: value for key, value in kwargs.items() if value is not None}
        model_name = self.get_model_name()

        # LÓGICA INTELIGENTE: Maneja 'thinking_budget' solo si el modelo lo soporta.
        if 'thinking_budget' in config_params:
            budget = config_params.pop('thinking_budget')
            if '2.5' in model_name: # Comprueba si es un modelo de la serie 2.5
                config_params['thinking_config'] = types.ThinkingConfig(thinking_budget=budget)
            else:
                # Si no es un modelo 2.5, ignora el parámetro en lugar de fallar.
                # El thinkingBudget solo es compatible con Gemini 2.5 Flash, 2.5 Pro y 2.5 Flash-Lite. 
                # Según la instrucción, el modelo podría exceder o no alcanzar el presupuesto de tokens.
                print(f"[WARNING] 'thinking_budget' ignorado. El modelo '{model_name}' no lo soporta.")

        # 3. Creamos el objeto de configuración solo si hay parámetros
        return types.GenerateContentConfig(**config_params) if config_params else None

    def _build_prompt(self, context: str, question: str) -> List[str]:
        # Preparado para multimodalidad: el prompt ahora es una lista
        # a la que en el futuro podríamos añadir objetos Image.
        return [
            "Eres un asistente inteligente capaz de responder preguntas basadas en el contexto proporcionado. "
            "Tu objetivo es proporcionar respuestas precisas y útiles basadas en la información disponible. "
            "Usa el siguiente contexto para responder la pregunta del usuario. Si no tienes suficiente información, "
            "o no has encontrado la respuesta en el contexto, indícalo claramente. No inventes información. "
            "Puedes usar emojis si es apropiado, pero no los uses en exceso. "
            "Responde de forma clara y profesional.\n\n"
            f"Contexto:\n{context}\n\n"
            f"Pregunta: {question}"
        ]

    def generate_chat_completion(self, context: str, question: str, model: str, **kwargs) -> str:
        model_to_use = model or self._chat_model
        config = self._prepare_generation_config(**kwargs)
        prompt = self._build_prompt(context, question)
        try:
            response = self.client.models.generate_content(
                model=f"models/{model_to_use}",
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"[ERROR] Error en la generación de chat de Google: {e}")

    def generate_chat_completion_stream(self, context: str, question: str, model: str, **kwargs) -> Iterator[str]:
        model_to_use = model or self._chat_model
        config = self._prepare_generation_config(**kwargs)
        prompt = self._build_prompt(context, question)
        
        try:
            stream = self.client.models.generate_content_stream(
                model=f"models/{model_to_use}",
                contents=prompt,
                config=config
            )
            for chunk in stream:
                yield chunk.text
        except Exception as e:
            # En un stream, es más difícil propagar un HTTPException,
            # así que registramos el error y devolvemos un mensaje de error.
            print(f"[ERROR] Error en stream de chat de Google: {e}")
            yield f"\n\n[ERROR] al generar la respuesta: {e}"

    def generate_image(self, prompt: str, model: Optional[str] = None) -> Dict[str, any]:
        model_to_use = model or self._image_model
        try:
            response = self.client.models.generate_content(
                model=f"models/{model_to_use}",
                contents=[prompt],
                config=types.GenerateContentConfig(
                  response_modalities=['TEXT', 'IMAGE']
                )
            )
            
            text_response = ""
            image_bytes = None
            
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    text_response += part.text
                elif part.inline_data is not None:
                    image_bytes = part.inline_data.data
            
            return {"text": text_response, "image_bytes": image_bytes}
        except Exception as e:
            raise RuntimeError(f"[ERROR] Error en la generación de imágenes de Google: {e}")
        
    def generate_multimodal_content(self, prompt: List[any], model: Optional[str] = None) -> Dict[str, any]:
        model_to_use = model or self._image_model
        try:
            response = self.client.models.generate_content(
                model=model_to_use, 
                contents=prompt,
                config=types.GenerateContentConfig(
                  response_modalities=['TEXT', 'IMAGE']
                )
            )
            
            text_response = ""
            image_bytes = None
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    text_response += part.text
                elif part.inline_data is not None:
                    image_bytes = part.inline_data.data
            
            return {"text": text_response, "image_bytes": image_bytes}
        except Exception as e:
            raise RuntimeError(f"Error en la generación multimodal de Google: {e}")

    def generate_specialized_image(self, prompt: str, number_of_images: int = 1, aspect_ratio: str = "1:1", model: Optional[str] = None) -> List[bytes]:
        model_to_use = model or self._specialized_image_model
        try:
            # Usamos el método correcto: generate_images
            response = self.client.models.generate_images(
                model=model_to_use,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=number_of_images,
                    aspect_ratio=aspect_ratio
                )
            )
            return [img.image.image_bytes for img in response.generated_images]
        except Exception as e:
            raise RuntimeError(f"Error en la generación de imágenes con Imagen: {e}")

    def generate_speech(self, text: str, voice_name: str, model: Optional[str] = None) -> bytes:
        model_to_use = model or self._speech_model
        voice_name_to_use = voice_name or "Kore" # Kore: Firme, Sadachbia: Lively, Laomedeia: Animada, 	Algieba: Smooth, Charon: Informativo, ...
        try:
            prompt = f"Di esto en una limpia y profesional voz: {text}"
            
            response = self.client.models.generate_content(
               model=f"models/{model_to_use}",
               contents=[prompt],
               config=types.GenerateContentConfig(
                  response_modalities=["AUDIO"],
                  speech_config=types.SpeechConfig(
                     voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                           voice_name=voice_name_to_use,
                        )
                     )
                  ),
               )
            )
            
            return response.candidates[0].content.parts[0].inline_data.data
        except Exception as e:
            raise RuntimeError(f"[ERROR] Error en la generación de voz de Google: {e}")