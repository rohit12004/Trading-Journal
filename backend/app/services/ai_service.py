from google import genai
from app.config import settings

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

ai_service = AIService()
