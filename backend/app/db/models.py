from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Column, String, DateTime, Boolean, LargeBinary, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base

class VectorStore(Base):
    __tablename__ = "vector_stores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False, index=True) # Ej: "finanzas_2024"
    description = Column(Text, nullable=True)
    
    # Configuración específica de esta colección
    embedding_dimension = Column(Integer, default=768, nullable=False)
    embedding_model = Column(String, default="gemini-embedding-001", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación: Una colección tiene muchos documentos
    documents = relationship("Document", back_populates="vector_store", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    
    # Vinculación a una colección específica
    vector_store_id = Column(UUID(as_uuid=True), ForeignKey("vector_stores.id"), nullable=False)
    vector_store = relationship("VectorStore", back_populates="documents")
    
    file_hash = Column(String, index=True, nullable=True)
    content = Column(LargeBinary, nullable=False)
    size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Cache de texto extraído
    text_content = Column(Text, nullable=True)
    
    # Configuración de Split usada
    split_mode = Column(String, default="delimiter", nullable=False)
    split_by = Column(String, nullable=True, default="\n\n")
    chunk_size = Column(Integer, nullable=True, default=1000)
    overlap = Column(Integer, nullable=True, default=200)
    
    tags = Column(ARRAY(String), nullable=True)
    
    chunk_count = Column(Integer, default=0)
    status = Column(String, default="pending", nullable=False)
    error_message = Column(Text, nullable=True)

class History(Base):
    __tablename__ = "history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    questions = Column(ARRAY(String), nullable=False)
    answers = Column(ARRAY(String), nullable=False)
    chunks = Column(ARRAY(String), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)