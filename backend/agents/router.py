"""
Router Agent

Responsibilities:
- Understand user intent
- Decide if retrieval is needed
- Decide if web search is needed
- Route to the correct agent
"""
from backend.services.llm import LLMService

class RouterAgent:
    @staticmethod
    def route_query(question: str) -> str:
        prompt = f"""
        Analyze the following user query and determine the required action.
        Respond with EXACTLY ONE of the following words:
        - RETRIEVAL: If the query requires factual information, documents, or context.
        - WEB_SEARCH: If the query requires real-time information or external knowledge not likely in the knowledge base.
        - CONVERSATION: If the query is a simple greeting, chit-chat, or requires no external facts.
        
        Query: "{question}"
        Action:
        """
        response = LLMService.call(prompt, max_tokens=10, temperature=0.0)
        action = response.strip().upper()
        
        if "RETRIEVAL" in action:
            return "RETRIEVAL"
        elif "WEB" in action:
            return "WEB_SEARCH"
        else:
            return "CONVERSATION"
