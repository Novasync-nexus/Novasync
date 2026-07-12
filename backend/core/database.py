import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.config.settings import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg does not support the pgbouncer argument in the URL
if "?pgbouncer=true" in db_url:
    db_url = db_url.replace("?pgbouncer=true", "")
if "&pgbouncer=true" in db_url:
    db_url = db_url.replace("&pgbouncer=true", "")

# Disable statement cache because Supabase pgbouncer (transaction mode)
# does not support prepared statements.
engine = create_async_engine(db_url, echo=False, connect_args={"statement_cache_size": 0})
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
