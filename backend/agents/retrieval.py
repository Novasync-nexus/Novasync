"""
Retrieval Agent

Responsibilities:
- Query Vector DB
- Rank results
- Return relevant context
"""
from backend.services.retrieval import RetrievalService

class RetrievalAgent:
    @staticmethod
    def retrieve_context(question: str, user_id: int, top_k: int = 15) -> tuple[str, dict, list]:
        """
        Executes hybrid search and formats the retrieved chunks into a numbered context block.
        Returns:
            context_text: The formatted string injected into the prompt.
            source_map: Metadata map for CitationAgent.
            eager_sources: Deduplicated list of sources for UI prior to streaming.
        """
        top_chunks = RetrievalService.hybrid_search(question, user_id=user_id, top_k=top_k)
        
        lines: list[str] = []
        source_map: dict[int, dict] = {}
        eager_sources: list[dict] = []
        seen: set[str] = set()

        for i, chunk in enumerate(top_chunks, start=1):
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
            
            key = f"{file}_{page}"
            if key not in seen:
                seen.add(key)
                eager_sources.append({
                    "file": file,
                    "page": page,
                    "section": section,
                })

        context_text = "\n\n".join(lines)
        return context_text, source_map, eager_sources
