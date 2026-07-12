from fastapi import APIRouter, HTTPException, Depends
from backend.utils.security import get_current_user
from backend.models.db_models import User
from backend.services.document import DocumentService

router = APIRouter()

@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    try:
        documents = DocumentService.list_documents(current_user.id)
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    try:
        DocumentService.delete_document(current_user.id, document_id)
        return {"message": f"Document {document_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
