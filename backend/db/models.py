from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Column, String, DateTime, Boolean, LargeBinary, Integer, Text
from datetime import datetime
import uuid
from backend.db.session import Base

class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime, nullable=True) 

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    content = Column(LargeBinary, nullable=False) # TODO: Lo mantendremos por ahora, pasarlo a MINI IO
    size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    text_content = Column(Text, nullable=True)
    split_by = Column(String, nullable=True, default="\n\n") 
    tags = Column(ARRAY(String), nullable=True)
    status = Column(String, default="pending", nullable=False) # "pending", "processing", "processed", "failed"

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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)