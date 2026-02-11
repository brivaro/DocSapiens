import logging
import hashlib
from typing import List, Optional
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

# Helper function para mapear la intención de búsqueda al tipo de ingesta correcto
def get_ingestion_task_type(configured_task_type: str) -> str:
    """
    Determina cómo debe 'vestirse' el documento basándose en cómo se va a buscar.
    Basado en la documentación de Google Gemini Embeddings.
    """
    # Casos Asimétricos (La pregunta es X, el documento debe ser RETRIEVAL_DOCUMENT)
    if configured_task_type in [
        "RETRIEVAL_QUERY", 
        "QUESTION_ANSWERING", 
        "FACT_VERIFICATION", 
        "CODE_RETRIEVAL_QUERY"
    ]:
        return "RETRIEVAL_DOCUMENT"
    
    # Casos Simétricos (El documento usa el mismo tipo que la query)
    # SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING
    return configured_task_type

class DocumentService:
    # --- PROPIEDADES ---
    @property
    def crud(self): return crud
    
    @staticmethod
    def db_session(): return SessionLocal()

    # --- CREACIÓN / SUBIDA ---
    def create_document(self, doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session) -> Document:
        file_hash = hashlib.md5(doc.content).hexdigest()
        existing_doc = self.crud.get_document_by_filename(db, doc.filename)

        if existing_doc:
            logging.info(f"[INFO] Documento '{doc.filename}' existente. Actualizando configuración y contenido...")
            # Al subir de nuevo el mismo archivo, asumimos que el usuario quiere "resetear" este archivo.
            # Por tanto, borramos sus chunks de TODAS las colecciones para evitar inconsistencias.
            qdrant.delete_all_chunks_for_document_globally(str(existing_doc.id))
            db_doc = self.crud.update_document(db, existing_doc, doc)
        else:
            logging.info(f"[INFO] Creando documento '{doc.filename}'.")
            db_doc = self.crud.create_document(db, doc)
        
        db_doc.file_hash = file_hash
        db.commit()

        # Procesar para la dimensión ACTIVA
        background_tasks.add_task(self._process_document_task, str(db_doc.id))
        return db_doc

    # --- RE-INDEXADO (Cambiar parámetros sin subir archivo) ---
    def reindex_document(self, doc_id: str, params: DocumentUpdateParams, background_tasks: BackgroundTasks) -> Document:
        with self.db_session() as db:
            # 1. Obtener doc y config activa
            db_doc = self.crud.get_document_by_id(db, doc_id)
            if not db_doc: raise ValueError("Documento no encontrado")
            
            config = self.crud.get_active_rag_config(db)
            active_dim = config.embedding_dimension if config else 768

            # 2. Actualizar parámetros en BD
            updates = params.model_dump(exclude_unset=True)
            updated_doc = self.crud.update_document_config(db, doc_id, updates)
            
            # 3. Borrar chunks SOLO de la colección activa (preserva otras dimensiones)
            qdrant.delete_document_from_collection(doc_id, active_dim)
            
            logging.info(f"[REINDEX] Re-indexando documento {doc_id} en dimensión {active_dim}...")
            
            # 4. Lanzar tarea
            background_tasks.add_task(self._process_document_task, doc_id)
            
            return updated_doc

    # --- BORRADO ---
    def delete_document(self, doc_id: str) -> None:
        with self.db_session() as db:
            self.crud.delete_document(db, doc_id)
        qdrant.delete_all_chunks_for_document_globally(doc_id)

    # --- LISTADO ---
    def list_documents(self) -> List[DocumentResponse]:
        with self.db_session() as db:
            docs = self.crud.list_documents(db)
            return [DocumentResponse.model_validate(d) for d in docs]

    # --- OBTENCIÓN DE CHUNKS ---
    def get_document_chunks(self, doc_id: str) -> List[DocumentChunk]:
        with self.db_session() as db:
            config = self.crud.get_active_rag_config(db)
            dim = config.embedding_dimension if config else 768
        return qdrant.fetch_chunks_by_document_id(doc_id, dim)

    # --- SINCRONIZACIÓN DE COLECCIONES ---
    def sync_active_collection(self):
        """
        Detecta documentos en la BD que no están en la colección Qdrant ACTIVA y los procesa.
        NO borra nada. Solo añade lo que falta (Import).
        """
        logging.info("[SYNC] Iniciando sincronización...")
        with self.db_session() as db:
            config = self.crud.get_active_rag_config(db)
            if not config: return
            
            target_dim = config.embedding_dimension
            target_task_type = config.embedding_task_type
            
            qdrant.ensure_collection(target_dim)
            
            all_docs = self.crud.list_documents(db)
            qdrant_ids = qdrant.get_stored_document_ids(target_dim)
            
            missing_docs = [d for d in all_docs if str(d.id) not in qdrant_ids]
            
            if not missing_docs:
                logging.info(f"[SYNC] Colección {target_dim} sincronizada.")
                return

            logging.info(f"[SYNC] Importando {len(missing_docs)} documentos a dim={target_dim} ({target_task_type})...")
            
            for doc in missing_docs:
                self._process_document_task(str(doc.id), sync_dimension=target_dim, sync_task_type=target_task_type)

    # --- TAREA DE PROCESAMIENTO (CORE) ---
    def _process_document_task(self, doc_id: str, sync_dimension: int = None, sync_task_type: str = None) -> None:
        """
        Tarea unificada. Lee la configuración del doc desde la BD,
        extrae texto, hace split, embed (con TASK TYPE) y upsert.
        """
        with self.db_session() as db:
            try:
                # 1. Obtener documento
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if not db_doc: return

                # 2. Determinar Configuración
                if sync_dimension:
                    dimension = sync_dimension
                    selected_task_type = sync_task_type or "RETRIEVAL_QUERY"
                else:
                    config = self.crud.get_active_rag_config(db)
                    dimension = config.embedding_dimension if config else 768
                    selected_task_type = config.embedding_task_type if config else "RETRIEVAL_QUERY"
                
                # LÓGICA DE GOOGLE: Convertimos la intención de búsqueda en tipo de ingesta
                ingestion_task_type = get_ingestion_task_type(selected_task_type)
                
                logging.info(f"[TASK] Configurado: {selected_task_type} -> Ingestando como: {ingestion_task_type}")

                model_name = "gemini-embedding-001" 
                qdrant.ensure_collection(dimension)

                self.crud.update_document_field(db, doc_id, "status", "processing")
                
                # 2. Texto
                text = db_doc.text_content
                if not text:
                    logging.info(f"[TASK] Extrayendo texto nuevo para {db_doc.filename}...")
                    text = _extract_text_from_content(db_doc.content, db_doc.content_type, db_doc.filename)
                    if text and "Unsupported" not in text:
                        self.crud.update_document_field(db, doc_id, "text_content", text)
                        db.commit()
                        db.refresh(db_doc)
                
                if not text or "Unsupported" in text or "Error" in text:
                    raise ValueError(f"No se pudo extraer texto válido.")

                # 3. Split
                class DocParams:
                    split_mode = db_doc.split_mode
                    split_by = db_doc.split_by
                    chunk_size = db_doc.chunk_size
                    overlap = db_doc.overlap
                    content_type = db_doc.content_type
                    content = db_doc.content
                    filename = db_doc.filename

                chunks = _split_text(text, str(db_doc.id), DocParams)
                if not chunks:
                    raise ValueError("El splitter no generó chunks.")

                texts_to_embed = [c.text for c in chunks]
                
                # 5. Embedding
                logging.info(f"[TASK] Embeddings: {len(texts_to_embed)} items | Dim: {dimension} | Type: {ingestion_task_type}")
                
                vectors = google_service.generate_embeddings(
                    texts=texts_to_embed, 
                    model=model_name, 
                    dimension=dimension,
                    task_type=ingestion_task_type, # Usar el tipo correcto para documentos
                    doc_title=db_doc.filename
                )

                # 6. Upsert
                vector_objs = qdrant.generate_vector_objects(vectors, chunks, str(db_doc.id), db_doc.filename, db_doc.tags)
                qdrant.upsert_vectors(vector_objs, dimension)

                # 7. Finalizar
                db_doc.status = "processed"
                db_doc.chunk_count = len(chunks)
                db_doc.error_message = None
                db.commit()
                logging.info(f"[TASK] Doc {doc_id} procesado OK.")

            except Exception as e:
                logging.error(f"[TASK ERROR] Doc {doc_id}: {e}", exc_info=True)
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if db_doc:
                    db_doc.status = "failed"
                    db_doc.error_message = str(e)
                    db.commit()

document_service = DocumentService()