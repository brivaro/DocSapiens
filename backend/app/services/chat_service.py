import logging
import json
from typing import Iterator
from app.models.chat import ChatRequest
from app.vectorstore.retriever import retrieve_chunks
from app.services.google_service import google_service

class ChatService:
    def stream_chat(self, request: ChatRequest) -> Iterator[str]:
        try:
            if not request.vector_store_id:
                yield "event: error\ndata: \"Debes seleccionar un Vector Store\"\n\n"
                return

            # Determinar el tipo de búsqueda (Normal vs Código)
            search_task = "CODE_RETRIEVAL_QUERY" if request.is_code_query else "RETRIEVAL_QUERY"

            chunks = retrieve_chunks(
                query=request.question, 
                vector_store_id=request.vector_store_id,
                top_k=request.k, 
                document_ids=request.document_ids,
                tags=request.tags,
                search_task_type=search_task
            )

            # Enviar fuentes
            chunks_data = [chunk.model_dump() for chunk in chunks]
            yield f"event: sources\ndata: {json.dumps(chunks_data)}\n\n"

            if not chunks:
                yield "event: token\ndata: \"No encontré información relevante.\"\n\n"
                return

            # Construir prompt
            context_text = "\n\n".join([f"--- Fragmento ---\n{chunk.text}" for chunk in chunks])
            system_inst = request.system_instruction or "Eres un asistente experto."
            final_prompt = f"Contexto:\n{context_text}\n\nPregunta: {request.question}"

            stream = google_service.chat_stream_generator(
                model=request.model,
                prompt=final_prompt,
                system_instruction=system_inst,
                temperature=request.temperature,
                max_tokens=request.max_output_tokens,
                thinking_budget=request.thinking_budget
            )

            for token in stream:
                yield f"event: token\ndata: {json.dumps(token)}\n\n"

        except Exception as e:
            logging.error(f"[Stream Error] {e}")
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"

chat_service = ChatService()