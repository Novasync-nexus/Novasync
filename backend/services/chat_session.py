from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from backend.models.db_models import ChatSession, ChatMessage
from backend.schemas.session import SessionCreate, MessageCreate

class ChatSessionService:
    @staticmethod
    async def get_sessions(db: AsyncSession, user_id: int):
        result = await db.execute(select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()))
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

    @staticmethod
    async def create_session(db: AsyncSession, user_id: int, data: SessionCreate):
        new_session = ChatSession(user_id=user_id, name=data.name)
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        return {"id": new_session.id, "name": new_session.name, "messages": []}

    @staticmethod
    async def rename_session(db: AsyncSession, user_id: int, session_id: int, data: SessionCreate):
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        session.name = data.name
        await db.commit()
        return {"status": "ok"}

    @staticmethod
    async def delete_session(db: AsyncSession, user_id: int, session_id: int):
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        await db.delete(session)
        await db.commit()
        return {"status": "ok"}

    @staticmethod
    async def add_message(db: AsyncSession, user_id: int, session_id: int, msg: MessageCreate):
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        new_msg = ChatMessage(session_id=session.id, role=msg.role, content=msg.content, sources=msg.sources)
        db.add(new_msg)
        await db.commit()
        return {"status": "ok"}
