"""
Evaluator Agent

Responsibilities:
- Evaluate RAG responses against 8 key metrics.
- Store results in the database.
"""
import json
import logging
from backend.services.llm import LLMService
from backend.models.db_models import RAGEvaluation
from backend.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class EvaluatorAgent:
    @staticmethod
    async def evaluate_and_store(user_id: int, question: str, answer: str, context: str):
        """
        Runs a comprehensive evaluation asynchronously and stores the result.
        """
        prompt = f"""
        You are a strict RAG evaluation system. Evaluate the following response across 8 metrics.
        Provide a score from 0 to 10 for each metric, where 10 is the best (even for hallucination, 10 means NO hallucination).
        
        Question: {question}
        Context: {context}
        Answer: {answer}
        
        Return ONLY a JSON object with the following keys, containing integer scores (0-10):
        "faithfulness", "context_precision", "context_recall", "answer_relevance", 
        "hallucination_score", "groundedness", "response_completeness", "citation_accuracy"
        """
        try:
            res = LLMService.call(prompt, max_tokens=200, temperature=0.0)
            # Find the JSON block
            import re
            json_str = re.search(r'\{.*\}', res, re.DOTALL)
            if json_str:
                scores = json.loads(json_str.group(0))
            else:
                scores = json.loads(res)
                
            async with AsyncSessionLocal() as session:
                evaluation = RAGEvaluation(
                    user_id=user_id,
                    question=question,
                    answer=answer,
                    context_used=context,
                    faithfulness=scores.get("faithfulness", 0),
                    context_precision=scores.get("context_precision", 0),
                    context_recall=scores.get("context_recall", 0),
                    answer_relevance=scores.get("answer_relevance", 0),
                    hallucination_score=scores.get("hallucination_score", 0),
                    groundedness=scores.get("groundedness", 0),
                    response_completeness=scores.get("response_completeness", 0),
                    citation_accuracy=scores.get("citation_accuracy", 0)
                )
                session.add(evaluation)
                await session.commit()
                logger.info(f"Evaluation stored successfully for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to evaluate and store metrics: {e}")
