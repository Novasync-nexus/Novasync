from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.db_models import User
from backend.utils.security import get_current_user
from backend.schemas.session import SessionCreate, MessageCreate
from backend.services.chat_session import ChatSessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("")
async def get_sessions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ChatSessionService.get_sessions(db, user.id)

@router.post("")
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ChatSessionService.create_session(db, user.id, data)

@router.put("/{session_id}")
async def rename_session(session_id: int, data: SessionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ChatSessionService.rename_session(db, user.id, session_id, data)

@router.delete("/{session_id}")
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ChatSessionService.delete_session(db, user.id, session_id)

@router.post("/{session_id}/messages")
async def add_message(session_id: int, msg: MessageCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ChatSessionService.add_message(db, user.id, session_id, msg)
