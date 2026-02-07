import logging
import json
from fastapi import HTTPException
from typing import Iterator
from app.models.chat import ChatRequest, ChatResponse
from app.vectorstore.retriever import retrieve_chunks
from app.services.google_service import google_service

class ChatService:
    def chat(self, request: ChatRequest) -> ChatResponse:
        """Endpoint síncrono (sin streaming)"""
        try:
            chunks = retrieve_chunks(query=request.question, top_k=request.k, document_ids=request.document_ids, tags=request.tags)
            
            if not chunks:
                return ChatResponse(answer="No encontré información relevante en los documentos.", chunks=[])
            
            context_text = "\n\n".join([f"--- Fragmento ---\n{chunk.text}" for chunk in chunks])
            system_instruction = request.system_instruction or (
                "Eres un asistente experto en análisis documental 'DocSapiens'. "
                "Responde a la pregunta basándote EXCLUSIVAMENTE en el contexto proporcionado. "
                "Si la información no está en el contexto, dilo. Cita el contexto si es necesario."
            )
            final_prompt = f"Contexto:\n{context_text}\n\nPregunta: {request.question}"
            
            answer = google_service.chat_completion(
                model=request.model, 
                prompt=final_prompt, 
                system_instruction=system_instruction,
                temperature=request.temperature, 
                max_tokens=request.max_output_tokens, 
                thinking_budget=request.thinking_budget
            )
            return ChatResponse(answer=answer, chunks=chunks)
        except Exception as e:
            logging.error(f"[Chat Error] {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # --- NUEVO: STREAMING GENERATOR ---
    def stream_chat(self, request: ChatRequest) -> Iterator[str]:
        """
        Generador asíncrono para Server-Sent Events (SSE).
        Emite:
        1. Evento 'sources': JSON con los chunks usados.
        2. Eventos 'token': Fragmentos de texto.
        """
        try:
            # 1. Recuperación RAG (Síncrona)
            chunks = retrieve_chunks(
                query=request.question, 
                top_k=request.k, 
                document_ids=request.document_ids,
                tags=request.tags
            )

            # 2. Enviar evento de fuentes primero
            # Formato SSE: "event: nombre\ndata: contenido\n\n"
            chunks_data = [chunk.model_dump() for chunk in chunks]
            yield f"event: sources\ndata: {json.dumps(chunks_data)}\n\n"

            if not chunks:
                yield "event: token\ndata: No encontré información relevante en los documentos.\n\n"
                return

            # 3. Construir Prompt
            context_text = "\n\n".join([f"--- Fragmento ---\n{chunk.text}" for chunk in chunks])
            
            system_instruction = request.system_instruction or (
                "Eres un asistente experto en análisis documental 'DocSapiens'. "
                "Responde a la pregunta basándote EXCLUSIVAMENTE en el contexto proporcionado. "
                "Si la información no está en el contexto, dilo. Cita el contexto si es necesario."
            )
            
            final_prompt = f"Contexto:\n{context_text}\n\nPregunta: {request.question}"

            # 4. Stream desde Google
            stream = google_service.chat_stream_generator(
                model=request.model,
                prompt=final_prompt,
                system_instruction=system_instruction,
                temperature=request.temperature,
                max_tokens=request.max_output_tokens,
                thinking_budget=request.thinking_budget
            )

            for token in stream:
                sanitized_token = json.dumps(token) 
                yield f"event: token\ndata: {sanitized_token}\n\n"

        except Exception as e:
            logging.error(f"[Stream Error] {e}")
            error_msg = json.dumps(f"Error: {str(e)}")
            yield f"event: error\ndata: {error_msg}\n\n"

chat_service = ChatService()