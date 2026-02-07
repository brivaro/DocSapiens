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
        # Si se borra de la BD, se borra de TODOS lados
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
            qdrant.ensure_collection(target_dim)
            
            all_docs = self.crud.list_documents(db)
            # IDs que YA están en esta dimensión
            qdrant_ids = qdrant.get_stored_document_ids(target_dim)
            
            missing_docs = [d for d in all_docs if str(d.id) not in qdrant_ids]
            
            if not missing_docs:
                logging.info(f"[SYNC] Colección {target_dim} sincronizada.")
                return

            logging.info(f"[SYNC] Importando {len(missing_docs)} documentos faltantes a dim={target_dim}...")
            
            for doc in missing_docs:
                # Procesamos secuencialmente en el hilo de background
                self._process_document_task(str(doc.id), sync_dimension=target_dim)

    # --- TAREA DE PROCESAMIENTO (CORE) ---
    def _process_document_task(self, doc_id: str, sync_dimension: int = None) -> None:
        """
        Tarea unificada. Lee la configuración del doc desde la BD,
        extrae texto (o usa caché), hace split, embed y upsert.
        """
        with self.db_session() as db:
            try:
                # 1. Configuración
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if not db_doc: return

                if sync_dimension:
                    dimension = sync_dimension
                else:
                    config = self.crud.get_active_rag_config(db)
                    dimension = config.embedding_dimension if config else 768
                
                model_name = "gemini-embedding-001" # O leer de config
                qdrant.ensure_collection(dimension)

                self.crud.update_document_field(db, doc_id, "status", "processing")
                
                # 2. Texto
                text = db_doc.text_content
                if not text:
                    logging.info(f"[TASK] Extrayendo texto nuevo para {db_doc.filename}...")
                    text = _extract_text_from_content(db_doc.content, db_doc.content_type, db_doc.filename)
                    if text and "Unsupported" not in text:
                        self.crud.update_document_field(db, doc_id, "text_content", text)
                        db.commit() # Guardar cache
                        db.refresh(db_doc) # Refrescar objeto local
                
                if not text or "Unsupported" in text or "Error" in text:
                    raise ValueError(f"No se pudo extraer texto válido: {text[:50]}...")

                # 3. Preparar objeto temporal para el splitter (usando configuración de la BD)
                # Necesitamos pasarle un objeto que tenga los atributos que espera splitter
                class DocParams:
                    split_mode = db_doc.split_mode
                    split_by = db_doc.split_by
                    chunk_size = db_doc.chunk_size
                    overlap = db_doc.overlap
                    content_type = db_doc.content_type
                    content = db_doc.content # Raw bytes necesario para PDF/Excel pages splitter
                    filename = db_doc.filename

                # 4. Split
                chunks = _split_text(text, str(db_doc.id), DocParams)
                if not chunks:
                    raise ValueError("El splitter no generó chunks.")

                texts_to_embed = [c.text for c in chunks]
                
                # 5. Embedding
                logging.info(f"[TASK] Generando {len(texts_to_embed)} embeddings (dim={dimension})...")
                vectors = google_service.generate_embeddings(texts_to_embed, model_name, dimension)

                # 6. Upsert (Pasamos parámetros para el payload de Qdrant)
                # Creamos un objeto dummy para generate_vector_objects que espera tags y filename
                class DocMetadata:
                    filename = db_doc.filename
                    tags = db_doc.tags
                    content_type = db_doc.content_type

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
                # Re-obtener doc por si la sesión se cerró o expiró
                db_doc = self.crud.get_document_by_id(db, doc_id)
                if db_doc:
                    db_doc.status = "failed"
                    db_doc.error_message = str(e)
                    db.commit()

document_service = DocumentService()