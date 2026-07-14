from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from backend.core.database import get_db
from backend.models.db_models import User
from backend.utils.security import get_current_user
from backend.schemas.auth import UserCreate, UserUpdate, UserResponse, Token
from backend.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await AuthService.register_user(db, user_data)

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    access_token = await AuthService.authenticate_user(db, form_data.username, form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}

from backend.schemas.auth import GoogleToken

@router.post("/google", response_model=Token)
async def login_with_google(token_data: GoogleToken, db: AsyncSession = Depends(get_db)):
    access_token = await AuthService.authenticate_google_user(db, token_data.token)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_users_me(data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await AuthService.update_user(db, current_user, data)
