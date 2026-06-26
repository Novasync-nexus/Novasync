import os
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.ingestion.ingest import ingest_documents
from backend.utils.security import get_current_user
from backend.db.models import User

router = APIRouter()

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    uploads_dir = os.path.join(settings.UPLOADS_DIR, f"user_{current_user.id}")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        
    file_path = os.path.join(uploads_dir, file.filename)
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Trigger reindexing in the background
        background_tasks.add_task(ingest_documents, current_user.id)
        
        return JSONResponse(status_code=200, content={"message": f"Successfully uploaded {file.filename} and queued for indexing."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex")
async def trigger_reindex(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    background_tasks.add_task(ingest_documents, current_user.id)
    return {"message": "Reindexing started in the background."}
