"""
Memory Agent

Responsibilities:
- Conversation memory
- Long-term memory
- Short-term memory
"""
import logging
from sqlalchemy.orm import Session
from backend.models.db_models import ChatSession

logger = logging.getLogger(__name__)

class MemoryAgent:
    @staticmethod
    def get_conversation_history(session_id: int, db: Session, limit: int = 5) -> str:
        """
        Fetches short-term memory (recent conversation turns).
        """
        if not session_id or not db:
            return ""
            
        try:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session or not session.messages:
                return ""
            
            # Get last N messages
            recent = session.messages[-limit:]
            history_lines = []
            for msg in recent:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_lines.append(f"{role}: {msg.get('content')}")
                
            return "\n".join(history_lines)
        except Exception as e:
            logger.error(f"MemoryAgent error: {e}")
            return ""
            
    @staticmethod
    def update_long_term_memory(user_id: int, info: str):
        """
        Placeholder for extracting and storing long-term facts about a user.
        """
        pass
