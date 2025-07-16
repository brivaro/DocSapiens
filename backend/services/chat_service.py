import os
import google.generativeai as genai
from fastapi import HTTPException
from backend.vectorstore.retriever import retrieve_chunks

class ChatService:
    """
    Servicio para manejar la lógica del chat con el modelo generativo.
    """
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("La API key de Gemini no puede estar vacía.")
        # Configura la API key para esta instancia del servicio.
        genai.configure(api_key=api_key)
        self.default_model = "gemini-2.0-flash"

    def chat(self, question: str, top_k: int = 5, document_id: str = None, model: str = None) -> dict:
        """
        Genera una respuesta a una pregunta usando RAG (Retrieval-Augmented Generation).
        """
        model_to_use = model or self.default_model

        # Recuperar chunks relevantes
        chunks = retrieve_chunks(question, top_k=top_k, document_id=document_id)
        context = "\n".join([chunk["text"] for chunk in chunks if chunk["text"]])
        
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
            raise HTTPException(status_code=500, detail=f"Error al generar respuesta del modelo de IA: {e}")

        return {
            "answer": answer,
            "chunks": chunks
        }