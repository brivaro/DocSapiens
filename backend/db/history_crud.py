import json
from backend.models.chat import Chunk
from sqlalchemy.orm import Session
from backend.db.models import History
from typing import List
import uuid

# Crear historial
def create_history(db: Session, questions: List[str], answers: List[str], chunks_for_first_message: List[Chunk]):
    # Convierte la lista de objetos Chunk a una lista de diccionarios
    list_of_dicts = [c.model_dump() for c in chunks_for_first_message]
    # Convierte la lista de diccionarios en un único string JSON
    first_message_chunks_as_json = json.dumps(list_of_dicts)

    db_history = History(
        id=uuid.uuid4(),
        questions=questions,
        answers=answers,
        # Guarda una lista que contiene el string JSON del primer mensaje
        chunks=[first_message_chunks_as_json]
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

def update_history(db: Session, history_id: str, question: str, answer: str, new_chunks: List[Chunk]):
    db_history = db.query(History).filter(History.id == history_id).first()
    if not db_history:
        return None

    # Convierte la nueva lista de chunks a un único string JSON
    list_of_dicts = [c.model_dump() for c in new_chunks]
    new_chunks_as_json_string = json.dumps(list_of_dicts)
    
    # Creamos las nuevas listas para que SQLAlchemy detecte el cambio
    new_questions = db_history.questions + [question]
    new_answers = db_history.answers + [answer]
    # Añadimos el nuevo string JSON a la lista de chunks existente
    new_chunks_list = db_history.chunks + [new_chunks_as_json_string]
    
    db_history.questions = new_questions
    db_history.answers = new_answers
    db_history.chunks = new_chunks_list

    db.commit()
    db.refresh(db_history)
    return db_history