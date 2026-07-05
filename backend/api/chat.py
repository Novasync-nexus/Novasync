from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json

from backend.retrievers.hybrid import hybrid_search
from backend.models.groq_llm import generate_rag_response_stream
from backend.utils.security import get_current_user
from backend.db.models import User
from fastapi import Depends

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = []

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        # Retrieve top 5 chunks (hybrid search handles the 20 -> 5 reranking)
        top_chunks = hybrid_search(request.question, user_id=current_user.id, top_k=20)
        
        # Build context
        context = "\n\n".join([chunk["document"] for chunk in top_chunks])
        
        # Extract sources
        sources = []
        for chunk in top_chunks:
            meta = chunk["metadata"]
            sources.append({
                "file": meta.get("source_file", "unknown"),
                "page": meta.get("page_number", "1")
            })
        
        # Deduplicate sources while preserving order
        seen = set()
        unique_sources = []
        for s in sources:
            identifier = f"{s['file']}_{s['page']}"
            if identifier not in seen:
                seen.add(identifier)
                unique_sources.append(s)

        def generate():
            # Stream the text chunks
            for text_chunk in generate_rag_response_stream(request.question, context, current_user.username):
                yield json.dumps({"type": "chunk", "content": text_chunk}) + "\n"
            
            # Send the sources at the end
            yield json.dumps({"type": "sources", "content": unique_sources}) + "\n"

        return StreamingResponse(generate(), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
