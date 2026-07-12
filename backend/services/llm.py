"""
LLM Service — all Groq API calls are centralised here.

Two modes:
  - call()                     synchronous, returns full text (used for
                               query rewriting, context compression tasks)
  - generate_rag_response_stream()  streaming generator (used for the main
                               chat response)

Keeping both modes in one service ensures we never have multiple Groq
clients scattered across the codebase.
"""

import logging
from groq import Groq
from backend.config.settings import settings
from backend.prompts.llm_prompts import PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

# Single shared client — initialised once at import time.
client = Groq(api_key=settings.GROQ_API_KEY)

# Model used for all calls.  Change here to switch globally.
GROQ_MODEL = "llama-3.3-70b-versatile"

# Smaller / faster model for lightweight utility tasks (query rewriting,
# compression) so we don't burn tokens on the heavyweight model.
GROQ_FAST_MODEL = "llama-3.1-8b-instant"


class LLMService:
    # ------------------------------------------------------------------
    # Synchronous call — used for short utility prompts
    # ------------------------------------------------------------------
    @staticmethod
    def call(prompt: str, max_tokens: int = 256, temperature: float = 0.0) -> str:
        """
        Blocking LLM call.  Returns the full response as a string.

        Args:
            prompt:      The complete prompt to send.
            max_tokens:  Upper bound on response length.
            temperature: 0.0 = deterministic; higher = more creative.

        Returns:
            The model's text response, stripped of surrounding whitespace.
            On error, returns an empty string so callers degrade gracefully.
        """
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set; skipping LLM call.")
            return ""
        try:
            response = client.chat.completions.create(
                model=GROQ_FAST_MODEL,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            logger.error("LLMService.call failed: %s", exc)
            return ""

    # ------------------------------------------------------------------
    # Streaming generator — used for the main chat response
    # ------------------------------------------------------------------
    @staticmethod
    def generate_rag_response_stream(
        question: str,
        context: str,
        username: str | None = None,
    ):
        """
        Streams the RAG answer token by token.

        Yields:
            str: individual text delta chunks from the model.

        On configuration error or API failure, yields a single error message
        chunk so the frontend always receives something meaningful.
        """
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
            yield (
                "⚠️ **Error:** Add a valid Groq API key to the `.env` file "
                "and restart the backend server."
            )
            return

        name = username if username else "Guest"
        prompt = PROMPT_TEMPLATE.format(
            context=context, question=question, username=name
        )

        try:
            stream = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                temperature=0.3,
                max_tokens=1024,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:
            logger.error("LLMService.generate_rag_response_stream failed: %s", exc)
            yield f"⚠️ **Error from Groq API:** {exc}"
