import logging
from fastapi import HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.vectorstore.retriever import retrieve_chunks
from app.services.google_service import google_service

class ChatService:
    def chat(self, request: ChatRequest) -> ChatResponse:
        try:
            # 1. Recuperar contexto (RAG)
            chunks = retrieve_chunks(
                query=request.question, 
                top_k=request.k, 
                document_ids=request.document_ids,
                tags=request.tags
            )
            
            if not chunks:
                logging.info("[INFO] No se encontraron chunks relevantes.")
                return ChatResponse(answer="No encontré información relevante en los documentos para responder a tu pregunta.", chunks=[])
            
            # 2. Construir Prompt
            context_text = "\n\n".join([f"--- Fragmento ---\n{chunk.text}" for chunk in chunks])
            
            system_instruction = request.system_instruction or (
                "Eres un asistente experto en análisis documental 'DocSapiens'. "
                "Responde a la pregunta basándote EXCLUSIVAMENTE en el contexto proporcionado. "
                "Si la información no está en el contexto, dilo. Cita el contexto si es necesario."
            )
            
            final_prompt = (
                f"Contexto:\n{context_text}\n\n"
                f"Pregunta del usuario: {request.question}"
            )

            # 3. Generar respuesta con Google Service
            # Usamos el modelo que viene en la request o un default
            model_to_use = request.model or "gemini-2.0-flash"
            
            answer = google_service.chat_completion(
                model=model_to_use,
                prompt=final_prompt,
                system_instruction=system_instruction,
                temperature=request.temperature,
                max_tokens=request.max_output_tokens,
                thinking_budget=request.thinking_budget
            )
            
            return ChatResponse(answer=answer, chunks=chunks)

        except Exception as e:
            logging.info(f"[ERROR] Chat Service Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

chat_service = ChatService()