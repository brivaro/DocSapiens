from backend.models.chat import ChatRequest, ChatResponse
from fastapi import APIRouter, HTTPException
from backend.services.chat_service import chat_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest): # No se necesita Depends
    try:
        return chat_service.chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))