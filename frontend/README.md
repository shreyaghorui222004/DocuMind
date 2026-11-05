# RAGVerse frontend
```
npm install
npm run dev      # http://localhost:5173
```
Backend URL: `VITE_API_BASE_URL` in `.env` (default http://127.0.0.1:8000).

Your FastAPI app must allow the dev origin, or the browser will block requests:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
```
