from pydantic import BaseModel
from typing import List, Optional, Any

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
