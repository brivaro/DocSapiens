import os
from typing import List
from backend.models.chat import ChatResponse, Chunk
import google.genai as genai
from fastapi import HTTPException
from backend.vectorstore.retriever import retrieve_chunks

class ChatService:
    """
    Servicio para manejar la lógica del chat con el modelo generativo.
    """
    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise ValueError("La API key de Gemini no puede estar vacía.")
        # Configura la API key para esta instancia del servicio.
        genai.configure(api_key=api_key)
        self.default_model = model

    def chat(self, question: str, top_k: int = 5, document_ids: List[str] = None, model: str = None) -> ChatResponse:
        """
        Genera una respuesta a una pregunta usando RAG (Retrieval-Augmented Generation).
        """
        model_to_use = model or self.default_model

        print(f"[INFO] Recuperando chunks para la pregunta: {question} con top_k={top_k} y document_ids={document_ids}")
        chunks = retrieve_chunks(question, top_k=top_k, document_id=document_ids)
        context = "\n".join([chunk["text"] for chunk in chunks if chunk["text"]])
        
        print(f"[INFO] Contexto recuperado, preparando prompt para el modelo: {model_to_use}")
        prompt = (
            "Usa el siguiente contexto para responder la pregunta. "
            "Responde de forma clara y profesional. Si la respuesta no está en el contexto, "
            "indícalo explícitamente.\n\n"
            f"Contexto:\n{context}\n\n"
            f"Pregunta: {question}"
        )

        try:
            model_instance = genai.GenerativeModel(model_to_use)
            response = model_instance.generate_content(prompt)
            answer = response.text
        except Exception as e:
            print(f"[ERROR] Error al generar respuesta del modelo de IA: {e}")
            raise HTTPException(status_code=500, detail=f"Error al generar respuesta del modelo de IA: {e}")
        
        response = ChatResponse(
            answer=answer,
            chunks=[Chunk(**chunk) for chunk in chunks]
        )
        print(f"[INFO] Respuesta generada: {response.answer}")
        
        return response