
import asyncio
import os
import sys
from functools import lru_cache

# ==========================================
# 1. WINDOWS PSYCOPG EVENT LOOP FIX
# ==========================================

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )


# ==========================================
# 2. IMPORTS
# ==========================================

from dotenv import load_dotenv
from langchain_postgres import PGEngine, PGVectorStore

from app.retrieval.embeddings import embeddings


# ==========================================
# 3. CONFIGURATION
# ==========================================

load_dotenv()

TABLE_NAME = "ragverse_documents"
VECTOR_SIZE = 1024


# ==========================================
# 4. CREATE VECTOR STORE
# ==========================================

@lru_cache(maxsize=1)
def get_vector_store():

    # Step 1: Get Neon database URL
    database_url = os.getenv("NEON_DATABASE_URL")

    if not database_url:
        raise ValueError(
            "NEON_DATABASE_URL is missing from .env"
        )

    # Step 2: Configure Psycopg 3 driver
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1
        )
    engine = PGEngine.from_connection_string(
        url=database_url,
        pool_pre_ping=True,
        pool_recycle=240
    )

    # Step 4: Connect to existing vector table
    # Table was already created in Neon.
    # Do not call init_vectorstore_table() again.

    # Step 5: Initialize PGVectorStore
    vector_store = PGVectorStore.create_sync(
        engine=engine,
        table_name=TABLE_NAME,
        embedding_service=embeddings
    )

    return vector_store


# ==========================================
# 5. TEST CONNECTION
# ==========================================

if __name__ == "__main__":

    store = get_vector_store()

    print("Neon PostgreSQL connected successfully!")
    print("PGVectorStore initialized successfully!")
    print("Table:", TABLE_NAME)
    print("Embedding dimensions:", VECTOR_SIZE)
