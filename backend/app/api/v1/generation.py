from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import base64
from app.models.generation import TextToSpeechRequest, TextToSpeechResponse
from app.services.google_service import google_service

router = APIRouter()

@router.post("/speech", response_model=TextToSpeechResponse)
def generate_speech(request: TextToSpeechRequest):
    """
    Genera audio a partir de texto usando el modelo Gemini Multimodal.
    Devuelve el audio en base64 para reproducción inmediata en el frontend.
    """
    try:
        # Usamos el servicio de Google que ya configuramos
        audio_bytes = google_service.generate_audio(
            text=request.text,
            voice_name=request.voice_name,
            model=request.model
        )
        
        # Convertimos a base64 para enviarlo fácil al frontend JSON
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return TextToSpeechResponse(
            audio_base64=audio_base64,
            filename=f"speech_{len(request.text)}.wav"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))