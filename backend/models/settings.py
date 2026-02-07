from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal

# Dimensiones soportadas por gemini-embedding-001 usando MRL
SUPPORTED_DIMENSIONS = [128, 256, 512, 768, 1536, 2048, 3072]

class RagConfigBase(BaseModel):
    embedding_model: str = Field("gemini-embedding-001", description="Modelo de Google para embeddings")
    embedding_dimension: int = Field(768, description="Dimensión del vector (MRL)")

    @field_validator('embedding_dimension')
    def validate_dimension(cls, v):
        if v not in SUPPORTED_DIMENSIONS:
            raise ValueError(f"Dimensión no soportada. Opciones válidas: {SUPPORTED_DIMENSIONS}")
        return v

class RagConfigCreate(RagConfigBase):
    pass

class RagConfigUpdate(BaseModel):
    embedding_dimension: int

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