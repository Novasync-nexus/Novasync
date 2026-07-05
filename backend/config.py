from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    SECRET_KEY: str = "supersecretkey12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOADS_DIR: str = "../uploads"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/rag_db"
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "nexus-docs"

    class Config:
        env_file = ".env"

settings = Settings()

