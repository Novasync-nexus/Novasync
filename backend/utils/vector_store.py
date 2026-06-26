import chromadb
from chromadb.config import Settings
from backend.config import settings

def get_chroma_client():
    """Returns a persistent ChromaDB client."""
    client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
    return client

def get_collection(client, collection_name="documents"):
    """Gets or creates the ChromaDB collection."""
    # We are using sentence-transformers externally, so we don't need a Chroma embedding function
    # We will pass the embeddings directly.
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"} # Use cosine similarity
    )
    return collection
