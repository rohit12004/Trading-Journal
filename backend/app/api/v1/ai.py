from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter()

class RefineNotesRequest(BaseModel):
    notes: str

class RefineNotesResponse(BaseModel):
    refined_notes: str

@router.post("/refine-notes", response_model=RefineNotesResponse)
def api_refine_notes(
    payload: RefineNotesRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Refine raw, messy trade notes into a professional markdown post-mortem.
    """
    try:
        refined = ai_service.refine_notes(payload.notes)
        return RefineNotesResponse(refined_notes=refined)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refine notes: {str(e)}"
        )
