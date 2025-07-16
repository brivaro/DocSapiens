from datetime import datetime
from backend.db.models import Document
from fastapi import HTTPException, BackgroundTasks
from typing import List
import uuid
from backend.db import crud
from sqlalchemy.orm import Session
from backend.db.session import SessionLocal
from backend.models.document import DocumentCreate, DocumentResponse, DocumentChunk
from backend.services.embedding_service import embedding_service
from backend.processing.extractor import _extract_text_from_content
from backend.processing.splitter import _split_text
from backend.vectorstore.qdrant import upsert_vectors, get_chunks_by_document_id, delete_by_document_id

class DocumentService:
    def create_document(self, doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session) -> Document:
        """
        Crea el registro del documento en la DB y lanza la tarea de procesamiento pesado
        en segundo plano. Devuelve inmediatamente.
        """
        # Comprobar si es una actualización o una creación nueva
        db_doc = self.crud.get_document_by_filename(db, doc.filename)

        if db_doc:
            # --- RUTA DE ACTUALIZACIÓN ---
            print(f"Documento '{doc.filename}' ya existe. Preparando para actualizar en segundo plano.")
            # Actualizamos los metadatos básicos y ponemos el estado en 'pending'
            db_doc.content = doc.content
            db_doc.size = len(doc.content)
            db_doc.tags = doc.tags
            db_doc.content_type = doc.content_type
            db_doc.uploaded_at = datetime.utcnow()
            db_doc.split_by = doc.split_by
            db_doc.status = "pending" # Listo para ser procesado
            db.commit()
            db.refresh(db_doc)
        else:
            # --- RUTA DE CREACIÓN ---
            print(f"Creando nuevo registro para el documento '{doc.filename}'.")
            # Creamos el documento con estado 'pending'
            db_doc = self.crud.create_document(db, doc)
            db_doc.status = "pending"
            db.commit()
            db.refresh(db_doc)

        # Añadir la tarea de procesamiento pesado al fondo
        background_tasks.add_task(self._process_document_task, str(db_doc.id), doc.dict())
        
        return db_doc
    
    def delete_document(self, doc_id: str):
        # Eliminar de la base de datos principal
        with self.db_session() as db:
            deleted_from_db = self.crud.delete_document(db, doc_id)
            if deleted_from_db:
                print(f"Documento {doc_id} eliminado de PostgreSQL.")
            else:
                print(f"ADVERTENCIA: Documento {doc_id} no encontrado en PostgreSQL.")

        # Eliminar de la base de datos de vectores
        try:
            delete_by_document_id(doc_id)
            print(f"Documento {doc_id} y sus chunks eliminados de Qdrant.")
        except Exception as e:
            # Si Qdrant falla, al menos lo registramos. El documento ya no estará en la UI.
            print(f"Error eliminando documento {doc_id} de Qdrant: {e}")

    def list_documents(self) -> List[DocumentResponse]:
        """
        Lista los documentos directamente desde la base de datos principal (PostgreSQL),
        que ahora es la única fuente de verdad para el estado y los metadatos.
        """
        with SessionLocal() as db:
            db_documents = crud.list_documents(db)
            response_list = []
            for db_doc in db_documents:
                response_list.append(
                    DocumentResponse(
                        id=str(db_doc.id),
                        filename=db_doc.filename,
                        content_type=db_doc.content_type,
                        size=db_doc.size,
                        uploaded_at=db_doc.uploaded_at.isoformat() if db_doc.uploaded_at else None,
                        status=db_doc.status, # <- Leemos directamente de la DB (default es pending)
                        tags=db_doc.tags or [] # Usamos los tags de la DB
                    )
                )
        return response_list

    def get_document_chunks(self, doc_id: str) -> List[DocumentChunk]:
        return get_chunks_by_document_id(doc_id)
    
    def _process_document_task(self, doc_id: str, doc_create_dict: dict):
        """
        Esta es la tarea que se ejecuta en segundo plano.
        NOTA: Pasamos un dict en lugar del objeto Pydantic porque es más seguro
        para la serialización en tareas de fondo.
        """
        doc = DocumentCreate(**doc_create_dict)
        
        # Usamos una nueva sesión de DB para el hilo de la tarea
        with self.db_session() as db:
            try:
                print(f"[TASK] Iniciando procesamiento para el documento {doc_id}")
                # Actualiza el estado a 'processing'
                db_doc = db.query(Document).filter(Document.id == doc_id).first()
                if not db_doc:
                    print(f"[TASK ERROR] Documento {doc_id} no encontrado en la DB.")
                    return

                db_doc.status = "processing"
                db.commit()

                # 1. Extraer texto (ya no necesita `self`)
                text = _extract_text_from_content(doc.content, doc.content_type, doc.filename)
                if text:
                    db_doc.text_content = text
                    db.commit()

                # 2. Dividir en chunks
                chunks = _split_text(text, doc_id, doc)
                
                # 3. Generar embeddings y subirlos a Qdrant
                vectors = []
                for chunk in chunks:
                    if chunk["text"] and chunk["text"].strip():
                        embeddings_list = embedding_service.embed([chunk["text"]])
                        if not embeddings_list: continue
                        embedding = embeddings_list[0]
                        vectors.append({
                            "id": str(uuid.uuid4()),
                            "embedding": embedding,
                            "metadata": {
                                "document_id": doc_id, 
                                "chunk_id": chunk["chunk_id"],
                                "filename": doc.filename, 
                                "content_type": doc.content_type,
                                "start": chunk["start"], 
                                "end": chunk["end"], 
                                "text": chunk["text"],
                                "tags": doc.tags or [] 
                            }
                        })

                if vectors:
                    print(f"[TASK] Subiendo {len(vectors)} chunks a Qdrant para el documento {doc_id}.")
                    # Si el documento ya existe (actualización), primero borramos los chunks viejos
                    delete_by_document_id(doc_id)
                    upsert_vectors(vectors)

                # 4. Actualizar el estado final a 'processed'
                db_doc.status = "processed"
                db.commit()
                print(f"[TASK] Documento {doc_id} procesado exitosamente.")

            except Exception as e:
                print(f"ERROR CRÍTICO durante el procesamiento en segundo plano del doc {doc_id}: {e}")
                if 'db' in locals() and db.is_active:
                    db_doc = db.query(Document).filter(Document.id == doc_id).first()
                    if db_doc:
                        db_doc.status = "failed"
                        db.commit()

    @staticmethod
    def db_session():
        return SessionLocal()

    @property
    def crud(self):
        return crud

document_service = DocumentService()