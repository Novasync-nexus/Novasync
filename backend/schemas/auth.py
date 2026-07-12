from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class UserUpdate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
