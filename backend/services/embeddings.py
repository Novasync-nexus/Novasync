"""
EmbeddingsService — document ingestion pipeline.

Pipeline per file:
  1. Load raw pages via loaders.py
  2. Extract metadata (section headers, word count, position)
  3. Split into PARENT chunks (wide context, stored in metadata only)
  4. Split each parent into CHILD chunks (narrow, what gets embedded)
  5. Encode child chunks with BGE embedder
  6. Upsert to Pinecone with full provenance metadata
  7. Clean up the temp upload file

The parent-child split follows the "Parent Document Retriever" pattern:
  - Child chunks are retrieved (small = precise cosine similarity)
  - The full parent text is stored in metadata so the context builder can
    expand each hit to its surrounding passage before sending to the LLM.
"""

import os
import re
import hashlib
import uuid
import logging
from datetime import datetime
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
import google.generativeai as genai

from backend.config.settings import settings
from backend.utils.loaders import load_document
from backend.utils.vector_store import get_pinecone_index

logger = logging.getLogger(__name__)

# Configure Gemini once at module load (no heavy model weights downloaded)
genai.configure(api_key=settings.GEMINI_API_KEY)

def get_embedding(text: str) -> list[float]:
    """Get a 768-dim embedding via Gemini text-embedding-004 API."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


# ---------------------------------------------------------------------------
# Chunking configuration
# ---------------------------------------------------------------------------
PARENT_CHUNK_SIZE    = 2000   # characters — stored as context in metadata
PARENT_CHUNK_OVERLAP = 200
CHILD_CHUNK_SIZE     = 400    # characters — embedded and queried
CHILD_CHUNK_OVERLAP  = 80
UPSERT_BATCH_SIZE    = 100


class EmbeddingsService:
    # ------------------------------------------------------------------
    # Hashing helpers
    # ------------------------------------------------------------------
    @staticmethod
    def get_file_hash(file_path: str) -> str:
        """SHA-256 of the file bytes; for URLs, hash the URL string."""
        hasher = hashlib.sha256()
        if file_path.startswith(("http://", "https://")):
            hasher.update(file_path.encode("utf-8"))
            return hasher.hexdigest()
        if not os.path.exists(file_path):
            return ""
        with open(file_path, "rb") as fh:
            hasher.update(fh.read())
        return hasher.hexdigest()

    @staticmethod
    def compute_chunk_hash(text: str, document_id: str) -> str:
        """Stable ID for a (text, document) pair — used to skip re-ingestion."""
        hasher = hashlib.sha256()
        hasher.update((text + document_id).encode("utf-8"))
        return hasher.hexdigest()

    # ------------------------------------------------------------------
    # Metadata extraction
    # ------------------------------------------------------------------
    @staticmethod
    def extract_metadata(text: str, filename: str, page_number: int) -> dict[str, Any]:
        """
        Extract lightweight structural metadata from a raw text block.

        Detects:
          - section_header: first Markdown-style heading found (# Title)
          - word_count:     number of whitespace-separated tokens
          - char_count:     total characters
          - has_table:      True if the text contains a Markdown table
          - has_code:       True if backtick code fences are present
          - language:       always 'en' for now (placeholder for future detection)
        """
        # Detect first heading (Markdown # style or ALL-CAPS line)
        heading_match = re.search(r"^#+\s+(.+)$", text, re.MULTILINE)
        if not heading_match:
            heading_match = re.search(r"^([A-Z][A-Z\s]{4,})$", text, re.MULTILINE)

        section_header = heading_match.group(1).strip() if heading_match else ""

        return {
            "source_file":      filename,
            "page_number":      str(page_number),
            "section_header":   section_header,
            "word_count":       str(len(text.split())),
            "char_count":       str(len(text)),
            "has_table":        str("|" in text and "---" in text),
            "has_code":         str("```" in text),
            "language":         "en",
            "upload_date":      datetime.now().isoformat(),
            "document_type":    os.path.splitext(filename)[1].lower(),
        }

    # ------------------------------------------------------------------
    # Main ingestion entry-point
    # ------------------------------------------------------------------
    @staticmethod
    def ingest_documents(user_id: int) -> int:
        """
        Ingest all pending uploads for *user_id*.

        Returns the number of new child chunks upserted.
        Idempotent: chunks already present in Pinecone (by sha256_hash)
        are skipped.
        """
        uploads_dir = os.path.join(settings.UPLOADS_DIR, f"user_{user_id}")
        os.makedirs(uploads_dir, exist_ok=True)

        index = get_pinecone_index()

        # ── Fetch existing chunk hashes to support idempotent ingestion ──
        try:
            results = index.query(
                vector=[0.0] * 768,
                top_k=10000,
                filter={"user_id": str(user_id)},
                include_metadata=True,
            )
            existing_hashes: set[str] = {
                v["metadata"].get("sha256_hash", "")
                for v in results.get("matches", [])
                if v.get("metadata")
            }
        except Exception as exc:
            logger.error("Failed to fetch existing vectors: %s", exc)
            existing_hashes = set()

        # ── Collect files ──
        current_files = [
            os.path.join(root, fname)
            for root, _, files in os.walk(uploads_dir)
            for fname in files
        ]

        # ── Splitters ──
        parent_splitter = RecursiveCharacterTextSplitter(
            chunk_size=PARENT_CHUNK_SIZE,
            chunk_overlap=PARENT_CHUNK_OVERLAP,
            length_function=len,
        )
        child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHILD_CHUNK_SIZE,
            chunk_overlap=CHILD_CHUNK_OVERLAP,
            length_function=len,
        )

        new_chunk_count = 0
        batch: list[dict] = []

        for file_path in current_files:
            filename = os.path.basename(file_path)
            document_id = EmbeddingsService.get_file_hash(file_path)
            logger.info("Ingesting '%s' (doc_id=%s…)", filename, document_id[:8])

            pages = load_document(file_path)
            if not pages:
                logger.warning("No text extracted from '%s'; skipping.", filename)
                continue

            for page in pages:
                raw_text   = page["text"]
                page_num   = page["page_number"]
                file_meta  = EmbeddingsService.extract_metadata(
                    raw_text, filename, page_num
                )

                # ── Parent chunks ──────────────────────────────────────
                parent_chunks = parent_splitter.split_text(raw_text)

                for p_idx, parent_text in enumerate(parent_chunks):
                    # ── Child chunks ───────────────────────────────────
                    child_chunks = child_splitter.split_text(parent_text)

                    for c_idx, child_text in enumerate(child_chunks):
                        chunk_hash = EmbeddingsService.compute_chunk_hash(
                            child_text, document_id
                        )
                        if chunk_hash in existing_hashes:
                            continue  # already indexed — skip

                        embedding  = get_embedding(child_text)
                        chunk_id   = str(uuid.uuid4())

                        metadata = {
                            **file_meta,
                            # Core identifiers
                            "document_id":   document_id,
                            "chunk_id":      chunk_id,
                            "sha256_hash":   chunk_hash,
                            "user_id":       str(user_id),
                            # Text — child for search, parent for context
                            "text":          child_text,
                            "parent_text":   parent_text,   # full parent passage
                            # Position information (useful for citations)
                            "parent_index":  str(p_idx),
                            "child_index":   str(c_idx),
                        }

                        batch.append({
                            "id":     chunk_id,
                            "values": embedding,
                            "metadata": metadata,
                        })
                        new_chunk_count += 1
                        existing_hashes.add(chunk_hash)

                        if len(batch) >= UPSERT_BATCH_SIZE:
                            index.upsert(vectors=batch)
                            batch = []

        # Flush remaining
        if batch:
            index.upsert(vectors=batch)

        # ── Clean up uploaded files ────────────────────────────────────
        for file_path in current_files:
            try:
                os.remove(file_path)
            except Exception as exc:
                logger.warning("Could not remove temp file '%s': %s", file_path, exc)

        # Invalidate BM25 cache so next query reflects new content
        from backend.services.retrieval import RetrievalService
        RetrievalService.clear_bm25_cache()

        logger.info(
            "Ingestion complete for user %d — %d new chunks indexed.",
            user_id, new_chunk_count,
        )
        return new_chunk_count
