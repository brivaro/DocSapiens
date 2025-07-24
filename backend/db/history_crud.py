import json
from sqlalchemy.orm import Session
from backend.db.models import History
from typing import List
import uuid

# Crear historial
def create_history(db: Session, questions: List[str], answers: List[str], chunks_for_first_message: List[str]) -> History:
    # El primer elemento es una lista que contiene los chunks del primer mensaje,
    # todo ello convertido a un único string JSON.
    initial_chunks_list = [json.dumps(chunks_for_first_message)]
    
    db_history = History(
        id=uuid.uuid4(),
        questions=questions,
        answers=answers,
        chunks=initial_chunks_list # Guardamos una lista con un solo elemento
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

# Obtener historial por ID
def get_history(db: Session, history_id: str):
    return db.query(History).filter(History.id == history_id).first()

# Listar historiales
def list_histories(db: Session):
    return db.query(History).all()

def update_history(db: Session, history_id: str, question: str, answer: str, new_chunks: List[str]):
    db_history = db.query(History).filter(History.id == history_id).first()
    if not db_history:
        return None
    
    # Creamos un string JSON que representa la lista de chunks para este nuevo mensaje
    new_chunks_as_json_string = json.dumps(new_chunks)
    
    # Creamos las nuevas listas para forzar la detección de SQLAlchemy
    new_questions = db_history.questions + [question]
    new_answers = db_history.answers + [answer]
    # Añadimos el nuevo string JSON a la lista principal de chunks
    new_chunks_list = db_history.chunks + [new_chunks_as_json_string]
    
    db_history.questions = new_questions
    db_history.answers = new_answers
    db_history.chunks = new_chunks_list

    db.commit()
    db.refresh(db_history)
    return db_history