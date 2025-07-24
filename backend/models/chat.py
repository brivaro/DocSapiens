from typing import Optional, List
from pydantic import BaseModel, Field

# --- Modelos Pydantic para la API ---

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="La pregunta del usuario.")
    k: int = Field(5, gt=0, le=30, description="Número de chunks a recuperar.")
    document_ids: Optional[List[str]] = Field(None, description="Lista opcional de IDs de documentos para filtrar la búsqueda.")
    tags: Optional[List[str]] = Field(None, description="Lista opcional de etiquetas para filtrar la búsqueda.")
    model: Optional[str] = Field("gemini-2.0-flash", description="Modelo generativo a usar.") # gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash-lite	
    system_instruction: Optional[str] = Field(None, description="Instrucción del sistema para el modelo.")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    top_k: Optional[int] = Field(None, gt=0)
    max_output_tokens: Optional[int] = Field(None, gt=0, description="Máximo de tokens en la respuesta.")
    thinking_budget: Optional[int] = Field(None, ge=0, description="Presupuesto para la función de 'pensamiento' del modelo. 0 la deshabilita.")

class Chunk(BaseModel):
    chunk_id: int = Field(..., description="ID del chunk de texto recuperado.")
    document_id: str = Field(..., description="ID del documento al que pertenece el chunk.")
    chunk_tags: Optional[List[str]] = Field(None, description="Lista de etiquetas asociadas al chunk.")
    text: str = Field(..., description="Texto del chunk.")
    start: int = Field(None, description="Posición de inicio del chunk en el documento.")
    end: int = Field(None, description="Posición de fin del chunk en el documento.")
    score: float = Field(None, description="Puntuación de relevancia del chunk.")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Respuesta generada por el modelo.")
    chunks: List[Chunk] = Field(..., description="Lista de chunks de texto recuperados relacionados con la pregunta.")

# Modelo para CREAR un historial (lo que envía el frontend)
class ChatHistoryCreate(BaseModel):
    question: str = Field(..., description="Pregunta realizada por el usuario.")
    answer: str = Field(..., description="Respuesta generada por el modelo.")
    chunks: List[Chunk] = Field(..., description="Lista de chunks recuperados.")

# Modelo para DEVOLVER un historial (lo que envía el backend)
class ChatHistoryItem(BaseModel):
    id: str = Field(..., description="ID único de la interacción.")
    questions: List[str] = Field(..., description="Array de preguntas realizadas por el usuario.")
    answers: List[str] = Field(..., description="Array de respuestas generadas por el modelo.")   
    chunks: List[List[Chunk]] = Field(..., description="Lista de chunks de texto recuperados relacionados con la pregunta.")

class ChatHistoryResponse(BaseModel):
    history: List[ChatHistoryItem]