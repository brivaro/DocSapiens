import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat import ChatHistoryResponse, ChatHistoryItem, ChatHistoryCreate, Chunk
from app.db.history_crud import create_history, get_history, list_histories, update_history

router = APIRouter()

@router.post("/", response_model=ChatHistoryItem)
def save_history(history: ChatHistoryCreate, db: Session = Depends(get_db)):
    # Ya no convertimos a strings aquí. Pasamos los objetos Chunk directamente.
    db_history = create_history(
        db, 
        questions=[history.question], 
        answers=[history.answer], 
        chunks_for_first_message=history.chunks # Pasamos la lista de objetos
    )
    
    return ChatHistoryItem(
        id=str(db_history.id),
        questions=[history.question],
        answers=[history.answer],
        # Envolvemos la lista de chunks en otra lista para que coincida con el modelo List[List[Chunk]]
        chunks=[history.chunks] 
    )

@router.put("/{history_id}", response_model=ChatHistoryItem)
def update_history_endpoint(history_id: str, new_entry: ChatHistoryCreate, db: Session = Depends(get_db)):
    # Pasamos los objetos Chunk directamente al CRUD
    updated_history = update_history(
        db, 
        history_id=history_id, 
        question=new_entry.question, 
        answer=new_entry.answer,
        new_chunks=new_entry.chunks
    )

    if not updated_history:
        raise HTTPException(status_code=404, detail="Historial no encontrado")

    # Reutilizamos la lógica de parseo de los endpoints GET para construir la respuesta
    nested_parsed_chunks = []
    for chunk_list_str in updated_history.chunks:
        try:
            list_of_chunk_dicts = json.loads(chunk_list_str)
            chunks_for_one_msg = [Chunk(**d) for d in list_of_chunk_dicts]
            nested_parsed_chunks.append(chunks_for_one_msg)
        except (json.JSONDecodeError, TypeError):
            nested_parsed_chunks.append([])
            
    return ChatHistoryItem(
        id=str(updated_history.id),
        questions=updated_history.questions,
        answers=updated_history.answers,
        chunks=nested_parsed_chunks
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