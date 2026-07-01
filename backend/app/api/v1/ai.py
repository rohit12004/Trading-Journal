from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
import logging
from typing import Optional

from app.api import deps
from app.models.user import User
from app.services.ai_service import ai_service

logger = logging.getLogger("app.api.v1.ai")

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

@router.post("/voice-log")
async def api_voice_log(
    client_date: Optional[str] = None,
    timezone: Optional[str] = None,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a voice log audio file (.webm/.wav) and extract structured trade parameters.
    """
    print(f"\n[DEBUG] === Voice Log Request Received ===", flush=True)
    print(f"[DEBUG] Filename: {file.filename}", flush=True)
    print(f"[DEBUG] Content-Type: {file.content_type}", flush=True)
    print(f"[DEBUG] Client Date: {client_date}, Timezone: {timezone}", flush=True)
    print(f"[DEBUG] User: {current_user.email}", flush=True)
    
    logger.info(f"Voice log request received: {file.filename} ({file.content_type}) for user {current_user.email} (Client Date: {client_date})")

    if not (file.content_type.startswith("audio/") or "webm" in file.filename or "octet-stream" in file.content_type):
        print(f"[DEBUG] Validation failed: Invalid file type {file.content_type}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a valid audio file."
        )

    try:
        audio_bytes = await file.read()
        print(f"[DEBUG] Read {len(audio_bytes)} bytes from uploaded file. Invoking ai_service.process_voice_log...", flush=True)
        parsed_result = ai_service.process_voice_log(audio_bytes, file.filename, client_date)
        print(f"[DEBUG] ai_service.process_voice_log finished successfully.", flush=True)
        return parsed_result
    except Exception as e:
        print(f"[DEBUG] Error processing voice log in API router: {str(e)}", flush=True)
        logger.error(f"Error in api_voice_log: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process voice log: {str(e)}"
        )

class CoachChatRequest(BaseModel):
    message: str

@router.post("/coach/chat")
def api_coach_chat(
    payload: CoachChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat with the AI Coach, retrieving user-specific context from Neo4j.
    """
    try:
        from app.services.graph_service import graph_memory_service
        
        # 1. Fetch graph context for this user
        graph_context = graph_memory_service.query_context(current_user.id)
        
        # 2. Formulate system instructions and prompts
        system_instruction = (
            "You are QuantCoach AI, a professional trading psychology coach and trading mentor. "
            "You help traders manage their emotions, avoid psychological pitfalls (like FOMO, overtrading, revenge trading), "
            "refine their strategies, and stay disciplined.\n\n"
            "Below is the trader's historical trading knowledge graph context containing their "
            "recorded emotions, strategies used, and recent daily journal entries.\n"
            "Use this context to answer their query personally and accurately. If they ask about "
            "past experiences, reference this data specifically.\n\n"
            "CRITICAL: Keep your responses highly concise, focused, and conversational (ideally under 150 words or 2-3 paragraphs). "
            "Avoid massive walls of text, unnecessary subheaders, or generic introductory/concluding filler. Speak like a real-world human mentor: direct, supportive, and practical.\n\n"
            f"=== TRADER KNOWLEDGE GRAPH DATA ===\n{graph_context}\n===================================="
        )
        
        # We call the Gemini Interactions API
        interaction = ai_service.client.interactions.create(
            model="gemini-3.5-flash",
            input=payload.message,
            system_instruction=system_instruction
        )
        
        raw_text = interaction.output_text
        if not raw_text and interaction.steps:
            last_step = interaction.steps[-1]
            if last_step.type == "model_output" and last_step.content:
                raw_text = last_step.content[0].text
                
        return {"response": raw_text or "I'm sorry, I couldn't formulate a response."}
    except Exception as e:
        logger.error(f"Error in api_coach_chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate coach advice: {str(e)}"
        )

@router.post("/voice-transcribe")
async def api_voice_transcribe(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload an audio file and transcribe it into plain text.
    """
    if not (file.content_type.startswith("audio/") or "webm" in file.filename or "octet-stream" in file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a valid audio file."
        )

    try:
        audio_bytes = await file.read()
        transcript = ai_service.transcribe_audio(audio_bytes, file.filename)
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Error in api_voice_transcribe: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )

@router.post("/coach/voice-chat")
async def api_coach_voice_chat(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a spoken voice query, transcribe it, fetch Neo4j graph context, 
    and get advice from Gemini in a single pass.
    """
    if not (file.content_type.startswith("audio/") or "webm" in file.filename or "octet-stream" in file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a valid audio file."
        )

    try:
        from app.services.graph_service import graph_memory_service
        
        # 1. Transcribe the audio first
        audio_bytes = await file.read()
        transcript = ai_service.transcribe_audio(audio_bytes, file.filename)
        
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not transcribe any speech from the audio."
            )
            
        # 2. Fetch graph context
        graph_context = graph_memory_service.query_context(current_user.id)
        
        # 3. Compile prompt and send to Gemini
        system_instruction = (
            "You are QuantCoach AI, a professional trading psychology coach and trading mentor. "
            "You help traders manage their emotions, avoid psychological pitfalls (like FOMO, overtrading, revenge trading), "
            "refine their strategies, and stay disciplined.\n\n"
            "Below is the trader's historical trading knowledge graph context containing their "
            "recorded emotions, strategies used, and recent daily journal entries.\n"
            "Use this context to answer their query personally and accurately. If they ask about "
            "past experiences, reference this data specifically.\n\n"
            "CRITICAL: Keep your responses highly concise, focused, and conversational (ideally under 150 words or 2-3 paragraphs). "
            "Avoid massive walls of text, unnecessary subheaders, or generic introductory/concluding filler. Speak like a real-world human mentor: direct, supportive, and practical.\n\n"
            f"=== TRADER KNOWLEDGE GRAPH DATA ===\n{graph_context}\n===================================="
        )
        
        interaction = ai_service.client.interactions.create(
            model="gemini-3.5-flash",
            input=transcript,
            system_instruction=system_instruction
        )
        
        raw_text = interaction.output_text
        if not raw_text and interaction.steps:
            last_step = interaction.steps[-1]
            if last_step.type == "model_output" and last_step.content:
                raw_text = last_step.content[0].text
                
        return {
            "transcript": transcript,
            "response": raw_text or "I'm sorry, I couldn't formulate a response."
        }
    except Exception as e:
        logger.error(f"Error in api_coach_voice_chat: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate voice-based coach advice: {str(e)}"
        )

