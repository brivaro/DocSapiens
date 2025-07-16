from fastapi import APIRouter, HTTPException
from backend.models.apikey import APIKeyCreate, APIKeyResponse
from backend.services.apikey_service import apikey_service

router = APIRouter()

@router.post("/", response_model=APIKeyResponse)
def create_apikey(apikey: APIKeyCreate):
    """Crea una nueva API Key."""
    return apikey_service.create_apikey(apikey)

@router.get("/", response_model=list[APIKeyResponse])
def list_apikeys():
    """Lista todas las API Keys activas."""
    return apikey_service.list_apikeys()

@router.delete("/{key_id}")
def revoke_apikey(key_id: str):
    """Revoca una API Key por su ID."""
    apikey_service.revoke_apikey(key_id)
    return {"detail": "API Key revocada"} 