from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_embeddings():
    """Endpoint de prueba para embeddings."""
    return {"message": "Embeddings API is working!"} 