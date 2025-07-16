from typing import List
from backend.models.apikey import APIKeyCreate, APIKeyResponse
from backend.db.session import SessionLocal
from backend.db import crud
from datetime import datetime

class APIKeyService:
    """Servicio para la gestión de API Keys."""
    def create_apikey(self, apikey: APIKeyCreate) -> APIKeyResponse:
        with SessionLocal() as db:
            db_apikey = crud.create_apikey(db, apikey)
            return APIKeyResponse(
                id=str(db_apikey.id),
                name=db_apikey.name,
                key=db_apikey.key,
                created_at=db_apikey.created_at,
                revoked=db_apikey.revoked,
                revoked_at=db_apikey.revoked_at
            )

    def list_apikeys(self) -> List[APIKeyResponse]:
        with SessionLocal() as db:
            apikeys = crud.list_apikeys(db)
            return [
                APIKeyResponse(
                    id=str(a.id),
                    name=a.name,
                    key=a.key,
                    created_at=a.created_at,
                    revoked=a.revoked,
                    revoked_at=a.revoked_at
                ) for a in apikeys
            ]

    def revoke_apikey(self, key_id: str) -> None:
        with SessionLocal() as db:
            crud.revoke_apikey(db, key_id)

apikey_service = APIKeyService() 