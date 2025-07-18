import os
from backend.models.chat import ChatRequest, ChatResponse
from fastapi import APIRouter, Depends, HTTPException
from backend.services.chat_service import ChatService

# --- Dependencia para el Servicio de Chat ---

def get_chat_service() -> ChatService:
    """
    Crea y retorna una instancia de ChatService.
    Esta función de dependencia será usada por FastAPI para inyectar el servicio.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL")
    if not gemini_api_key:
        raise HTTPException(
            status_code=500, 
            detail="La variable de entorno GEMINI_API_KEY no está configurada."
        )
    try:
        return ChatService(api_key=gemini_api_key, model=gemini_model)
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
        document_ids=request.document_ids,
        model=request.model
    )
    return result