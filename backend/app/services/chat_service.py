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

            if request.is_code_query:
                search_task = "CODE_RETRIEVAL_QUERY"
            else:
                search_task = request.task_type or "RETRIEVAL_QUERY"

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
                thinking_budget=request.thinking_budget,
                thinking_level=request.thinking_level,
                top_p=request.top_p
            )

            for item in stream:
                if item["type"] == "error":
                     yield f"event: error\ndata: {json.dumps(item['content'])}\n\n"
                elif item["type"] == "thought":
                     # NUEVO EVENTO PARA PENSAMIENTOS
                     yield f"event: thought\ndata: {json.dumps(item['content'])}\n\n"
                else:
                     # EVENTO ESTÁNDAR DE RESPUESTA
                     yield f"event: token\ndata: {json.dumps(item['content'])}\n\n"

        except Exception as e:
            logging.error(f"[Stream Error] {e}")
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"

chat_service = ChatService()