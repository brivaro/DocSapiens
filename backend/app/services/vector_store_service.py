import logging
from sqlalchemy.orm import Session
from app.db import vector_store as crud
from app.models.vector_store import VectorStoreCreate, VectorStoreResponse
from app.vectorstore import qdrant

class VectorStoreService:
    def create_vector_store(self, db: Session, vs_in: VectorStoreCreate) -> VectorStoreResponse:
        # 1. Verificar si existe nombre duplicado
        if crud.get_vector_store_by_name(db, vs_in.name):
            raise ValueError(f"Ya existe una colección con el nombre '{vs_in.name}'.")

        # 2. Crear registro en DB
        db_vs = crud.create_vector_store(db, vs_in)
        
        # 3. Crear colección física en Qdrant
        # Naming convention: nombre_dimension (ej: finanzas_768)
        collection_name = f"{db_vs.name}_{db_vs.embedding_dimension}"
        qdrant.ensure_collection(collection_name, db_vs.embedding_dimension)
        
        logging.info(f"[VS SERVICE] Vector Store '{db_vs.name}' creado exitosamente.")
        return db_vs

    def list_vector_stores(self, db: Session) -> list[VectorStoreResponse]:
        stores = crud.list_vector_stores(db)
        # Opcional: Podríamos enriquecer esto preguntando a Qdrant cuántos vectores tiene cada uno
        # pero por ahora devolvemos lo de la DB para ser rápidos.
        return stores

    def delete_vector_store(self, db: Session, vs_id: str):
        db_vs = crud.get_vector_store(db, vs_id)
        if not db_vs:
            raise ValueError("Vector Store no encontrado.")
        
        collection_name = f"{db_vs.name}_{db_vs.embedding_dimension}"
        
        # 1. Borrar de Qdrant
        qdrant.delete_collection(collection_name)
        
        # 2. Borrar de DB (Cascade borrará los documentos asociados)
        crud.delete_vector_store(db, vs_id)
        logging.info(f"[VS SERVICE] Vector Store '{collection_name}' eliminado.")

vector_store_service = VectorStoreService()