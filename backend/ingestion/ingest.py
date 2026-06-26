import os
import hashlib
import sys
import uuid
from datetime import datetime

# Add the root project path to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from backend.config import settings
from backend.ingestion.loaders import load_document
from backend.utils.vector_store import get_chroma_client, get_collection

# Load the embedding model
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
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def compute_chunk_hash(text: str, document_id: str) -> str:
    """Computes a unique hash for a chunk based on its text and source document."""
    hasher = hashlib.sha256()
    hasher.update((text + document_id).encode('utf-8'))
    return hasher.hexdigest()

def ingest_documents(user_id: int = None):
    """Main ingestion pipeline."""
    if user_id is None:
        print("Warning: ingest_documents called without user_id")
        return
        
    uploads_dir = os.path.join(settings.UPLOADS_DIR, f"user_{user_id}")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    client = get_chroma_client()
    collection = get_collection(client)

    # Get all current files in the uploads directory
    current_files = []
    for root, _, files in os.walk(uploads_dir):
        for file in files:
            current_files.append(os.path.join(root, file))

    # Text splitter setup
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )

    try:
        existing_data = collection.get(where={"user_id": str(user_id)}, include=["metadatas"])
        existing_metadatas = existing_data.get("metadatas", [])
        existing_ids = existing_data.get("ids", [])
    except Exception as e:
        print(f"Error fetching existing data: {e}")
        existing_metadatas = []
        existing_ids = []

    # Map existing hashes to avoid re-embedding
    existing_chunk_hashes = {meta.get("sha256_hash"): doc_id for meta, doc_id in zip(existing_metadatas, existing_ids) if meta}
    indexed_files = set([meta.get("source_file") for meta in existing_metadatas if meta])

    current_file_names = set([os.path.basename(f) for f in current_files])
    
    # 1. Delete removed files from Chroma
    files_to_delete = indexed_files - current_file_names
    for file_to_del in files_to_delete:
        print(f"Deleting removed file vectors: {file_to_del}")
        collection.delete(where={"$and": [{"source_file": file_to_del}, {"user_id": str(user_id)}]})

    # 2. Process current files
    new_chunks_count = 0
    for file_path in current_files:
        filename = os.path.basename(file_path)
        doc_hash = get_file_hash(file_path)
        document_id = doc_hash
        
        # Load document
        pages = load_document(file_path)
        if not pages:
            continue

        for page in pages:
            text = page["text"]
            page_number = page["page_number"]
            chunks = text_splitter.split_text(text)

            for i, chunk in enumerate(chunks):
                chunk_hash = compute_chunk_hash(chunk, document_id)
                
                # Check if chunk already exists
                if chunk_hash in existing_chunk_hashes:
                    continue # Skip

                # Need to embed and insert
                print(f"Embedding new chunk for {filename} (page {page_number})...")
                embedding = embedder.encode(chunk).tolist()
                chunk_id = str(uuid.uuid4())
                
                metadata = {
                    "document_id": document_id,
                    "source_file": filename,
                    "page_number": str(page_number),
                    "upload_date": datetime.now().isoformat(),
                    "chunk_id": chunk_id,
                    "sha256_hash": chunk_hash,
                    "document_type": os.path.splitext(filename)[1].lower(),
                    "user_id": str(user_id)
                }

                collection.add(
                    ids=[chunk_id],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[metadata]
                )
                new_chunks_count += 1
                
    print(f"Ingestion complete. Added {new_chunks_count} new chunks.")

if __name__ == "__main__":
    ingest_documents()
