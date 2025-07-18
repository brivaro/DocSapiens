from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.v1 import apikeys, documents, chat, embeddings
from backend.db.session import engine, Base
from backend.vectorstore.qdrant import ensure_collection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código que se ejecuta ANTES de que la aplicación empiece a aceptar peticiones
    print("[INFO] Iniciando aplicación y asegurando la colección de Qdrant...")
    ensure_collection()
    print("[INFO] Colección de Qdrant lista.")
    yield
    print("[INFO] Aplicación apagada.")


app = FastAPI(
    title="DocSapiens RAG API",
    lifespan=lifespan # Asigna el manejador de ciclo de vida
)

# Orígenes permitidos (frontend de React)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)

# Crear tablas automáticamente al iniciar
Base.metadata.create_all(bind=engine)

# Routers principales
app.include_router(apikeys.router, prefix="/api/v1/apikeys", tags=["API Keys"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documentos"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(embeddings.router, prefix="/api/v1/embeddings", tags=["Embeddings"]) 

@app.get("/")
def read_root():
    return {"message": "Welcome to DocSapiens API"}