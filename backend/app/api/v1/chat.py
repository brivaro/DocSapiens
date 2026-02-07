from app.models.chat import ChatRequest, ChatResponse
from fastapi import APIRouter, HTTPException
from app.services.chat_service import chat_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        return chat_service.chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))