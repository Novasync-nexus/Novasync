import os
from fastapi import UploadFile
from backend.config.settings import settings

class UploadService:
    @staticmethod
    async def save_upload_file(file: UploadFile, user_id: int) -> str:
        uploads_dir = os.path.join(settings.UPLOADS_DIR, f"user_{user_id}")
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
            
        file_path = os.path.join(uploads_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        return file.filename
