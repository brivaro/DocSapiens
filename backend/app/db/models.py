from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Column, String, DateTime, Boolean, LargeBinary, Integer, Text
from datetime import datetime
import uuid
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    
    # Hash para detectar duplicados de contenido exacto
    file_hash = Column(String, index=True, nullable=True)
    
    # Contenido binario original (para poder re-procesar con otros parámetros)
    content = Column(LargeBinary, nullable=False)
    size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Cache de texto extraído (para no usar OCR/Extractores pesados al re-indexar)
    text_content = Column(Text, nullable=True)
    
    # Configuración de Split usada (Persistencia para UI)
    split_mode = Column(String, default="delimiter", nullable=False)
    split_by = Column(String, nullable=True, default="\n\n")
    chunk_size = Column(Integer, nullable=True, default=1000)
    overlap = Column(Integer, nullable=True, default=200)
    
    tags = Column(ARRAY(String), nullable=True)
    
    # Estadísticas y Estado
    chunk_count = Column(Integer, default=0)
    status = Column(String, default="pending", nullable=False) # "pending", "processing", "processed", "failed"
    error_message = Column(Text, nullable=True)

class History(Base):
    __tablename__ = "history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    questions = Column(ARRAY(String), nullable=False)
    answers = Column(ARRAY(String), nullable=False)
    chunks = Column(ARRAY(String), nullable=False)

class RagConfiguration(Base):
    __tablename__ = "rag_configuration"
    id = Column(Integer, primary_key=True, index=True)
    embedding_model = Column(String, default="gemini-embedding-001", nullable=False)
    embedding_dimension = Column(Integer, default=768, nullable=False)
    
    # Persistencia del tipo de tarea
    embedding_task_type = Column(String, default="RETRIEVAL_DOCUMENT", nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)