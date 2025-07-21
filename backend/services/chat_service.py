from typing import List
from backend.models.chat import ChatRequest, ChatResponse, Chunk
from fastapi import HTTPException
from backend.vectorstore.retriever import retrieve_chunks
from backend.llm_providers.factory import get_llm_provider
from backend.llm_providers.base import LLMProvider

class ChatService:
    def __init__(self, llm_provider: LLMProvider):
        self.llm_provider = llm_provider

    def chat(self, request: ChatRequest) -> ChatResponse:
        try:
            chunks = retrieve_chunks(
                query=request.question, 
                top_k=request.k, 
                document_ids=request.document_ids,
                tags=request.tags
            )
            if not chunks: # evitamos llamadas innecesarias al LLM si no hay resultados
                print("[INFO] No se encontraron chunks relevantes para la consulta.")
                return ChatResponse(answer="No se encontraron resultados relevantes.", chunks=[])
            
            context = "\n".join([chunk.text for chunk in chunks if chunk.text])
            
            answer = self.llm_provider.generate_chat_completion(
                # Contexto
                context=context,
                question=request.question,
                model=request.model,
                # Configurations for the chat generation
                system_instruction=request.system_instruction,
                temperature=request.temperature,
                max_output_tokens=request.max_output_tokens,
                thinking_budget=request.thinking_budget,
                top_k=request.top_k
            )
            
            return ChatResponse(answer=answer, chunks=chunks)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

chat_service = ChatService(llm_provider=get_llm_provider())