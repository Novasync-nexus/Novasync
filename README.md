# Prisma AI - Intelligent RAG Ecosystem

A full-stack Retrieval-Augmented Generation (RAG) application utilizing Google's Gemini API, ChromaDB, and a React + TailwindCSS frontend designed with the Prisma Cinematic Studio aesthetics.

## Architecture

*   **Backend:** FastAPI (Python 3.12)
*   **Vector DB:** ChromaDB
*   **Embeddings:** BAAI/bge-base-en-v1.5
*   **LLM:** Gemini 2.5 Flash
*   **Frontend:** React (Vite) + Tailwind CSS

## Key Features

*   **Intelligent Ingestion:** Supports PDF, DOCX, TXT, MD, and web URLs.
*   **Incremental Indexing:** SHA256 hashing to prevent duplicate embedding and re-embed only modified chunks.
*   **Hybrid Search:** Combines semantic search (ChromaDB) with keyword search (BM25) and Cross-Encoder Reranking (`BAAI/bge-reranker-base`).
*   **Cinematic UI:** Beautiful, dark, minimalist "glassmorphic" interface based on the Prisma Cinematic Studio design language.
*   **Streaming Responses:** Real-time generation of answers via the Gemini API.

## Setup Instructions

### 1. Prerequisites
- Docker and Docker Compose
- Node.js 20+ (if running frontend natively)
- Python 3.12+ (if running backend natively)

### 2. Environment Variables
Ensure you have a `.env` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CHROMA_DB_DIR=../chroma_db
UPLOADS_DIR=../uploads
```

### 3. Run via Docker Compose
Simply run:
```bash
docker-compose up --build
```
This will start:
- FastAPI Backend: `http://localhost:8000`
- React Frontend: `http://localhost:5173`

### 4. Run Natively (Alternative)

**Backend:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open `http://localhost:5173`.
2. Drag and drop your documents into the Upload Portal.
3. Wait for the "Indexing..." indicator to disappear.
4. Begin chatting with your documents using the Workspace panel!
