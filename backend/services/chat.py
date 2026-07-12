"""
ChatService — orchestrates the full RAG pipeline for a single user query.

Responsibilities:
  1. Call RetrievalService.hybrid_search() to get ranked, compressed chunks
  2. Build a numbered context block ([Source N] labels) for the LLM prompt
  3. Stream the LLM response via LLMService
  4. Run CitationGenerator to extract only the sources actually cited in
     the LLM's response
  5. Yield NDJSON-formatted events compatible with the existing frontend:
       {"type": "chunk",   "content": "<text delta>"}
       {"type": "sources", "content": [{"file": …, "page": …, "section": …}]}

No frontend changes are required — the event schema is preserved exactly.
"""

import json
import logging
import re
from typing import Generator

from backend.services.retrieval import RetrievalService
from backend.services.llm import LLMService

logger = logging.getLogger(__name__)


# ===========================================================================
# Citation Generator
# ===========================================================================
class CitationGenerator:
    """
    Post-processes the LLM's full response to find which [Source N] markers
    were actually referenced, then maps them back to document metadata.

    Why: The LLM may receive 5 sources but only cite 2.  Sending all 5 to the
    frontend would show irrelevant source chips.  This class returns only the
    subset the LLM genuinely used.
    """

    @staticmethod
    def extract_cited_sources(
        response_text: str,
        source_map: dict[int, dict],
    ) -> list[dict]:
        """
        Args:
            response_text: The complete LLM response string.
            source_map:    {1: metadata_dict, 2: metadata_dict, …}

        Returns:
            Deduplicated list of source dicts for cited [Source N] references,
            in the order they first appear in the response.
        """
        # Match [Source 1], [Source 2], … (case-insensitive, handles plural)
        cited_indices = re.findall(r"\[Source\s+(\d+)\]", response_text, re.IGNORECASE)

        seen: set[str] = set()
        cited_sources: list[dict] = []

        for idx_str in cited_indices:
            idx = int(idx_str)
            if idx not in source_map:
                continue
            meta = source_map[idx]
            file_name = meta.get("source_file", "unknown")
            page      = meta.get("page_number", "1")
            key       = f"{file_name}_{page}"
            if key in seen:
                continue
            seen.add(key)
            cited_sources.append({
                "file":    file_name,
                "page":    page,
                "section": meta.get("section_header", ""),
            })

        return cited_sources


# ===========================================================================
# ChatService
# ===========================================================================
class ChatService:

    # ------------------------------------------------------------------
    # Context builder
    # ------------------------------------------------------------------
    @staticmethod
    def _build_context(
        chunks: list[dict],
    ) -> tuple[str, dict[int, dict]]:
        """
        Formats retrieved chunks into a numbered context block.

        Example output:
            [Source 1] (document.pdf, p.3 — Introduction)
            The transformer architecture was first proposed…

            [Source 2] (report.pdf, p.12 — Methods)
            We evaluated three baselines…

        Returns:
            context_text:  the formatted string injected into the prompt
            source_map:    {1: metadata, 2: metadata, …} for CitationGenerator
        """
        lines: list[str] = []
        source_map: dict[int, dict] = {}

        for i, chunk in enumerate(chunks, start=1):
            meta    = chunk.get("metadata", {})
            text    = chunk.get("compressed_text") or chunk.get("document", "")
            file    = meta.get("source_file", "unknown")
            page    = meta.get("page_number", "?")
            section = meta.get("section_header", "")

            label = f"[Source {i}] ({file}, p.{page}"
            if section:
                label += f" — {section}"
            label += ")"

            lines.append(f"{label}\n{text.strip()}")
            source_map[i] = meta

        context_text = "\n\n".join(lines)
        return context_text, source_map

    # ------------------------------------------------------------------
    # Main entry-point (called from api/chat.py)
    # ------------------------------------------------------------------
    @staticmethod
    def process_chat(
        question: str,
        user_id: int,
        username: str,
    ) -> tuple[Generator, list[dict]]:
        """
        Returns (generate_fn, eager_sources).

        generate_fn — a generator that yields NDJSON lines:
                        {"type": "chunk",   "content": str}
                        {"type": "sources", "content": list[dict]}

        eager_sources — the deduplicated source list (available before the
                        stream starts; kept for backward-compatibility with
                        callers that inspect it before calling generate_fn).

        Citation sources emitted inside the stream are the *cited* subset,
        determined after the full LLM response is assembled.
        """
        # ── 1. Retrieve ──────────────────────────────────────────────
        top_chunks = RetrievalService.hybrid_search(
            question, user_id=user_id, top_k=15
        )

        # ── 2. Build context block ───────────────────────────────────
        context, source_map = ChatService._build_context(top_chunks)

        # ── 3. Compute eager (pre-stream) source list ────────────────
        #       This is the deduplicated set of all retrieved sources.
        #       It will be replaced by the cited-only list after streaming.
        eager_sources: list[dict] = []
        seen: set[str] = set()
        for meta in source_map.values():
            key = f"{meta.get('source_file', '')}_{meta.get('page_number', '')}"
            if key not in seen:
                seen.add(key)
                eager_sources.append({
                    "file":    meta.get("source_file", "unknown"),
                    "page":    meta.get("page_number", "1"),
                    "section": meta.get("section_header", ""),
                })

        # ── 4. Define streaming generator ────────────────────────────
        def generate() -> Generator:
            full_response = []

            # Stream LLM tokens to the client
            for text_chunk in LLMService.generate_rag_response_stream(
                question, context, username
            ):
                full_response.append(text_chunk)
                yield json.dumps({"type": "chunk", "content": text_chunk}) + "\n"

            # After streaming, resolve citations from the assembled response
            complete_response = "".join(full_response)
            cited = CitationGenerator.extract_cited_sources(
                complete_response, source_map
            )

            # Fall back to eager_sources if LLM cited nothing
            # (e.g. general conversation with no document context)
            final_sources = cited if cited else eager_sources

            yield json.dumps({"type": "sources", "content": final_sources}) + "\n"

        return generate, eager_sources
