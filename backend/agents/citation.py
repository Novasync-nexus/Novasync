"""
Citation Agent

Responsibilities:
- Attach sources to every factual claim.
- Extract cited sources from the LLM response.
"""
import re

class CitationAgent:
    @staticmethod
    def extract_cited_sources(response_text: str, source_map: dict[int, dict]) -> list[dict]:
        """
        Parses [Source N] tags from the generated response and maps them to actual documents.
        """
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
