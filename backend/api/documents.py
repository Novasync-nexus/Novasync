import os
from fastapi import APIRouter, HTTPException, Depends
from backend.config import settings
from backend.utils.vector_store import get_chroma_client, get_collection
from backend.utils.security import get_current_user
from backend.db.models import User

router = APIRouter()

@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    """Lists all indexed documents by extracting unique source files from ChromaDB."""
    try:
        client = get_chroma_client()
        collection = get_collection(client)
        data = collection.get(where={"user_id": str(current_user.id)}, include=["metadatas"])
        metadatas = data.get("metadatas", [])
        
        docs_map = {}
        for meta in metadatas:
            if meta:
                source = meta.get("source_file")
                if source and source not in docs_map:
                    docs_map[source] = {
                        "id": source,
                        "name": source,
                        "type": meta.get("document_type"),
                        "upload_date": meta.get("upload_date")
                    }
        return {"documents": list(docs_map.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    """Deletes a document from the filesystem and ChromaDB."""
    try:
        # Delete from ChromaDB
        client = get_chroma_client()
        collection = get_collection(client)
        collection.delete(where={"$and": [{"source_file": document_id}, {"user_id": str(current_user.id)}]})
        
        # Delete from filesystem
        file_path = os.path.join(settings.UPLOADS_DIR, f"user_{current_user.id}", document_id)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"message": f"Document {document_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
