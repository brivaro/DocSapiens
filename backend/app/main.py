from contextlib import asynccontextmanager
import logging
import warnings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import documents, chat, history, settings as api_settings
from app.db.session import engine, Base, SessionLocal
from app.db import crud
from app.settings.config import settings
from backend.app.api.v1 import generation

Base.metadata.create_all(bind=engine)

warnings.filterwarnings("ignore", category=UserWarning)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info(f"[INFO] Iniciando {settings.PROJECT_NAME}...")
    
    with SessionLocal() as db:
        crud.initialize_rag_config(db)

        # Opcional: Lanzar un sync al inicio para asegurar que todo cuadra
        # (Descomentar si se desea consistencia estricta al reiniciar)
        # from services.document_service import document_service
        # document_service.sync_active_collection()
    yield
    logging.info("[INFO] Aplicación apagada.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documentos"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(generation.router, prefix="/api/v1/embeddings", tags=["AI Voice"]) 
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])
app.include_router(api_settings.router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/")
def read_root():
    return {"message": "Welcome to DocSapiens API!"}