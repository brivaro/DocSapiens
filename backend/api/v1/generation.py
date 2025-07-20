from fastapi import APIRouter, HTTPException, Response
from backend.services.generation_service import generation_service
from backend.models.generation import (
    ImageGenerationRequest, 
    ImageGenerationResponse, 
    TextToSpeechRequest,
    TextToSpeechResponse
)

router = APIRouter()

@router.post("/image", response_model=ImageGenerationResponse)
def generate_image_endpoint(request: ImageGenerationRequest):
    """Genera una imagen y texto a partir de un prompt."""
    try:
        return generation_service.generate_image(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech", response_model=TextToSpeechResponse)
def text_to_speech_endpoint(request: TextToSpeechRequest):
    """Convierte texto a voz y devuelve el archivo de audio."""
    try:
        return generation_service.text_to_speech(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))