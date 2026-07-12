from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from datetime import timedelta
from backend.models.db_models import User
from backend.utils.security import get_password_hash, verify_password, create_access_token
from backend.config.settings import settings
from backend.schemas.auth import UserCreate, UserUpdate

class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, user_data: UserCreate):
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = User(
            email=user_data.email, 
            username=user_data.username, 
            hashed_password=get_password_hash(user_data.password)
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str):
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return access_token
    
    @staticmethod
    async def update_user(db: AsyncSession, user: User, data: UserUpdate):
        user.username = data.username
        await db.commit()
        await db.refresh(user)
        return user
