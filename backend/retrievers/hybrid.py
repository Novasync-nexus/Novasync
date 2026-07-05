import os
from typing import List, Dict
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
from cachetools import cached, TTLCache

from backend.utils.vector_store import get_pinecone_index

print("Loading retrieval models...")
embedder = SentenceTransformer("BAAI/bge-base-en-v1.5")
reranker = CrossEncoder("BAAI/bge-reranker-base")

bm25_cache = TTLCache(maxsize=100, ttl=300)

@cached(bm25_cache)
def build_bm25_index(user_id: int):
    """Fetch all text chunks for a user from Pinecone for BM25 indexing."""
    index = get_pinecone_index()
    try:
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            filter={"user_id": str(user_id)},
            include_metadata=True
        )
        matches = results.get("matches", [])
        docs = [m["metadata"].get("text", "") for m in matches]
        metadatas = [m["metadata"] for m in matches]
        ids = [m["id"] for m in matches]
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
    index = get_pinecone_index()

    # 1. Semantic Search via Pinecone
    query_embedding = embedder.encode(query).tolist()
    semantic_results = index.query(
        vector=query_embedding,
        top_k=top_k,
        filter={"user_id": str(user_id)},
        include_metadata=True
    )
    semantic_matches = semantic_results.get("matches", [])
    semantic_docs = [m["metadata"].get("text", "") for m in semantic_matches]
    semantic_metadatas = [m["metadata"] for m in semantic_matches]

    # 2. BM25 Search
    bm25, all_docs, all_metadatas, all_ids = build_bm25_index(user_id)
    bm25_docs, bm25_metadatas = [], []
    if bm25 and all_docs:
        tokenized_query = query.lower().split(" ")
        doc_scores = bm25.get_scores(tokenized_query)
        top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]
        bm25_docs = [all_docs[i] for i in top_indices]
        bm25_metadatas = [all_metadatas[i] for i in top_indices]

    # 3. Merge Results
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
    for i, item in enumerate(combined_list):
        item["score"] = float(scores[i])

    reranked_results = sorted(combined_list, key=lambda x: x["score"], reverse=True)
    return reranked_results[:5]


