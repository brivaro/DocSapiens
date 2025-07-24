import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.chat import ChatHistoryResponse, ChatHistoryItem, ChatHistoryCreate, Chunk
from backend.db.history_crud import create_history, get_history, list_histories, update_history


router = APIRouter()

# Este endpoint ahora crea la PRIMERA entrada de una conversación
@router.post("/", response_model=ChatHistoryItem)
def save_history(history: ChatHistoryCreate, db: Session = Depends(get_db)):
    chunk_strings = [chunk.model_dump_json() for chunk in history.chunks]
    db_history = create_history(db, [history.question], [history.answer], chunk_strings)

    return ChatHistoryItem(
        id=str(db_history.id),
        questions=[history.question],
        answers=[history.answer],    
        chunks=history.chunks
    )

# Actualiza una conversación existente añadiendo un nuevo mensaje
@router.put("/{history_id}", response_model=ChatHistoryItem)
def update_history_endpoint(history_id: str, new_entry: ChatHistoryCreate, db: Session = Depends(get_db)):
    chunk_strings = [chunk.model_dump_json() for chunk in new_entry.chunks]
    
    updated_history = update_history(
        db, 
        history_id=history_id, 
        question=new_entry.question, 
        answer=new_entry.answer,
        chunks=chunk_strings
    )

    if not updated_history:
        raise HTTPException(status_code=404, detail="Historial no encontrado")

    parsed_chunks = []
    for chunk_str in updated_history.chunks:
        try:
            parsed_chunks.append(Chunk.model_validate(json.loads(chunk_str)))
        except (json.JSONDecodeError, TypeError):
            continue

    return ChatHistoryItem(
        id=str(updated_history.id),
        questions=updated_history.questions,
        answers=updated_history.answers,    
        chunks=parsed_chunks
    )

# --- ENDPOINT GET ALL ---
@router.get("/", response_model=ChatHistoryResponse)
def get_all_histories(db: Session = Depends(get_db)):
    histories = list_histories(db)
    items = []
    for h in histories:
        nested_parsed_chunks = []
        for chunk_list_str in h.chunks: # Itera sobre ['[{"id":1}]', '[{"id":2}]']
            try:
                # Parsea el string interior para obtener la lista de dicts
                list_of_chunk_dicts = json.loads(chunk_list_str)
                # Convierte la lista de dicts en una lista de objetos Chunk
                chunks_for_one_msg = [Chunk(**d) for d in list_of_chunk_dicts]
                nested_parsed_chunks.append(chunks_for_one_msg)
            except (json.JSONDecodeError, TypeError):
                nested_parsed_chunks.append([]) 
        
        items.append(ChatHistoryItem(
            id=str(h.id), 
            questions=h.questions,
            answers=h.answers,
            chunks=nested_parsed_chunks
        ))
    return ChatHistoryResponse(history=items)

# --- ENDPOINT GET BY ID CORREGIDO ---
@router.get("/{history_id}", response_model=ChatHistoryItem)
def get_history_by_id(history_id: str, db: Session = Depends(get_db)):
    db_history = get_history(db, history_id)
    if not db_history:
        raise HTTPException(status_code=404, detail="Historial no encontrado")
    
    parsed_chunks = []
    for chunk_str in db_history.chunks:
        try:
            chunk_dict = json.loads(chunk_str)
            parsed_chunks.append(Chunk(**chunk_dict))
        except (json.JSONDecodeError, TypeError):
            continue

    return ChatHistoryItem(
        id=str(db_history.id), 
        questions=db_history.questions,
        answers=db_history.answers,
        chunks=parsed_chunks
    )