import os
from backend.config.settings import settings
from backend.utils.vector_store import get_pinecone_index

class DocumentService:
    @staticmethod
    def list_documents(user_id: int):
        index = get_pinecone_index()
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(user_id)},
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
        return list(docs_map.values())

    @staticmethod
    def delete_document(user_id: int, document_id: str):
        index = get_pinecone_index()
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(user_id), "source_file": document_id},
            include_metadata=False
        )
        ids_to_delete = [m["id"] for m in results.get("matches", [])]
        if ids_to_delete:
            index.delete(ids=ids_to_delete)

        file_path = os.path.join(settings.UPLOADS_DIR, f"user_{user_id}", document_id)
        if os.path.exists(file_path):
            os.remove(file_path)
