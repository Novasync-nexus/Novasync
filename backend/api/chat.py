from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from fastapi import Depends

from backend.schemas.chat import ChatRequest
from backend.agents.orchestrator import Orchestrator
from backend.utils.security import get_current_user
from backend.models.db_models import User

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        generate_fn, unique_sources = Orchestrator.process_chat(request.question, current_user.id, current_user.username)
        return StreamingResponse(generate_fn(), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
