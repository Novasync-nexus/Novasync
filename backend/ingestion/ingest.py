import os
import hashlib
import sys
import uuid
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from backend.config import settings
from backend.ingestion.loaders import load_document
from backend.utils.vector_store import get_pinecone_index

print("Loading embedding model BAAI/bge-base-en-v1.5...")
embedder = SentenceTransformer("BAAI/bge-base-en-v1.5")

def get_file_hash(file_path: str) -> str:
    """Computes SHA256 of a file."""
    hasher = hashlib.sha256()
    if file_path.startswith("http://") or file_path.startswith("https://"):
        hasher.update(file_path.encode('utf-8'))
        return hasher.hexdigest()
    if not os.path.exists(file_path):
        return ""
    with open(file_path, 'rb') as f:
        hasher.update(f.read())
    return hasher.hexdigest()

def compute_chunk_hash(text: str, document_id: str) -> str:
    """Computes a unique hash for a chunk based on its text and source document."""
    hasher = hashlib.sha256()
    hasher.update((text + document_id).encode('utf-8'))
    return hasher.hexdigest()

def ingest_documents(user_id: int = None):
    """Main ingestion pipeline using Pinecone."""
    if user_id is None:
        print("Warning: ingest_documents called without user_id")
        return

    uploads_dir = os.path.join(settings.UPLOADS_DIR, f"user_{user_id}")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    index = get_pinecone_index()

    # Fetch all existing vectors for this user
    try:
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(user_id)},
            include_metadata=True
        )
        existing_vectors = results.get("matches", [])
    except Exception as e:
        print(f"Error fetching existing vectors: {e}")
        existing_vectors = []

    existing_chunk_hashes = {v["metadata"].get("sha256_hash"): v["id"] for v in existing_vectors if v.get("metadata")}
    indexed_files = set(v["metadata"].get("source_file") for v in existing_vectors if v.get("metadata"))

    current_files = []
    for root, _, files in os.walk(uploads_dir):
        for file in files:
            current_files.append(os.path.join(root, file))

    current_file_names = set(os.path.basename(f) for f in current_files)

    # Note: We no longer delete vectors based on missing files in the uploads dir.
    # Ephemeral hosts (like Koyeb) will clear the uploads dir on restart.
    # Deletion is now handled explicitly by the DELETE /documents endpoint.

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200, length_function=len, is_separator_regex=False
    )

    # 2. Upsert new chunks
    new_chunks_count = 0
    batch = []
    for file_path in current_files:
        filename = os.path.basename(file_path)
        document_id = get_file_hash(file_path)
        pages = load_document(file_path)
        if not pages:
            continue

        for page in pages:
            chunks = text_splitter.split_text(page["text"])
            for chunk in chunks:
                chunk_hash = compute_chunk_hash(chunk, document_id)
                if chunk_hash in existing_chunk_hashes:
                    continue

                print(f"Embedding new chunk for {filename} (page {page['page_number']})...")
                embedding = embedder.encode(chunk).tolist()
                chunk_id = str(uuid.uuid4())
                metadata = {
                    "document_id": document_id,
                    "source_file": filename,
                    "page_number": str(page["page_number"]),
                    "upload_date": datetime.now().isoformat(),
                    "chunk_id": chunk_id,
                    "sha256_hash": chunk_hash,
                    "document_type": os.path.splitext(filename)[1].lower(),
                    "user_id": str(user_id),
                    "text": chunk  # store text in metadata for BM25
                }
                batch.append({"id": chunk_id, "values": embedding, "metadata": metadata})
                new_chunks_count += 1

                if len(batch) >= 100:
                    index.upsert(vectors=batch)
                    batch = []

    if batch:
        index.upsert(vectors=batch)

    # Clean up the raw files to save disk space and prevent re-processing
    for file_path in current_files:
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Warning: Could not delete raw file {file_path}: {e}")

    print(f"Ingestion complete. Added {new_chunks_count} new chunks. Cleaned up raw files.")

if __name__ == "__main__":
    ingest_documents()

