from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger("app.services.ai_service")

class VoiceTradeParameters(BaseModel):
    asset_class: str = Field(
        description="Asset class. Must be one of: STOCKS, OPTIONS, FUTURES."
    )
    symbol: str = Field(
        description="Ticker symbol, e.g. INFY, RELIANCE, NIFTY, BANKNIFTY. Convert verbal names to standard ticker symbols in uppercase."
    )
    direction: str = Field(
        description="Direction of trade. Must be BUY or SELL (or CALL or PUT if OPTIONS)."
    )
    quantity: float = Field(
        description="Number of shares (for STOCKS) or contracts/lots (for OPTIONS/FUTURES). Default to 1.0 if not specified."
    )
    strike_price: Optional[float] = Field(
        None,
        description="Strike price of the option (only applicable if OPTIONS, otherwise null)."
    )
    entry_price: float = Field(
        description="The entry price or premium paid/received."
    )
    exit_price: float = Field(
        description="The exit price or premium. Default to 0.0 if not exited."
    )
    entry_time: Optional[str] = Field(
        None,
        description="Time entered in HH:MM format (24-hour style, e.g. '09:15', '14:30')."
    )
    exit_time: Optional[str] = Field(
        None,
        description="Time exited in HH:MM format (24-hour style, e.g. '11:00', '15:20')."
    )
    strategy: Optional[str] = Field(
        None,
        description="Strategy name (e.g. VWAP Breakout, EMA Crossover) if mentioned."
    )
    notes: Optional[str] = Field(
        None,
        description="Learnings, reasons, or psychology discussed in the voice note."
    )
    trade_date: Optional[str] = Field(
        None,
        description="The date of the trade in YYYY-MM-DD format. Calculate relative dates (like 'yesterday', 'day before yesterday', 'last Friday') relative to the reference date provided in the instructions."
    )

class VoiceLogResponse(BaseModel):
    transcript: str = Field(description="Verbatim transcription of the user's spoken audio.")
    trade_data: Optional[VoiceTradeParameters] = Field(None, description="Extracted trade parameters.")

class VoiceJournalResponse(BaseModel):
    transcript: str = Field(description="Verbatim transcription of the voice journal entry.")
    date: Optional[str] = Field(None, description="The date of the journal entry in YYYY-MM-DD format based on the reference date.")

class AIService:
    def __init__(self):
        self._client = None
        self.model = "gemini-3.5-flash"

    @property
    def client(self):
        if self._client is None:
            # Use GEMINI_API_KEY if configured in settings, otherwise let client load it from environment
            api_key = settings.GEMINI_API_KEY or None
            try:
                if api_key:
                    self._client = genai.Client(api_key=api_key)
                else:
                    self._client = genai.Client()
            except Exception as e:
                raise ValueError(
                    f"Gemini Client initialization failed: {str(e)}. "
                    "Please ensure GEMINI_API_KEY is configured in your .env file."
                )
        return self._client

    def refine_notes(self, raw_notes: str) -> str:
        """
        Takes raw trading notes and refines them into a structured markdown post-mortem.
        """
        if not raw_notes or not raw_notes.strip():
            return ""

        system_instruction = (
            "You are an expert editor for a trading journal. Your job is to clean up, refine, and fix the "
            "grammar, spelling, and phrasing of the user's raw trading notes. "
            "Keep the output extremely concise and close to the length of the original notes. "
            "Do NOT add paragraphs of generic advice, generic post-mortem headers, or fabricate new facts/numbers. "
            "Preserve all original key points and numbers, but present them in a professional, clean, and grammatically correct format."
        )

        prompt = (
            "Refine and correct the grammar of the following notes. Keep it concise, do not expand it significantly, and do not add prefaces or extra sections just return the new version nothing else:\n\n"
            f"{raw_notes}"
        )

        try:
            interaction = self.client.interactions.create(
                model=self.model,
                input=prompt,
                system_instruction=system_instruction
            )
            
            # Access response text using the interactions API helper property
            if hasattr(interaction, "output_text") and interaction.output_text:
                return interaction.output_text
            
            # Fallback path if output_text is not populated
            if interaction.steps:
                last_step = interaction.steps[-1]
                if last_step.type == "model_output" and last_step.content:
                    return last_step.content[0].text
            
            return raw_notes
        except Exception as e:
            print(f"Error in Gemini note refinement: {e}")
            return raw_notes

    def process_voice_log(self, audio_bytes: bytes, filename: str, client_date: Optional[str] = None) -> dict:
        """
        Uploads audio to Gemini 3.5 Flash, transcribes it, and extracts structured trade parameters.
        """
        import os
        import tempfile
        import json
        import datetime

        # Force a supported audio extension and MIME type.
        # Since the browser sends audio/webm containing Opus streams, we map it to .ogg 
        # and force the audio/ogg MIME type which is supported by Gemini.
        if filename.endswith(".webm"):
            filename = filename[:-5] + ".ogg"

        # Determine reference date
        if not client_date:
            client_date = datetime.date.today().strftime("%Y-%m-%d")

        print(f"[DEBUG] process_voice_log: Initializing voice log processing for file {filename}. Reference Date: {client_date}", flush=True)
        logger.info(f"Processing voice log {filename} of size {len(audio_bytes)} bytes. Reference Date: {client_date}")

        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        try:
            print(f"[DEBUG] process_voice_log: Writing {len(audio_bytes)} bytes to temporary file: {temp_path}", flush=True)
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
                
            print(f"[DEBUG] process_voice_log: Uploading audio file to Gemini Files API...", flush=True)
            logger.info("Uploading audio file to Gemini Files API...")
            uploaded_file = self.client.files.upload(
                file=temp_path,
                config=types.UploadFileConfig(
                    mime_type="audio/ogg"
                )
            )
            print(f"[DEBUG] process_voice_log: Gemini file upload completed successfully. Gemini Name: {uploaded_file.name}, MIME: {uploaded_file.mime_type}", flush=True)
            logger.info(f"Gemini file upload successful: {uploaded_file.name}")
            
            system_instruction = (
                "You are an expert trading assistant. Your task is to transcribe the user's voice log, "
                "and extract the structured trading parameters. "
                "Map conversational words to standard ticker symbols (e.g., 'Reliance' to 'RELIANCE', 'Nifty' to 'NIFTY'). "
                "Ensure direction is CALL/PUT for options, and BUY/SELL for stocks and futures. "
                f"Today's reference date is: {client_date}. "
                "Evaluate any relative date expressions (such as 'today', 'yesterday', 'last Monday') relative to this date."
            )
            
            prompt = (
                "Please transcribe this voice trading log, and extract the trade details into the response schema."
            )
            
            print(f"[DEBUG] process_voice_log: Sending request to Gemini (model: {self.model}) with response schema...", flush=True)
            logger.info("Sending request to Gemini model for transcription and structure extraction...")
            
            interaction = self.client.interactions.create(
                model="gemini-3.5-flash",
                input=[
                    {"type": "audio", "uri": uploaded_file.uri, "mime_type": uploaded_file.mime_type},
                    {"type": "text", "text": prompt}
                ],
                system_instruction=system_instruction,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": VoiceLogResponse.model_json_schema(),
                }
            )
            
            print(f"[DEBUG] process_voice_log: Gemini response received.", flush=True)
            
            try:
                print(f"[DEBUG] process_voice_log: Deleting uploaded file {uploaded_file.name} from Gemini...", flush=True)
                self.client.files.delete(name=uploaded_file.name)
                print(f"[DEBUG] process_voice_log: Successfully deleted file {uploaded_file.name} from Gemini.", flush=True)
            except Exception as delete_err:
                print(f"[ERROR] process_voice_log: Failed to delete uploaded file from Gemini: {delete_err}", flush=True)
                logger.error(f"Failed to delete uploaded file from Gemini: {delete_err}")
                
            raw_text = interaction.output_text
            
            if not raw_text and interaction.steps:
                last_step = interaction.steps[-1]
                if last_step.type == "model_output" and last_step.content:
                    raw_text = last_step.content[0].text
                    
            if raw_text:
                print(f"[DEBUG] process_voice_log: Raw response from Gemini: {raw_text}", flush=True)
                logger.info("Raw response from Gemini extracted successfully.")
                parsed_data = json.loads(raw_text)
                print(f"[DEBUG] process_voice_log: Successfully parsed JSON response from Gemini.", flush=True)
                return parsed_data
            else:
                raise ValueError("No response text received from Gemini.")
                
        except Exception as err:
            print(f"[ERROR] process_voice_log: Exception occurred during voice processing: {err}", flush=True)
            logger.error("Exception during process_voice_log", exc_info=True)
            raise err
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    print(f"[DEBUG] process_voice_log: Cleaned up temporary file: {temp_path}", flush=True)
                except Exception as rm_err:
                    print(f"[ERROR] process_voice_log: Failed to delete local temp file: {rm_err}", flush=True)

    def process_voice_journal(self, audio_bytes: bytes, filename: str, client_date: Optional[str] = None) -> dict:
        """
        Uploads audio to Gemini 3.5 Flash, transcribes it, and extracts the target journal date.
        """
        import os
        import tempfile
        import json
        import datetime

        # Force a supported audio extension and MIME type.
        if filename.endswith(".webm"):
            filename = filename[:-5] + ".ogg"

        # Determine reference date
        if not client_date:
            client_date = datetime.date.today().strftime("%Y-%m-%d")

        print(f"[DEBUG] process_voice_journal: Initializing voice journal processing for file {filename}. Reference Date: {client_date}", flush=True)

        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        try:
            print(f"[DEBUG] process_voice_journal: Writing {len(audio_bytes)} bytes to temporary file: {temp_path}", flush=True)
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
                
            print(f"[DEBUG] process_voice_journal: Uploading audio file to Gemini Files API...", flush=True)
            logger.info("Uploading audio file to Gemini Files API...")
            uploaded_file = self.client.files.upload(
                file=temp_path,
                config=types.UploadFileConfig(
                    mime_type="audio/ogg"
                )
            )
            print(f"[DEBUG] process_voice_journal: Gemini file upload completed successfully. Gemini Name: {uploaded_file.name}, MIME: {uploaded_file.mime_type}", flush=True)
            logger.info(f"Gemini file upload successful: {uploaded_file.name}")
            
            system_instruction = (
                "You are an expert trading assistant. Your task is to transcribe the user's spoken voice journal entry verbatim. "
                f"Today's reference date is: {client_date}. "
                "Evaluate any relative date expressions (such as 'today', 'yesterday', 'last Monday') in the spoken text relative to this date "
                "and populate the 'date' field in the schema. If no date is mentioned, default the 'date' field to the reference date."
            )
            
            prompt = (
                "Please transcribe this voice journal entry verbatim, and extract the date of the journal entry."
            )
            
            print(f"[DEBUG] process_voice_journal: Sending request to Gemini (model: {self.model}) with response schema...", flush=True)
            logger.info("Sending request to Gemini model for transcription and date extraction...")
            interaction = self.client.interactions.create(
                model="gemini-3.5-flash",
                input=[
                    {"type": "audio", "uri": uploaded_file.uri, "mime_type": uploaded_file.mime_type},
                    {"type": "text", "text": prompt}
                ],
                system_instruction=system_instruction,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": VoiceJournalResponse.model_json_schema(),
                }
            )
            
            print(f"[DEBUG] process_voice_journal: Gemini response received.", flush=True)
            
            try:
                print(f"[DEBUG] process_voice_journal: Deleting uploaded file {uploaded_file.name} from Gemini...", flush=True)
                self.client.files.delete(name=uploaded_file.name)
                print(f"[DEBUG] process_voice_journal: Successfully deleted file {uploaded_file.name} from Gemini.", flush=True)
            except Exception as delete_err:
                print(f"[ERROR] Failed to delete uploaded file from Gemini: {delete_err}", flush=True)
                logger.error(f"Failed to delete uploaded file from Gemini: {delete_err}")
                
            raw_text = interaction.output_text
            if not raw_text and interaction.steps:
                last_step = interaction.steps[-1]
                if last_step.type == "model_output" and last_step.content:
                    raw_text = last_step.content[0].text
                    
            if raw_text:
                print(f"[DEBUG] process_voice_journal: Raw response from Gemini: {raw_text}", flush=True)
                logger.info("Raw response from Gemini extracted successfully.")
                parsed_data = json.loads(raw_text)
                print(f"[DEBUG] process_voice_journal: Successfully parsed JSON response from Gemini.", flush=True)
                return parsed_data
            else:
                raise ValueError("No response text received from Gemini.")
                
        except Exception as err:
            print(f"[ERROR] process_voice_journal: Exception occurred during voice processing: {err}", flush=True)
            logger.error("Exception during process_voice_journal", exc_info=True)
            raise err
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    print(f"[DEBUG] process_voice_journal: Cleaned up temporary file: {temp_path}", flush=True)
                except Exception as rm_err:
                    print(f"[ERROR] process_voice_journal: Failed to delete local temp file: {rm_err}", flush=True)

    def transcribe_audio(self, audio_bytes: bytes, filename: str) -> str:
        """
        Uploads audio to Gemini, transcribes it verbatim, and returns raw text.
        """
        import os
        import tempfile

        if filename.endswith(".webm"):
            filename = filename[:-5] + ".ogg"

        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        try:
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
                
            uploaded_file = self.client.files.upload(
                file=temp_path,
                config=types.UploadFileConfig(
                    mime_type="audio/ogg"
                )
            )
            
            system_instruction = (
                "You are a precise audio transcription assistant. Transcribe the user's audio verbatim. "
                "Do not add any explanations, greetings, or formatting. Only return the exact transcribed text."
            )
            
            interaction = self.client.interactions.create(
                model="gemini-3.5-flash",
                input=[
                    {"type": "audio", "uri": uploaded_file.uri, "mime_type": uploaded_file.mime_type},
                    {"type": "text", "text": "Please transcribe this audio verbatim."}
                ],
                system_instruction=system_instruction
            )
            
            try:
                self.client.files.delete(name=uploaded_file.name)
            except Exception as delete_err:
                print(f"[ERROR] Failed to delete uploaded file from Gemini: {delete_err}")
                
            raw_text = interaction.output_text
            if not raw_text and interaction.steps:
                last_step = interaction.steps[-1]
                if last_step.type == "model_output" and last_step.content:
                    raw_text = last_step.content[0].text
                    
            return raw_text.strip() if raw_text else ""
            
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as rm_err:
                    print(f"[ERROR] Failed to delete local temp file: {rm_err}")

ai_service = AIService()
