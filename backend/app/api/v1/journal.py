from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime
import logging
from typing import Optional

from app.api import deps
from app.models.user import User
from app.models.journal import JournalEntry
from app.services.graph_service import graph_memory_service
from app.services.ai_service import ai_service

logger = logging.getLogger("app.api.v1.journal")

router = APIRouter()

class JournalSaveRequest(BaseModel):
    date: str  # YYYY-MM-DD
    content: str

class JournalResponse(BaseModel):
    id: str
    date: str
    content: str

@router.get("", response_model=Optional[JournalResponse])
def get_journal(
    date: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Fetch a daily journal entry by date.
    """
    try:
        date_val = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD."
        )

    entry = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == date_val
    ).first()

    if not entry:
        return None

    return JournalResponse(
        id=entry.id,
        date=str(entry.date),
        content=entry.content
    )

@router.post("")
def save_journal(
    payload: JournalSaveRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create or update a daily journal entry, then sync to Neo4j graph memory.
    """
    try:
        date_val = datetime.date.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD."
        )

    if not payload.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal content cannot be empty."
        )

    entry = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == date_val
    ).first()

    if entry:
        entry.content = payload.content
        db.commit()
        db.refresh(entry)
    else:
        entry = JournalEntry(
            user_id=current_user.id,
            date=date_val,
            content=payload.content
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

    # Sync to Neo4j Graph Memory asynchronously/synchronously
    try:
        extracted_entities = graph_memory_service.add_journal_entry(
            user_id=current_user.id,
            journal_id=entry.id,
            date=payload.date,
            content=payload.content
        )
    except Exception as graph_err:
        logger.error(f"Failed to sync journal entry to Neo4j graph: {graph_err}", exc_info=True)
        # We don't fail the HTTP response if Neo4j sync fails, just log it.
        extracted_entities = None

    return {
        "status": "success",
        "message": "Journal entry saved and indexed successfully.",
        "journal": {
            "id": entry.id,
            "date": str(entry.date),
            "content": entry.content
        },
        "extracted_entities": extracted_entities
    }

@router.post("/voice")
async def voice_journal(
    client_date: Optional[str] = None,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Transcribe a spoken audio recording into a journal transcript.
    """
    print(f"\n[DEBUG] === Voice Journal Request Received ===", flush=True)
    print(f"[DEBUG] Filename: {file.filename}, Type: {file.content_type}", flush=True)
    
    if not (file.content_type.startswith("audio/") or "webm" in file.filename or "octet-stream" in file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an audio file."
        )

    try:
        audio_bytes = await file.read()
        parsed_result = ai_service.process_voice_journal(audio_bytes, file.filename, client_date)
        return parsed_result
    except Exception as e:
        logger.error(f"Error processing voice journal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process voice journal: {str(e)}"
        )
