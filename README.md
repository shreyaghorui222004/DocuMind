<div align="center">

<img src="assets/documind-logo-wordmark.png" alt="DocuMind logo" width="110"/>

# DocuMind

### Your Documents. Your Knowledge. One Intelligence.

Upload a PDF, ask questions in plain language, and get **sourced answers** — powered by Retrieval-Augmented Generation (RAG).

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_App-713CFF?style=for-the-badge)](https://docu-mind-gilt.vercel.app)
[![API Docs](https://img.shields.io/badge/⚡_API_Docs-Swagger-FF8A1F?style=for-the-badge)](https://documind-ekua.onrender.com/docs)

![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon-pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat-square)
![Cohere](https://img.shields.io/badge/Cohere-Embeddings-39594D?style=flat-square)

[Overview](#-overview) · [Features](#-features) · [Screenshots](#-application-screenshots) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [API](#-api-reference) · [Run Locally](#-run-locally) · [Deploy](#-deployment) · [Roadmap](#-roadmap)

</div>

---

## ✨ Overview

DocuMind turns static PDFs into an interactive knowledge base. Instead of scrolling through pages, you upload a document and simply **ask**. DocuMind finds the most relevant passages with semantic search, and an LLM writes a clear Markdown answer **grounded only in your document**, with file and page references.

| | |
|---|---|
| 🌐 **Frontend** (Vercel) | https://docu-mind-gilt.vercel.app |
| ⚙️ **Backend** (Render) | https://documind-ekua.onrender.com |
| 📚 **Interactive API docs** | https://documind-ekua.onrender.com/docs |

> 💤 **Heads up:** on a free tier the first request after a quiet period can take 30–60 seconds while the server wakes up.

---

## 🚀 Features

| | Feature | What it does |
|---|---|---|
| 📄 | **PDF upload & indexing** | Drag-and-drop with live progress; text is extracted, cleaned, chunked and embedded automatically |
| 🔎 | **Semantic retrieval** | Meaning-based search over pgvector, not just keyword matching |
| 💬 | **Chat with your documents** | Markdown answers with copy and regenerate buttons |
| 📌 | **Cited sources** | Every answer lists the file and page it came from, so you can verify it |
| 🗂️ | **Document library** | Search, filter and manage uploads with page and chunk counts |
| 🕘 | **Chat history** | Search, open, rename and delete past conversations |
| 👤 | **Accounts & profile** | Sign up, log in, profile photo, change password, settings |
| 🎨 | **Premium UI** | Dark glassmorphism, animated aurora background, fully responsive |

---

## 📸 Application Screenshots

### 🏠 Home Page
![DocuMind Home](assets/home.png)

### 📊 Dashboard
![DocuMind Dashboard](assets/dashboard.png)

### 💬 Chat Interface
![DocuMind Chat](assets/chat.png)

### 👤 Profile
![DocuMind Profile](assets/profile.png)

---

## 🏗️ Architecture

<div align="center">

<img src="assets/architecture.png" alt="DocuMind full architecture" width="100%"/>

</div>

**How it works**

1. **Upload** — the browser sends the PDF to FastAPI. It is read page by page (PyPDF), cleaned, split into 800-character chunks with 120 overlap, embedded with Cohere, and stored in Neon (pgvector) with file and page metadata.
2. **Ask** — your question is embedded with the same Cohere model, and the top-k closest chunks are retrieved from pgvector.
3. **Answer** — the chunks and question go to Groq with a strict "use only the context" prompt. The Markdown answer and its sources come back to the chat.

### Design decisions

| Decision | Why |
|---|---|
| **RAG instead of fine-tuning** | Answers stay grounded and citable, and new files work instantly without retraining |
| **Cohere `embed-english-v3.0`** | High-quality 1024-dimension embeddings with a generous API tier |
| **Neon + pgvector** | One familiar PostgreSQL database handles storage and similarity search |
| **Groq for generation** | Very low-latency inference for a responsive chat feel |
| **800-char chunks, 120 overlap** | Small enough for precise retrieval; overlap keeps sentences cut at a boundary |
| **Strict "context only" prompt** | Reduces hallucination — the model says so when the document lacks the answer |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, React Router, React Markdown, plain CSS |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **RAG** | LangChain, PyPDF, `RecursiveCharacterTextSplitter` |
| **Embeddings** | Cohere `embed-english-v3.0` (1024 dimensions) |
| **Vector DB** | Neon PostgreSQL + pgvector via `langchain-postgres` |
| **LLM** | Groq (`openai/gpt-oss-120b` via `ChatGroq`) |
| **Hosting** | Vercel (frontend) · Render (backend) · Neon (database) |

<details>
<summary><b>📁 Project structure</b></summary>

```text
DocuMind/
├── assets/                  # README images
│   ├── logo.png
│   ├── home.png · dashboard.png · chat.png · profile.png
│   └── architecture.png
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routes, CORS
│   │   ├── rag_pipeline.py      # Orchestrates ingest + answer flow
│   │   ├── config.py            # Settings
│   │   ├── ingestion/           # loader.py · preprocessor.py · chunker.py
│   │   ├── retrieval/           # embeddings.py · vector_store.py · retriever.py
│   │   └── generation/
│   │       └── generator.py     # Groq LLM + system prompt
│   ├── data/uploads/            # Uploaded PDFs
│   └── requirements.txt
└── frontend/
    ├── public/
    └── src/
        ├── api.js               # Backend calls (upload, chat)
        ├── store.js             # Local accounts / library / history
        ├── context/AppContext.jsx
        ├── components/          # Layout, Logo, AnimatedBackground, ChatMessage, ChatInput…
        └── pages/               # Landing, Auth, Dashboard, Chat, Documents, History, Account
```

</details>

---

## 🔌 API Reference

Base URL: `https://documind-ekua.onrender.com` · Interactive docs at `/docs`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Health check |
| `POST` | `/documents/upload` | Upload and index a PDF (`multipart/form-data`, field `file`) |
| `POST` | `/chat` | Ask a question about the indexed documents |

**Upload** returns `document_id`, `filename`, `total_pages` and `total_chunks`.

**Chat**

```json
// POST /chat
{ "question": "What are the key topics in this document?", "k": 3 }
```

`k` is the number of chunks to retrieve (1–10). The response contains the generated `answer` (Markdown) and its `sources` (file and page references).

---

## 💻 Run Locally

**Prerequisites:** Python 3.10+, Node.js 18+, and API keys for [Groq](https://console.groq.com), [Cohere](https://dashboard.cohere.com) and a [Neon](https://neon.tech) database with the `pgvector` extension.

<details open>
<summary><b>Backend</b></summary>

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

</details>

<details open>
<summary><b>Frontend</b></summary>

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

</details>

---

## ☁️ Deployment

| Service | Hosts | Key settings |
|---|---|---|
| **Vercel** | React frontend | Framework: Vite · Env: `VITE_API_BASE_URL` = your Render URL |
| **Render** | FastAPI backend | Build: `pip install -r requirements.txt` · Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` · Env: `GROQ_API_KEY`, `COHERE_API_KEY`, `NEON_DATABASE_URL` |
| **Neon** | PostgreSQL + pgvector | Enable the `vector` extension |

Two things that commonly trip up deployments:

1. **CORS** — add your Vercel URL to the backend's allowed origins, otherwise the browser blocks requests.
2. **React Router on Vercel** — add `frontend/vercel.json` so refreshing a page like `/dashboard` doesn't 404:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## ⚠️ Current Limitations

- **Accounts, chat history and the document library live in the browser (`localStorage`)** — per-device and not secured by a server. Passwords are hashed in the browser, which is fine for a demo but not production-grade authentication.
- **Search covers all indexed documents.** The backend does not yet filter retrieval by user or document.
- **Deleting a document removes it from your library only**; its vectors stay in the database until a delete endpoint exists.
- **Text-based PDFs only** — scanned images need OCR.

## 🗺️ Roadmap

- [ ] Server-side authentication (JWT, Argon2) with per-user data
- [ ] Per-user and per-document retrieval filtering
- [ ] Document deletion that also removes its vectors
- [ ] Chat history stored in the database
- [ ] Conversation memory for follow-up questions
- [ ] Streaming answers
- [ ] OCR for scanned PDFs
- [ ] DOCX, TXT and web page support

---

<div align="center">

## 👩‍💻 Author

**Shreya Ghorui** — B.Tech Information Technology student, building toward AI/ML engineering.

[GitHub](https://github.com/shreyaghorui222004) · [LinkedIn](https://linkedin.com/in/your-profile) *(update this link)*

<br/>

⭐ If DocuMind helped you, consider giving it a star!

</div>
