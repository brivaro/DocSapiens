from pydantic import BaseModel, Field
from typing import Optional

class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="El texto descriptivo para generar la imagen.")
    model: Optional[str] = Field("gemini-2.0-flash-preview-image-generation", description="Modelo de generación de imágenes a usar.")

class ImageGenerationResponse(BaseModel):
    text: str = Field(..., description="El texto generado por el modelo junto a la imagen.")
    image_base64: str = Field(..., description="La imagen generada, codificada en Base64.")

class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, description="El texto a convertir en voz.")
    voice_name: str = Field("Kore", description="El nombre de la voz predefinida a usar. Ej: 'Kore', 'Puck'.")
    model: Optional[str] = Field("gemini-2.5-flash-preview-tts", description="Modelo de TTS a usar.")

class TextToSpeechResponse(BaseModel):
    audio_base64: str = Field(..., description="El archivo de audio generado, codificado en Base64.")
    filename: str = Field(..., description="El nombre del archivo de audio guardado.")