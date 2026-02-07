from typing import List
from pydantic_settings import BaseSettings
from pydantic import computed_field

class Settings(BaseSettings):
    # --- App ---
    PROJECT_NAME: str
    SECRET_KEY: str
    ALLOWED_ORIGINS: List[str]

    # --- Google Gemini ---
    GOOGLE_API_KEY: str
    # Modelos por defecto
    DEFAULT_CHAT_MODEL: str
    DEFAULT_EMBEDDING_MODEL: str
    DEFAULT_EMBEDDING_DIM: int
    DEFAULT_TTS_MODEL: str

    # --- Database (Postgres) ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    
    DATABASE_URL: str = None

    @computed_field
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --- Qdrant ---
    QDRANT_HOST: str
    QDRANT_PORT: int
    QDRANT_COLLECTION: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()