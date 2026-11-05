
import uuid
import shutil
import traceback
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from app.ingestion.loader import load_pdf
from app.ingestion.preprocessor import preprocess_documents
from app.ingestion.chunker import chunk_documents
from app.retrieval.vector_store import get_vector_store
from app.rag_pipeline import ask_question
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import auth as auth_router, users as users_router


# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parents[1]

UPLOAD_DIR = BASE_DIR / "data" / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================
# 2. FASTAPI INITIALIZATION
# ==========================================

app = FastAPI(
    title="DocuMind API",
    description="AI-powered PDF Question Answering Platform",
    version="1.0.0"
)


init_db()  # creates missing tables only; never touches ragverse_documents

app.include_router(auth_router.router)
app.include_router(users_router.router)


# ==========================================
# 3. CHAT REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):

    question: str = Field(
        min_length=1,
        description="Ask a question about your uploaded PDF"
    )

    k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of relevant chunks to retrieve"
    )


# ==========================================
# 4. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Welcome to DocuMind!",
        "status": "Running"
    }


# ==========================================
# 5. HEALTH CHECK ENDPOINT
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# ==========================================
# 6. PDF UPLOAD AND INGESTION API
# ==========================================

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):

    # Step 1: Validate PDF extension
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Step 2: Generate unique document ID
    document_id = str(uuid.uuid4())

    # Step 3: Generate unique filename
    unique_filename = f"{document_id}.pdf"

    # Step 4: Create file path
    file_path = UPLOAD_DIR / unique_filename

    try:

        # STEP 1: SAVE PDF
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # STEP 2: LOAD PDF
        documents = load_pdf(str(file_path))

        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No pages found in PDF"
            )

        total_pages = len(documents)

        # STEP 3: PREPROCESS TEXT
        cleaned_documents = preprocess_documents(documents)

        if not cleaned_documents:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF"
            )

        # STEP 4: CHUNK DOCUMENTS
        chunks = chunk_documents(cleaned_documents)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Unable to generate text chunks"
            )

        # STEP 5: ADD METADATA
        for chunk in chunks:
            chunk.metadata["document_id"] = document_id
            chunk.metadata["filename"] = file.filename

        # STEP 6: STORE IN NEON
        vector_store = get_vector_store()

        chunk_ids = [
            str(uuid.uuid4()) for _ in chunks
        ]

        vector_store.add_documents(
            documents=chunks,
            ids=chunk_ids
        )

        # STEP 7: GENERATE TEXT PREVIEW
        text_preview = cleaned_documents[0].page_content[:1000]

        # STEP 8: RETURN RESPONSE
        return {
            "message": "PDF uploaded and stored successfully",
            "document_id": document_id,
            "filename": file.filename,
            "stored_as": unique_filename,
            "total_pages": total_pages,
            "total_chunks": len(chunks),
            "text_preview": text_preview,
            "status": "success"
        }

    except HTTPException:
        file_path.unlink(missing_ok=True)
        raise

    except Exception as e:

        print("\n========== PDF INGESTION ERROR ==========")

        traceback.print_exc()

        print("Error details:", repr(e))

        print("=========================================\n")

        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="PDF ingestion failed"
        )

    finally:
        await file.close()


# ==========================================
# 7. RAG CHAT API
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):

    try:

        # Run complete RAG pipeline
        result = ask_question(
            query=request.question,
            k=request.k
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print("\n========== CHAT ERROR ==========")

        traceback.print_exc()

        print("Error details:", repr(e))

        print("================================\n")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate answer"
        )
        
# ==========================================
# 3. CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    }),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
