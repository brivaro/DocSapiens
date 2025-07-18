from datetime import datetime
from backend.db.models import Document
from fastapi import BackgroundTasks
from typing import List
import uuid
from backend.db import crud
from sqlalchemy.orm import Session
from backend.db.session import SessionLocal
from backend.models.document import DocumentCreate, DocumentResponse, DocumentChunk
from backend.services.embedding_service import embedding_service
from backend.processing.extractor import _extract_text_from_content
from backend.processing.splitter import _split_text
from backend.vectorstore.qdrant import upsert_vectors, get_chunks_by_document_id, delete_chunks_by_document_id

class DocumentService:
    def create_document(self, doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session) -> Document:
        """
        Crea el registro del documento en la DB y lanza la tarea de procesamiento pesado
        en segundo plano. Devuelve inmediatamente.
        """
        db_doc = self.crud.get_document_by_filename(db, doc.filename)

        if db_doc:
            print(f"[INFO] Documento '{doc.filename}' ya existe. Preparando para actualizar en segundo plano.")
            self.crud.update_document(db, db_doc, doc)
            delete_chunks_by_document_id(str(db_doc.id)) # Limpiar chunks antiguos
        else:
            print(f"[INFO] Creando nuevo registro para el documento '{doc.filename}'.")
            db_doc = self.crud.create_document(db, doc)

        background_tasks.add_task(self._process_document_task, str(db_doc.id), doc.dict())
        
        return db_doc
    
    def delete_document(self, doc_id: str) -> None:
        # Eliminar de la base de datos principal (PostgreSQL)
        with self.db_session() as db:
            deleted_from_db = self.crud.delete_document(db, doc_id)
            if deleted_from_db:
                print(f"[INFO] Documento {doc_id} eliminado de PostgreSQL.")
            else:
                print(f"[WARNING]: Documento {doc_id} no encontrado en PostgreSQL.")

        # Eliminar de la base de datos de vectores (Qdrant)
        try:
            delete_chunks_by_document_id(doc_id)
            print(f"[INFO] Documento {doc_id} y sus chunks eliminados de Qdrant.")
        except Exception as e:
            print(f"[ERROR] Error eliminando documento {doc_id} de Qdrant: {e}")

    def list_documents(self) -> List[DocumentResponse]:
        """
        Lista los documentos directamente desde la base de datos principal (PostgreSQL),
        que ahora es la única fuente de verdad para el estado y los metadatos.
        """
        with self.db_session() as db:
            db_documents = self.crud.list_documents(db)
            response_list = []
            for db_doc in db_documents:
                response_list.append(
                    DocumentResponse(
                        id=str(db_doc.id),
                        filename=db_doc.filename,
                        content_type=db_doc.content_type,
                        size=db_doc.size,
                        uploaded_at=db_doc.uploaded_at.isoformat(),
                        status=db_doc.status,
                        tags=db_doc.tags
                    )
                )
        return response_list

    def get_document_chunks(self, doc_id: str) -> List[DocumentChunk]:
        return get_chunks_by_document_id(doc_id)
    
    def _process_document_task(self, doc_id: str, doc_create_dict: dict) -> None:
        """
        Esta es la tarea que se ejecuta en segundo plano.
        NOTA: Pasamos un dict en lugar del objeto Pydantic porque es más seguro
        para la serialización en tareas de fondo.
        """
        doc = DocumentCreate(**doc_create_dict)
        
        with self.db_session() as db:
            try:
                print(f"[TASK] Iniciando procesamiento para el documento {doc_id}")
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if not db_doc:
                    print(f"[TASK ERROR] Documento {doc_id} no encontrado en la DB.")
                    return
                
                self.crud.update_document_field(db, doc_id, "status", "processing")

                print(f"[TASK] Extrayendo texto del documento {doc_id}.")
                text = _extract_text_from_content(doc.content, doc.content_type, doc.filename)
                if text:
                    self.crud.update_document_field(db, doc_id, "text_content", text)

                print(f"[TASK] Dividiendo texto en chunks para el documento {doc_id}.")
                chunks = _split_text(text, doc_id, doc)
                
                vectors = embedding_service.generate_embeddings(chunks, doc_id, doc)

                if vectors:
                    print(f"[TASK] Subiendo {len(vectors)} chunks a Qdrant para el documento {doc_id}.")
                    upsert_vectors(vectors)

                self.crud.update_document_field(db, doc_id, "status", "processed")
                print(f"[TASK] Documento {doc_id} procesado exitosamente.")

                self.crud.refresh_document(db, doc_id)

            except Exception as e:
                print(f"[ERROR] Error durante el procesamiento en segundo plano del doc {doc_id}: {e}")
                if 'db' in locals() and db.is_active:
                    db_doc = self.crud.get_document_by_id(db, doc_id)
                    if db_doc:
                        self.crud.update_document_field(db, doc_id, "status", "failed")

    @staticmethod
    def db_session():
        return SessionLocal()

    @property
    def crud(self):
        return crud

document_service = DocumentService()