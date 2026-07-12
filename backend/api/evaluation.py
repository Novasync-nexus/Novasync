from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.models.db_models import User, RAGEvaluation
from backend.utils.security import get_current_user

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

@router.get("")
async def get_evaluations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns all evaluation results for the current user (for dashboard integration).
    """
    result = await db.execute(
        select(RAGEvaluation)
        .where(RAGEvaluation.user_id == current_user.id)
        .order_by(RAGEvaluation.created_at.desc())
    )
    evals = result.scalars().all()
    return evals

@router.get("/summary")
async def get_evaluation_summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns aggregated metrics for the dashboard.
    """
    result = await db.execute(
        select(RAGEvaluation).where(RAGEvaluation.user_id == current_user.id)
    )
    evals = result.scalars().all()
    
    if not evals:
        return {}
        
    metrics = ["faithfulness", "context_precision", "context_recall", "answer_relevance", 
               "hallucination_score", "groundedness", "response_completeness", "citation_accuracy"]
    
    summary = {m: sum(getattr(e, m) for e in evals) / len(evals) for m in metrics}
    summary["total_evaluations"] = len(evals)
    
    return summary
