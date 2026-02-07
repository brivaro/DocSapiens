from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    # --- App ---
    PROJECT_NAME: str = "DocSapiens RAG"
    SECRET_KEY: str
    API_V1_STR: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # --- Google Gemini ---
    GOOGLE_API_KEY: str
    # Modelos por defecto (Configurables desde .env)
    DEFAULT_CHAT_MODEL: str = "gemini-2.0-flash" 
    DEFAULT_EMBEDDING_MODEL: str = "gemini-embedding-001"
    DEFAULT_EMBEDDING_DIM: int = 768
    DEFAULT_TTS_MODEL: str = "gemini-2.0-flash-lite-preview-02-05" # O el modelo TTS que prefieras

    # --- Database (Postgres) ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    
    DATABASE_URL: str = None

    @computed_field
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --- Qdrant ---
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "docsapiens"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()