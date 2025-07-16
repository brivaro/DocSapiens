import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.services.chat_service import ChatService

# --- Modelos Pydantic para la API ---

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="La pregunta del usuario.")
    top_k: int = Field(5, gt=0, le=10, description="Número de chunks a recuperar.")
    document_id: Optional[str] = Field(None, description="ID opcional del documento para filtrar la búsqueda.")
    model: Optional[str] = Field(None, description="Modelo generativo a usar.")

class Chunk(BaseModel):
    """Modelo para representar un chunk de texto recuperado."""
    chunk_id: str = Field(..., description="ID del chunk de texto.")
    document_id: str = Field(..., description="ID del documento al que pertenece el chunk.")
    text: str = Field(..., description="Texto del chunk.")
    start: Optional[int] = Field(None, description="Posición de inicio del chunk en el documento.")
    end: Optional[int] = Field(None, description="Posición de fin del chunk en el documento.")
    score: Optional[float] = Field(None, description="Puntuación de relevancia del chunk.")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Respuesta generada por el modelo.")
    chunks: List[Chunk] = Field(..., description="Lista de chunks de texto recuperados relacionados con la pregunta.")

# --- Dependencia para el Servicio de Chat ---

def get_chat_service() -> ChatService:
    """
    Crea y retorna una instancia de ChatService.
    Esta función de dependencia será usada por FastAPI para inyectar el servicio.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(
            status_code=500, 
            detail="La variable de entorno GEMINI_API_KEY no está configurada."
        )
    try:
        return ChatService(api_key=gemini_api_key)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    result = chat_service.chat(
        question=request.question,
        top_k=request.top_k,
        document_id=request.document_id,
        model=request.model
    )
    return result