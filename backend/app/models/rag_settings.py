from pydantic import BaseModel, Field, field_validator
from typing import Literal

# Dimensiones soportadas
SUPPORTED_DIMENSIONS = [128, 256, 512, 768, 1536, 2048, 3072]

# Tipos de tarea soportados por Gemini
TaskTypeEnum = Literal[
    "RETRIEVAL_QUERY",      # Búsqueda estándar
    "RETRIEVAL_DOCUMENT",   # (Raro seleccionarlo como query, pero posible)
    "SEMANTIC_SIMILARITY",  # Simetría
    "CLASSIFICATION",       # Simetría
    "CLUSTERING",           # Simetría
    "QUESTION_ANSWERING",   # Asimétrico (Requiere doc=RETRIEVAL_DOCUMENT)
    "FACT_VERIFICATION",    # Asimétrico (Requiere doc=RETRIEVAL_DOCUMENT)
    "CODE_RETRIEVAL_QUERY"  # Asimétrico (Requiere doc=RETRIEVAL_DOCUMENT)
]

class RagConfigBase(BaseModel):
    embedding_model: str = Field("gemini-embedding-001", description="Modelo de Google")
    embedding_dimension: int = Field(768, description="Dimensión del vector")
    
    embedding_task_type: TaskTypeEnum = Field(
        "RETRIEVAL_QUERY", 
        description="El tipo de tarea principal para la que se usará el sistema."
    )

    @field_validator('embedding_dimension')
    def validate_dimension(cls, v):
        if v not in SUPPORTED_DIMENSIONS:
            raise ValueError(f"Dimensión no soportada. Opciones válidas: {SUPPORTED_DIMENSIONS}")
        return v

class RagConfigUpdate(BaseModel):
    embedding_dimension: int
    embedding_task_type: TaskTypeEnum

    @field_validator('embedding_dimension')
    def validate_dimension(cls, v):
        if v not in SUPPORTED_DIMENSIONS:
            raise ValueError(f"Dimensión no soportada. Opciones válidas: {SUPPORTED_DIMENSIONS}")
        return v

class RagConfigResponse(RagConfigBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True