from pinecone import Pinecone, ServerlessSpec
from backend.config import settings

_pinecone_client = None
_pinecone_index = None

def get_pinecone_index():
    """Returns a connected Pinecone Index, creating it if it doesn't exist."""
    global _pinecone_client, _pinecone_index
    if _pinecone_index is not None:
        return _pinecone_index

    _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)

    existing_indexes = [i.name for i in _pinecone_client.list_indexes()]
    if settings.PINECONE_INDEX_NAME not in existing_indexes:
        print(f"Creating Pinecone index '{settings.PINECONE_INDEX_NAME}'...")
        _pinecone_client.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=768,  # BAAI/bge-base-en-v1.5 outputs 768-dim vectors
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        print("Index created successfully.")

    _pinecone_index = _pinecone_client.Index(settings.PINECONE_INDEX_NAME)
    return _pinecone_index
