<div align="center">

# 🧠 DocuMind

### Your Documents. Your Knowledge. One Intelligence.

An AI-powered knowledge workspace — upload PDFs, ask questions in plain language, and get **sourced answers** powered by Retrieval-Augmented Generation (RAG).

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_App-713CFF?style=for-the-badge)](https://documind-hub-sigma.vercel.app/)
[![API](https://img.shields.io/badge/⚡_Backend_API-Render-3B82F6?style=for-the-badge)](https://documind-ekua.onrender.com)

![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat-square)
![Cohere](https://img.shields.io/badge/Cohere-Embeddings-39594D?style=flat-square)

[**Live App**](https://documind-hub-sigma.vercel.app/) · [**API**](https://documind-ekua.onrender.com) · [**Architecture**](#-architecture) · [**Run Locally**](#-run-locally)

</div>

---

## ✨ Overview

DocuMind turns static PDFs into an interactive knowledge base. Instead of scrolling through pages, you upload a document and simply **ask** — DocuMind finds the most relevant passages with semantic search and has an LLM write a clear, Markdown-formatted answer **grounded only in your document**, with file and page references.

| | |
|---|---|
| 🌐 **Frontend (Vercel)** | https://documind-hub-sigma.vercel.app/ |
| ⚙️ **Backend (Render)** | https://documind-ekua.onrender.com |
| 📚 **Interactive API docs** | https://documind-ekua.onrender.com/docs |

> 💤 **Note:** if the backend is hosted on a free tier, the first request after a period of inactivity can take 30–60 seconds while the server wakes up.

---

## 🚀 Features

| | Feature | Details |
|---|---|---|
| 📄 | **PDF upload & indexing** | Drag-and-drop upload with live progress; text is extracted, cleaned, chunked and embedded automatically |
| 🔎 | **Semantic retrieval** | Meaning-based search over pgvector, not just keyword matching |
| 💬 | **Chat with your documents** | Structured Markdown answers, copy and regenerate buttons, expandable sources with page numbers |
| 📌 | **Cited sources** | Every answer lists the file and page it came from, so you can verify it |
| 🗂️ | **Document library** | Search, filter, and manage uploaded documents with page and chunk counts |
| 🕘 | **Chat history** | Search, open, rename and delete past conversations |
| 👤 | **Accounts & profile** | Sign up, log in, profile photo, change password, settings |
| 🎨 | **Premium UI** | Dark glassmorphism design, animated aurora background, glossy chat bubbles, fully responsive |

---

## 🏗️ Architecture

### 1 · System overview

```mermaid
flowchart LR
    U([👤 User]) --> FE

    subgraph VERCEL["☁️ Vercel — Frontend"]
        FE["⚛️ React + Vite SPA<br/>React Router · Markdown chat UI"]
        LS[("💾 Browser localStorage<br/>accounts · chats · library")]
        FE <--> LS
    end

    FE -- "POST /documents/upload<br/>POST /chat" --> API

    subgraph RENDER["🚀 Render — Backend"]
        API["⚡ FastAPI<br/>validation · CORS"]
        ING["📥 Ingestion<br/>load → clean → chunk"]
        RET["🔎 Retriever<br/>top-k similarity"]
        GEN["🧠 Generator<br/>LangChain prompt"]
        API --> ING
        API --> RET
        RET --> GEN
    end

    COH["🔤 Cohere<br/>embed-english-v3.0 · 1024-dim"]
    DB[("🐘 Neon PostgreSQL<br/>+ pgvector")]
    GROQ["⚡ Groq LLM<br/>openai/gpt-oss-120b"]

    ING -- "chunk text" --> COH
    ING -- "vectors + metadata" --> DB
    RET -- "question" --> COH
    RET -- "nearest chunks" --> DB
    GEN -- "question + context" --> GROQ

    classDef fe fill:#713CFF,stroke:#fff,color:#fff
    classDef be fill:#1d4ed8,stroke:#fff,color:#fff
    classDef ext fill:#0f766e,stroke:#fff,color:#fff
    class FE,LS fe
    class API,ING,RET,GEN be
    class COH,DB,GROQ ext
```

### 2 · Upload & indexing pipeline

```mermaid
flowchart TD
    A["📄 PDF uploaded<br/>(drag & drop)"] --> B["✅ Validate file<br/>.pdf extension"]
    B --> C["💾 Save with a unique ID"]
    C --> D["📖 Extract text per page<br/>PyPDF"]
    D --> E["🧹 Preprocess<br/>normalise whitespace"]
    E --> F["✂️ Chunk<br/>RecursiveCharacterTextSplitter<br/>800 chars · 120 overlap"]
    F --> G["🔤 Embed chunks<br/>Cohere embed-english-v3.0"]
    G --> H[("🐘 Store vectors + metadata<br/>Neon · pgvector")]
    H --> I["🎉 Respond<br/>document_id · pages · chunks"]

    style A fill:#713CFF,color:#fff,stroke:#fff
    style H fill:#0f766e,color:#fff,stroke:#fff
    style I fill:#16a34a,color:#fff,stroke:#fff
```

### 3 · Question answering (RAG) flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as ⚛️ React App
    participant API as ⚡ FastAPI
    participant COH as 🔤 Cohere
    participant DB as 🐘 Neon + pgvector
    participant LLM as 🧠 Groq LLM

    User->>FE: Ask a question
    FE->>API: POST /chat { question, k }
    API->>COH: Embed the question
    COH-->>API: 1024-dim query vector
    API->>DB: Similarity search (top-k chunks)
    DB-->>API: Relevant chunks + page metadata
    API->>LLM: Prompt = instructions + context + question
    LLM-->>API: Markdown answer (document-only)
    API-->>FE: { answer, sources }
    FE-->>User: Rendered answer + expandable sources
```

### 4 · Design decisions

| Decision | Why |
|---|---|
| **RAG instead of fine-tuning** | Answers stay grounded in the uploaded document, can be cited, and new files work instantly without retraining |
| **Cohere `embed-english-v3.0`** | High-quality 1024-dimension embeddings with a generous API tier |
| **Neon + pgvector** | Vectors live in a real PostgreSQL database, so one familiar system handles storage and similarity search |
| **Groq for generation** | Very low-latency inference for a responsive chat feel |
| **800-char chunks, 120 overlap** | Small enough for precise retrieval, with overlap so sentences cut at a boundary are not lost |
| **Strict "use only the context" prompt** | Reduces hallucination — the model says so when the document does not contain the answer |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, React Router, React Markdown, plain CSS (glassmorphism, canvas + CSS animations) |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **RAG** | LangChain, PyPDF, `RecursiveCharacterTextSplitter` |
| **Embeddings** | Cohere `embed-english-v3.0` (1024 dimensions) |
| **Vector DB** | Neon PostgreSQL + pgvector via `langchain-postgres` |
| **LLM** | Groq (`openai/gpt-oss-120b` via `ChatGroq`) |
| **Hosting** | Vercel (frontend) · Render (backend) · Neon (database) |

---

## 📁 Project Structure

```text
DocuMind/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routes, CORS
│   │   ├── rag_pipeline.py      # Orchestrates ingest + answer flow
│   │   ├── config.py            # Settings
│   │   ├── ingestion/
│   │   │   ├── loader.py        # PDF → pages (PyPDF)
│   │   │   ├── preprocessor.py  # Text cleanup
│   │   │   └── chunker.py       # 800 / 120 recursive splitter
│   │   ├── retrieval/
│   │   │   ├── embeddings.py    # Cohere embeddings
│   │   │   ├── vector_store.py  # Neon + pgvector store
│   │   │   └── retriever.py     # Top-k semantic search
│   │   └── generation/
│   │       └── generator.py     # Groq LLM + system prompt
│   ├── data/uploads/            # Uploaded PDFs
│   └── requirements.txt
│
└── frontend/
    ├── public/                  # Favicon & static assets
    └── src/
        ├── api.js               # Backend calls (upload, chat)
        ├── store.js             # Local accounts / library / history
        ├── context/AppContext.jsx
        ├── components/          # Layout, Logo, AnimatedBackground, ChatMessage, ChatInput…
        └── pages/               # Landing, Auth, Dashboard, Chat, Documents, History, Account
```

---

## 🔌 API Reference

Base URL: `https://documind-ekua.onrender.com` · Interactive docs at `/docs`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Health check |
| `POST` | `/documents/upload` | Upload and index a PDF (`multipart/form-data`, field `file`) |
| `POST` | `/chat` | Ask a question about the indexed documents |

**Upload** — response includes `document_id`, `filename`, `total_pages`, `total_chunks`.

**Chat**

```json
// POST /chat
{ "question": "What are the key topics in this document?", "k": 3 }
```

`k` is the number of chunks to retrieve (1–10). The response contains the generated `answer` (Markdown) and its `sources` (file and page references).

---

## 💻 Run Locally

**Prerequisites:** Python 3.10+, Node.js 18+, and API keys for [Groq](https://console.groq.com), [Cohere](https://dashboard.cohere.com) and a [Neon](https://neon.tech) PostgreSQL database with the `pgvector` extension.

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (never commit this file):

```env
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

```powershell
uvicorn app.main:app --reload
# API → http://127.0.0.1:8000   Docs → http://127.0.0.1:8000/docs
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
# App → http://localhost:5173
```

By default the app talks to `http://127.0.0.1:8000`. To point it elsewhere, create `frontend/.env`:

```env
VITE_API_BASE_URL=https://documind-ekua.onrender.com
```

---

## ☁️ Deployment

| Service | What it hosts | Key settings |
|---|---|---|
| **Vercel** | React frontend | Framework: Vite · Env var: `VITE_API_BASE_URL` = your Render URL |
| **Render** | FastAPI backend | Build: `pip install -r requirements.txt` · Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` · Env vars: `GROQ_API_KEY`, `COHERE_API_KEY`, `NEON_DATABASE_URL` |
| **Neon** | PostgreSQL + pgvector | Enable the `vector` extension |

Two things that commonly trip up deployments:

1. **CORS** — add your Vercel URL (`https://documind-hub-sigma.vercel.app`) to the backend's allowed origins, otherwise the browser blocks requests.
2. **React Router on Vercel** — add a `vercel.json` in `frontend/` so refreshing a page like `/dashboard` does not return a 404:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## ⚠️ Current Limitations

Being upfront about what this version does and does not do:

- **Accounts, chat history and the document library are stored in the browser (`localStorage`)**, so they are per-device and not secured by a server. Passwords are hashed in the browser, which is fine for a demo but not production-grade authentication.
- **Search covers all indexed documents.** The backend does not yet filter retrieval by user, so answers can draw on any uploaded PDF.
- **Deleting a document removes it from your library list only**; its vectors remain in the database until a delete endpoint exists.
- Only **text-based PDFs** are supported (scanned images need OCR).

## 🗺️ Roadmap

- [ ] Server-side authentication (JWT, Argon2) with per-user data
- [ ] Per-user and per-document retrieval filtering
- [ ] Document deletion that also removes its vectors
- [ ] Chat history stored in the database
- [ ] Conversation memory for follow-up questions
- [ ] OCR for scanned PDFs
- [ ] Streaming answers
- [ ] Support for DOCX, TXT and web pages

---

## 👩‍💻 Author

**Shreya Ghorui** — B.Tech Information Technology student, building toward AI/ML engineering.

[GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile) *(update these links)*

<div align="center">

⭐ If you found this project useful, consider giving it a star!

</div>
