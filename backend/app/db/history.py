import json
import uuid
from typing import List
from sqlalchemy.orm import Session
from app.db.models import History
from app.models.chat import Chunk

def create_history(db: Session, questions: List[str], answers: List[str], chunks_for_first_message: List[Chunk]):
    list_of_dicts = [c.model_dump() for c in chunks_for_first_message]
    first_message_chunks_as_json = json.dumps(list_of_dicts)

    db_history = History(
        id=uuid.uuid4(),
        questions=questions,
        answers=answers,
        chunks=[first_message_chunks_as_json]
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_history(db: Session, history_id: str):
    return db.query(History).filter(History.id == history_id).first()

def list_histories(db: Session):
    return db.query(History).order_by(History.created_at.desc()).all()

def update_history(db: Session, history_id: str, question: str, answer: str, new_chunks: List[Chunk]):
    db_history = db.query(History).filter(History.id == history_id).first()
    if not db_history:
        return None

    list_of_dicts = [c.model_dump() for c in new_chunks]
    new_chunks_as_json_string = json.dumps(list_of_dicts)
    
    db_history.questions = db_history.questions + [question]
    db_history.answers = db_history.answers + [answer]
    db_history.chunks = db_history.chunks + [new_chunks_as_json_string]

    db.commit()
    db.refresh(db_history)
    return db_history

def delete_history(db: Session, history_id: str) -> bool:
    db_history = db.query(History).filter(History.id == history_id).first()
    if db_history:
        db.delete(db_history)
        db.commit()
        return True
    return False