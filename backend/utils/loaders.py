import os
import fitz  # PyMuPDF
import docx
from bs4 import BeautifulSoup
import requests
import markdownify

def load_pdf(file_path: str) -> list[dict]:
    """Extracts text from a PDF file page by page."""
    docs = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            if text.strip():
                docs.append({
                    "text": text,
                    "page_number": page_num + 1
                })
    except Exception as e:
        print(f"Error loading PDF {file_path}: {e}")
    return docs

def load_docx(file_path: str) -> list[dict]:
    """Extracts text from a DOCX file."""
    docs = []
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        text = "\n".join(full_text)
        if text.strip():
            docs.append({
                "text": text,
                "page_number": 1 # DOCX doesn't easily give page numbers via python-docx
            })
    except Exception as e:
        print(f"Error loading DOCX {file_path}: {e}")
    return docs

def load_txt_or_md(file_path: str) -> list[dict]:
    """Extracts text from a TXT or Markdown file."""
    docs = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            if text.strip():
                docs.append({
                    "text": text,
                    "page_number": 1
                })
    except Exception as e:
        print(f"Error loading TXT/MD {file_path}: {e}")
    return docs

def load_website(url: str) -> list[dict]:
    """Scrapes a website and converts HTML to Markdown."""
    docs = []
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()
            
        text = markdownify.markdownify(str(soup), heading_style="ATX")
        if text.strip():
             docs.append({
                "text": text,
                "page_number": 1
            })
    except Exception as e:
        print(f"Error loading URL {url}: {e}")
    return docs

def load_document(file_path: str) -> list[dict]:
    """Routes the file to the appropriate loader based on extension."""
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return load_website(file_path)
        
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return load_pdf(file_path)
    elif ext == ".docx":
        return load_docx(file_path)
    elif ext in [".txt", ".md"]:
        return load_txt_or_md(file_path)
    else:
        print(f"Unsupported file format: {ext}")
        return []
