import os
from fastapi import APIRouter, HTTPException, Depends
from backend.config import settings
from backend.utils.vector_store import get_pinecone_index
from backend.utils.security import get_current_user
from backend.db.models import User

router = APIRouter()

@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    """Lists all indexed documents by extracting unique source files from Pinecone."""
    try:
        index = get_pinecone_index()
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(current_user.id)},
            include_metadata=True
        )
        matches = results.get("matches", [])

        docs_map = {}
        for match in matches:
            meta = match.get("metadata", {})
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
    """Deletes a document from the filesystem and Pinecone."""
    try:
        index = get_pinecone_index()
        # Find all vector IDs for this document and user
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(current_user.id), "source_file": document_id},
            include_metadata=False
        )
        ids_to_delete = [m["id"] for m in results.get("matches", [])]
        if ids_to_delete:
            index.delete(ids=ids_to_delete)

        # Delete from filesystem
        file_path = os.path.join(settings.UPLOADS_DIR, f"user_{current_user.id}", document_id)
        if os.path.exists(file_path):
            os.remove(file_path)

        return {"message": f"Document {document_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

