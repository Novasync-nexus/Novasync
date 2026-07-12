"""
Orchestrator

Responsibilities:
- Manage the DAG of independent agents.
- Replace the monolith ChatService.
"""
import json
import logging
from typing import Generator

from backend.agents.router import RouterAgent
from backend.agents.retrieval import RetrievalAgent
from backend.agents.answer import AnswerAgent
from backend.agents.citation import CitationAgent
from backend.agents.memory import MemoryAgent
from backend.agents.reflection import ReflectionAgent
from backend.agents.evaluator import EvaluatorAgent

logger = logging.getLogger(__name__)

class Orchestrator:
    @staticmethod
    def process_chat(question: str, user_id: int, username: str) -> tuple[Generator, list[dict]]:
        """
        Coordinates the multi-agent pipeline.
        Returns a generator yielding NDJSON events and a list of eager sources.
        """
        
        # 1. Router Agent
        intent = RouterAgent.route_query(question)
        logger.info(f"Router Agent determined intent: {intent}")
        
        # We process based on intent, but for this RAG pipeline we assume
        # RETRIEVAL is standard. If CONVERSATION, we skip retrieval.
        context = ""
        source_map = {}
        eager_sources = []
        
        if intent in ("RETRIEVAL", "WEB_SEARCH"):
            # 2. Retrieval Agent (assuming web search routes via hybrid search plugin internally)
            context, source_map, eager_sources = RetrievalAgent.retrieve_context(question, user_id)
        
        # 3. Memory Agent 
        # (Assuming no active DB session here directly; usually passed via route, 
        # but for compatibility with existing UI, we omit DB memory fetch in this step 
        # unless session state is provided).
        history = ""

        # 4. Answer Agent (Streaming)
        def generate() -> Generator:
            full_response = []
            
            # 4. Answer Agent generating stream
            for chunk in AnswerAgent.generate_answer_stream(question, context, history, username):
                full_response.append(chunk)
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"
                
            complete_response = "".join(full_response)
            
            # 5. Reflection Agent (Optional: In a streaming setup, reflection can only run 
            # post-generation to flag issues asynchronously or re-generate if needed, 
            # but we omit blocking the stream here to preserve UI responsiveness).
            
            # 6. Citation Agent
            if source_map:
                cited = CitationAgent.extract_cited_sources(complete_response, source_map)
                final_sources = cited if cited else eager_sources
            else:
                final_sources = []
                
            yield json.dumps({"type": "sources", "content": final_sources}) + "\n"

            # 7. Evaluation Agent (Run asynchronously in background)
            import threading
            import asyncio
            
            def run_eval():
                asyncio.run(EvaluatorAgent.evaluate_and_store(
                    user_id=user_id,
                    question=question,
                    answer=complete_response,
                    context=context
                ))
            
            threading.Thread(target=run_eval, daemon=True).start()

        return generate, eager_sources
