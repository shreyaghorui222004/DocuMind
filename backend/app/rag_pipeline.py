# ==========================================
# DOCUMIND - COMPLETE RAG PIPELINE
# ==========================================

from app.retrieval.retriever import (
    retrieve_documents,
    format_retrieved_context
)

from app.generation.generator import generate_answer


def ask_question(
    query: str,
    k: int = 3,
    document_ids: list[str] | None = None
):
    """
    1. Retrieve relevant chunks from the given documents only.
    2. Format retrieved context.
    3. Generate answer using Groq.
    4. Return answer and source documents.
    """

    if not query or not query.strip():
        raise ValueError("Question cannot be empty")

    # Step 1: Retrieve (restricted to document_ids)
    try:
        documents = retrieve_documents(
            query=query,
            k=k,
            document_ids=document_ids
        )
    except ValueError:
        raise
    except Exception as e:
        raise RuntimeError(
            f"Search step failed - {type(e).__name__}: {str(e)[:180]}"
        ) from e

    if not documents:
        return {
            "question": query,
            "answer": "No relevant information was found in your uploaded document.",
            "sources": [],
            "total_chunks_retrieved": 0
        }

    # Step 2: Format context
    context = format_retrieved_context(documents)

    # Step 3: Generate answer
    try:
        answer = generate_answer(
            query=query,
            context=context
        )
    except ValueError:
        raise
    except Exception as e:
        raise RuntimeError(
            f"Answer step failed - {type(e).__name__}: {str(e)[:180]}"
        ) from e

    # Step 4: Sources
    sources = []

    for doc in documents:
        sources.append({
            "filename": doc.metadata.get("filename"),
            "page": doc.metadata.get("page"),
            "document_id": doc.metadata.get("document_id"),
            "content": doc.page_content
        })

    return {
        "question": query,
        "answer": answer,
        "sources": sources,
        "total_chunks_retrieved": len(documents)
    }