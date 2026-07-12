"""
Summary Agent

Responsibilities:
- Summarize long conversations
"""
import logging
from backend.services.llm import LLMService

logger = logging.getLogger(__name__)

class SummaryAgent:
    @staticmethod
    def summarize_conversation(conversation_text: str) -> str:
        """
        Takes a long conversation string and condenses it for context efficiency.
        """
        if not conversation_text or len(conversation_text) < 500:
            return conversation_text
            
        prompt = f"""
        Summarize the following conversation history concisely, retaining all key facts, decisions, and context.
        
        Conversation:
        {conversation_text}
        
        Summary:
        """
        return LLMService.call(prompt, max_tokens=300, temperature=0.1)
