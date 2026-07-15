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
    async def authenticate_google_user(db: AsyncSession, token: str):
        import httpx

        try:
            # useGoogleLogin returns an access token, so we fetch the user's profile from Google
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
            if response.status_code != 200:
                raise ValueError("Invalid Google access token")
                
            idinfo = response.json()
            
            email = idinfo.get("email")
            name = idinfo.get("name")
            
            if not email:
                raise ValueError("Email not provided by Google")
                
            # Check if user exists
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalars().first()
            
            if not user:
                # Create a new user since they don't exist
                user = User(
                    email=email,
                    username=name,
                    hashed_password="OAUTH_LOGIN_NO_PASSWORD" # Mark as OAuth user
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                
            # Create access token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            return access_token
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google authentication failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    async def update_user(db: AsyncSession, user: User, data: UserUpdate):
        user.username = data.username
        await db.commit()
        await db.refresh(user)
        return user
