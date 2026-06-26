import os
from typing import List, Dict
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
from cachetools import cached, TTLCache

from backend.utils.vector_store import get_chroma_client, get_collection

# Load models at module level so they are only loaded once
print("Loading retrieval models...")
embedder = SentenceTransformer("BAAI/bge-base-en-v1.5")
reranker = CrossEncoder("BAAI/bge-reranker-base")

# Simple memory cache for BM25 to avoid rebuilding it on every query
# In a real distributed system with 100k+ docs, consider Elasticsearch
bm25_cache = TTLCache(maxsize=100, ttl=300) # Cache for 5 mins for up to 100 users

@cached(bm25_cache)
def build_bm25_index(user_id: int):
    client = get_chroma_client()
    collection = get_collection(client)
    try:
        data = collection.get(where={"user_id": str(user_id)}, include=["documents", "metadatas", "ids"])
        docs = data.get("documents", [])
        metadatas = data.get("metadatas", [])
        ids = data.get("ids", [])
        
        tokenized_corpus = [doc.lower().split(" ") for doc in docs]
        bm25 = BM25Okapi(tokenized_corpus)
        return bm25, docs, metadatas, ids
    except Exception as e:
        print(f"Error building BM25 index: {e}")
        return None, [], [], []

def clear_bm25_cache():
    """Clear the cache, call this after reindexing."""
    bm25_cache.clear()

def hybrid_search(query: str, user_id: int, top_k: int = 20) -> List[Dict]:
    """Performs semantic search + BM25, then reranks with a cross-encoder."""
    client = get_chroma_client()
    collection = get_collection(client)
    
    # 1. Semantic Search
    query_embedding = embedder.encode(query).tolist()
    semantic_results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": str(user_id)},
        include=["documents", "metadatas"]
    )
    
    semantic_docs = semantic_results["documents"][0] if semantic_results["documents"] else []
    semantic_metadatas = semantic_results["metadatas"][0] if semantic_results["metadatas"] else []
    
    # 2. BM25 Search
    bm25, all_docs, all_metadatas, all_ids = build_bm25_index(user_id)
    bm25_docs = []
    bm25_metadatas = []
    if bm25 and all_docs:
        tokenized_query = query.lower().split(" ")
        doc_scores = bm25.get_scores(tokenized_query)
        top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]
        
        bm25_docs = [all_docs[i] for i in top_indices]
        bm25_metadatas = [all_metadatas[i] for i in top_indices]

    # 3. Merge Results (Remove duplicates based on chunk_id)
    merged_results = {}
    
    for doc, meta in zip(semantic_docs, semantic_metadatas):
        if meta and meta.get("chunk_id"):
             merged_results[meta["chunk_id"]] = {"document": doc, "metadata": meta}
             
    for doc, meta in zip(bm25_docs, bm25_metadatas):
        if meta and meta.get("chunk_id") and meta["chunk_id"] not in merged_results:
             merged_results[meta["chunk_id"]] = {"document": doc, "metadata": meta}

    combined_list = list(merged_results.values())
    
    if not combined_list:
        return []

    # 4. Cross-Encoder Reranking
    cross_input = [[query, item["document"]] for item in combined_list]
    scores = reranker.predict(cross_input)
    
    # Attach scores and sort
    for i, item in enumerate(combined_list):
        item["score"] = float(scores[i])
        
    reranked_results = sorted(combined_list, key=lambda x: x["score"], reverse=True)
    
    # 5. Return top 5
    return reranked_results[:5]
