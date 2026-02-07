import logging
from typing import List
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.db import crud
from app.db.models import Document
from app.db.session import SessionLocal
from app.models.document import DocumentCreate, DocumentResponse, DocumentChunk
from app.processing.extractor import _extract_text_from_content
from app.processing.splitter import _split_text
from app.vectorstore import qdrant
from app.services.google_service import google_service

class DocumentService:
    def create_document(self, doc: DocumentCreate, background_tasks: BackgroundTasks, db: Session) -> Document:
        """
        Crea el registro y lanza el procesamiento en segundo plano.
        """
        db_doc = self.crud.get_document_by_filename(db, doc.filename)

        if db_doc:
            logging.info(f"[INFO] Documento '{doc.filename}' ya existe. Actualizando...")
            self.crud.update_document(db, db_doc, doc)
            # Limpiamos chunks viejos de TODAS las colecciones para evitar duplicados fantasma
            qdrant.delete_all_chunks_for_document_globally(str(db_doc.id))
        else:
            logging.info(f"[INFO] Creando documento '{doc.filename}'.")
            db_doc = self.crud.create_document(db, doc)

        # Lanzar tarea de procesamiento
        background_tasks.add_task(self._process_document_task, str(db_doc.id), doc.dict())
        
        return db_doc
    
    def delete_document(self, doc_id: str) -> None:
        # 1. Eliminar de PostgreSQL
        with self.db_session() as db:
            self.crud.delete_document(db, doc_id)

        # 2. Eliminar de TODAS las colecciones de Qdrant (limpieza global)
        qdrant.delete_all_chunks_for_document_globally(doc_id)

    def list_documents(self) -> List[DocumentResponse]:
        with self.db_session() as db:
            db_documents = self.crud.list_documents(db)
            return [
                DocumentResponse(
                    id=str(d.id),
                    filename=d.filename,
                    content_type=d.content_type,
                    size=d.size,
                    uploaded_at=d.uploaded_at.isoformat(),
                    status=d.status,
                    tags=d.tags
                ) for d in db_documents
            ]

    def get_document_chunks(self, doc_id: str) -> List[DocumentChunk]:
        # Para ver chunks, miramos en la colección por defecto o activa?
        # Por simplicidad para debug, miramos en la activa.
        with self.db_session() as db:
            config = self.crud.get_active_rag_config(db)
            # Si no hay config, fallback 768
            dim = config.embedding_dimension if config else 768
            
        # TODO: Implementar get en qdrant.py si es necesario para el frontend, 
        # actualmente qdrant.py no exportaba 'get_chunks_by_document_id' con dimension.
        # Dejamos un return vacio por ahora si no es crítico, o lo implementamos.
        return [] 
    
    def sync_active_collection(self):
        """
        [NUEVO] Sincroniza la colección activa de Qdrant con la base de datos PostgreSQL.
        Se llama cuando cambia la configuración de dimensionalidad.
        """
        logging.info("[SYNC] Iniciando sincronización de colección activa...")
        with self.db_session() as db:
            # 1. Obtener configuración activa
            config = self.crud.get_active_rag_config(db)
            if not config:
                logging.info("[SYNC ERROR] No hay configuración activa.")
                return
            
            target_dim = config.embedding_dimension
            target_model = config.embedding_model
            
            # 2. Asegurar que la colección existe en Qdrant
            qdrant.ensure_collection(target_dim)
            
            # 3. Obtener documentos en PostgreSQL
            all_db_docs = self.crud.list_documents(db)
            if not all_db_docs:
                logging.info("[SYNC] No hay documentos en la BD para sincronizar.")
                return

            # 4. Obtener documentos que YA están en Qdrant (para esa dimensión)
            stored_ids = qdrant.get_stored_document_ids(target_dim)
            
            # 5. Detectar faltantes
            docs_to_process = [d for d in all_db_docs if str(d.id) not in stored_ids]
            
            if not docs_to_process:
                logging.info(f"[SYNC] La colección (dim={target_dim}) ya está sincronizada.")
                return
            
            logging.info(f"[SYNC] Se encontraron {len(docs_to_process)} documentos pendientes para la dimensión {target_dim}.")
            
            # 6. Procesar faltantes (Reutilizando lógica)
            for doc in docs_to_process:
                # Reconstruimos el objeto DocumentCreate para pasarlo a la tarea
                # Nota: Si text_content ya existe en DB, _process_document_task lo usará
                doc_create_fake = {
                    "filename": doc.filename,
                    "content_type": doc.content_type,
                    "content": doc.content, # Esto es bytes
                    "split_by": doc.split_by,
                    "tags": doc.tags,
                    # Valores por defecto si no se guardaron (podríamos guardar chunk_size en DB en el futuro)
                    "chunk_size": 1000, 
                    "overlap": 200,
                    "split_mode": "delimiter"
                }
                # Ejecutamos síncronamente o lanzamos hilos. 
                # Como esto corre en background task desde el endpoint de settings, 
                # podemos hacerlo secuencial aquí.
                self._process_document_task(str(doc.id), doc_create_fake, sync_mode=True)

    def _process_document_task(self, doc_id: str, doc_create_dict: dict, sync_mode: bool = False) -> None:
        doc = DocumentCreate(**doc_create_dict)
        
        with self.db_session() as db:
            try:
                # 1. Obtener Configuración Activa
                config = self.crud.get_active_rag_config(db)
                # Fallback de seguridad
                dimension = config.embedding_dimension if config else 768
                model_name = config.embedding_model if config else "gemini-embedding-001"

                # Asegurar colección (por si acaso es el primer doc)
                qdrant.ensure_collection(dimension)

                logging.info(f"[TASK] Procesando doc {doc_id} para dim={dimension}...")
                
                # 2. Extracción de Texto
                db_doc = self.crud.get_document_by_id(db, doc_id)
                text = db_doc.text_content # Intentar leer de cache DB

                if not text:
                    if not sync_mode:
                        self.crud.update_document_field(db, doc_id, "status", "processing")
                    
                    logging.info(f"[TASK] Extrayendo texto nuevo...")
                    text = _extract_text_from_content(doc.content, doc.content_type, doc.filename)
                    
                    if text and "Unsupported file" not in text:
                        self.crud.update_document_field(db, doc_id, "text_content", text)
                else:
                    logging.info(f"[TASK] Texto reutilizado de la base de datos (Cache).")

                if not text or "Unsupported file" in text:
                    self.crud.update_document_field(db, doc_id, "status", "failed")
                    return

                # 3. Splitting
                chunks = _split_text(text, doc_id, doc)
                texts = [c.text for c in chunks]
                
                # 4. Embeddings (Google)
                vectors = google_service.generate_embeddings(
                    texts=texts, 
                    model=model_name, 
                    dimension=dimension
                )

                # 5. Qdrant Upsert
                vector_objs = qdrant.generate_vector_objects(vectors, chunks, doc_id, doc)
                if vector_objs:
                    qdrant.upsert_vectors(vector_objs, dimension)

                # Solo actualizamos a "processed" si no estamos en modo sync (para no machacar estados si hay concurrencia, aunque aquí simplificamos)
                if not sync_mode:
                    self.crud.update_document_field(db, doc_id, "status", "processed")
                
                logging.info(f"[TASK] Fin procesamiento doc {doc_id}.")

            except Exception as e:
                logging.info(f"[ERROR] Task doc {doc_id}: {e}")
                if 'db' in locals() and not sync_mode:
                    self.crud.update_document_field(db, doc_id, "status", "failed")

    @staticmethod
    def db_session():
        return SessionLocal()

    @property
    def crud(self):
        return crud

document_service = DocumentService()