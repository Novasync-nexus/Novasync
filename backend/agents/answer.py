"""
Answer Agent

Responsibilities:
- Generate grounded answers only
"""
from typing import Generator
from backend.services.llm import LLMService

class AnswerAgent:
    @staticmethod
    def generate_answer_stream(question: str, context: str, history: str = "", username: str = "Guest") -> Generator:
        """
        Synthesizes a response using the LLM Service based on context and memory history.
        """
        # Inject memory if available
        if history:
            context = f"--- CONVERSATION HISTORY ---\n{history}\n\n--- DOCUMENT CONTEXT ---\n{context}"
            
        return LLMService.generate_rag_response_stream(question, context, username)
