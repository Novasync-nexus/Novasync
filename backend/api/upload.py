from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from backend.services.upload import UploadService
from backend.services.embeddings import EmbeddingsService
from backend.utils.security import get_current_user
from backend.models.db_models import User

router = APIRouter()

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        filename = await UploadService.save_upload_file(file, current_user.id)
        # Trigger reindexing in the background
        background_tasks.add_task(EmbeddingsService.ingest_documents, current_user.id)
        return JSONResponse(status_code=200, content={"message": f"Successfully uploaded {filename} and queued for indexing."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex")
async def trigger_reindex(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    background_tasks.add_task(EmbeddingsService.ingest_documents, current_user.id)
    return {"message": "Reindexing started in the background."}
