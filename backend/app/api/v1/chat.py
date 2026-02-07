from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        return chat_service.chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
def chat_stream_endpoint(request: ChatRequest):
    """
    Endpoint de chat con streaming vía Server-Sent Events (SSE).
    """
    return StreamingResponse(
        chat_service.stream_chat(request),
        media_type="text/event-stream"
    )