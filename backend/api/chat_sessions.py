from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from pydantic import BaseModel
from typing import List, Optional, Any
from backend.db.database import get_db
from backend.db.models import ChatSession, ChatMessage, User
from backend.utils.security import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])

class MessageCreate(BaseModel):
    role: str
    content: str
    sources: Optional[Any] = None

class SessionCreate(BaseModel):
    name: str

class SessionResponse(BaseModel):
    id: int
    name: str
    messages: List[dict] = []

@router.get("/")
async def get_sessions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(ChatSession).where(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc()))
    sessions = result.scalars().all()
    resp = []
    for s in sessions:
        msgs_result = await db.execute(select(ChatMessage).where(ChatMessage.session_id == s.id).order_by(ChatMessage.created_at.asc()))
        msgs = msgs_result.scalars().all()
        resp.append({
            "id": s.id,
            "name": s.name,
            "messages": [{"role": m.role, "content": m.content, "sources": m.sources} for m in msgs]
        })
    return resp

@router.post("/")
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    new_session = ChatSession(user_id=user.id, name=data.name)
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {"id": new_session.id, "name": new_session.name, "messages": []}

@router.put("/{session_id}")
async def rename_session(session_id: int, data: SessionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.name = data.name
    await db.commit()
    return {"status": "ok"}

@router.delete("/{session_id}")
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return {"status": "ok"}

@router.post("/{session_id}/messages")
async def add_message(session_id: int, msg: MessageCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    new_msg = ChatMessage(session_id=session.id, role=msg.role, content=msg.content, sources=msg.sources)
    db.add(new_msg)
    await db.commit()
    return {"status": "ok"}
