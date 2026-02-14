import logging
import hashlib
from typing import List
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.db import crud
from app.db.models import Document
from app.db.session import SessionLocal
from app.models.document import DocumentCreate, DocumentResponse, DocumentChunk, DocumentUpdateParams
from app.processing.extractor import _extract_text_from_content
from app.processing.splitter import _split_text
from app.vectorstore import qdrant
from app.services.google_service import google_service

class DocumentService:
    @property
    def crud(self): return crud
    
    @staticmethod
    def db_session(): return SessionLocal()

    def create_document(self, doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session) -> Document:
        # Verificar que el Vector Store existe
        vs = crud.get_vector_store(db, doc.vector_store_id)
        if not vs:
            raise ValueError("Vector Store especificado no existe.")

        # Verificar duplicados dentro de la misma colección
        existing_doc = crud.get_document_by_filename_in_store(db, doc.filename, doc.vector_store_id)
        
        file_hash = hashlib.md5(doc.content).hexdigest()

        if existing_doc:
            logging.info(f"[INFO] Actualizando documento '{doc.filename}' en colección '{vs.name}'.")
            # Borramos chunks antiguos de Qdrant antes de reprocesar
            collection_name = f"{vs.name}_{vs.embedding_dimension}"
            qdrant.delete_document_from_collection(collection_name, str(existing_doc.id))
            db_doc = self.crud.update_document(db, existing_doc, doc)
        else:
            logging.info(f"[INFO] Creando documento '{doc.filename}' en colección '{vs.name}'.")
            db_doc = self.crud.create_document(db, doc)
        
        db_doc.file_hash = file_hash
        db.commit()

        # Lanzar tarea de procesamiento
        background_tasks.add_task(self._process_document_task, str(db_doc.id))
        return db_doc

    def delete_document(self, doc_id: str) -> None:
        with self.db_session() as db:
            db_doc = self.crud.get_document_by_id(db, doc_id)
            if not db_doc: return
            
            # Necesitamos el VS para saber el nombre de la colección
            vs = db_doc.vector_store
            collection_name = f"{vs.name}_{vs.embedding_dimension}"
            
            # Borrar de Qdrant
            qdrant.delete_document_from_collection(collection_name, doc_id)
            # Borrar de DB
            self.crud.delete_document(db, doc_id)

    def list_documents(self, vector_store_id: str = None) -> List[DocumentResponse]:
        with self.db_session() as db:
            docs = self.crud.list_documents(db, vector_store_id)
            return [DocumentResponse.model_validate(d) for d in docs]

    def get_document_chunks(self, doc_id: str) -> List[DocumentChunk]:
        with self.db_session() as db:
            db_doc = self.crud.get_document_by_id(db, doc_id)
            if not db_doc: return []
            
            vs = db_doc.vector_store
            collection_name = f"{vs.name}_{vs.embedding_dimension}"
            
            return qdrant.fetch_chunks_by_document_id(collection_name, doc_id)

    def _process_document_task(self, doc_id: str) -> None:
        """Tarea de fondo para procesar el documento."""
        with self.db_session() as db:
            try:
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if not db_doc: return

                vs = db_doc.vector_store
                dimension = vs.embedding_dimension
                collection_name = f"{vs.name}_{dimension}"
                
                # INGESTA SIEMPRE COMO RETRIEVAL_DOCUMENT
                task_type = "RETRIEVAL_DOCUMENT"

                qdrant.ensure_collection(collection_name, dimension)
                self.crud.update_document_field(db, doc_id, "status", "processing")
                
                # 1. Extract
                text = db_doc.text_content
                if not text:
                    text = _extract_text_from_content(db_doc.content, db_doc.content_type, db_doc.filename)
                    if text:
                        self.crud.update_document_field(db, doc_id, "text_content", text)
                        db.commit()
                        db.refresh(db_doc)
                
                if not text: raise ValueError("Texto vacío.")

                # 2. Split
                # Mock object para reutilizar la funcion splitter existente
                class DocParams:
                    split_mode = db_doc.split_mode
                    split_by = db_doc.split_by
                    chunk_size = db_doc.chunk_size
                    overlap = db_doc.overlap
                    content_type = db_doc.content_type
                    content = db_doc.content
                    filename = db_doc.filename

                chunks = _split_text(text, str(db_doc.id), DocParams)
                if not chunks: raise ValueError("No se generaron chunks.")

                # 3. Embed
                texts_to_embed = [c.text for c in chunks]
                vectors = google_service.generate_embeddings(
                    texts=texts_to_embed, 
                    model=vs.embedding_model, 
                    dimension=dimension,
                    task_type=task_type,
                    doc_title=db_doc.filename
                )

                # 4. Upsert
                vector_objs = qdrant.generate_vector_objects(
                    embeddings=vectors, 
                    chunks=chunks, 
                    doc_id=str(db_doc.id),
                    filename=db_doc.filename, 
                    tags=db_doc.tags
                )

                # 5. Upsert
                qdrant.upsert_vectors(collection_name, vector_objs)

                # 5. Finish
                db_doc.status = "processed"
                db_doc.chunk_count = len(chunks)
                db_doc.error_message = None
                db.commit()

            except Exception as e:
                logging.error(f"[TASK ERROR] Doc {doc_id}: {e}")
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if db_doc:
                    db_doc.status = "failed"
                    db_doc.error_message = str(e)
                    db.commit()

document_service = DocumentService()