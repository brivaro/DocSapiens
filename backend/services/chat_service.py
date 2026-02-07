from typing import List
from backend.llm_providers import llm_manager
from backend.models.chat import ChatRequest, ChatResponse
from fastapi import HTTPException
from backend.vectorstore.retriever import retrieve_chunks
class ChatService:
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
            
            # 1. Obtenemos el proveedor adecuado para el modelo solicitado
            provider = llm_manager.get_provider(request.model)
            
            # 2. Llamamos al método de ese proveedor, pasando la petición completa
            answer = provider.generate_chat_completion(
                context=context,
                question=request.question,
                model=request.model,
                # Pasamos todos los parámetros para que el proveedor los use
                system_instruction=request.system_instruction,
                temperature=request.temperature,
                max_output_tokens=request.max_output_tokens,
                thinking_budget=request.thinking_budget,
                top_k=request.top_k
            )
            
            return ChatResponse(answer=answer, chunks=chunks)
        except ValueError as ve:
             # Captura errores de selección de proveedor
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

chat_service = ChatService()