# ==========================================
# DOCUMIND - SEMANTIC RETRIEVER
# ==========================================

from app.retrieval.vector_store import get_vector_store


def retrieve_documents(
    query: str,
    k: int = 3,
    document_ids: list[str] | None = None
):
    """
    Retrieve the most relevant chunks from Neon PostgreSQL,
    searching ONLY inside the given documents.
    """

    # Validate user query
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if k < 1:
        raise ValueError("k must be at least 1")

    # Never search the whole table
    if not document_ids:
        raise ValueError("Select or upload a document first")

    # Get existing vector store
    vector_store = get_vector_store()

    # Plain equality filters (most reliable across langchain-postgres versions)
    if len(document_ids) == 1:
        doc_filter = {"document_id": document_ids[0]}
    else:
        doc_filter = {"$or": [{"document_id": d} for d in document_ids]}

    # Semantic similarity search limited to these documents
    results = vector_store.similarity_search(
        query=query,
        k=k,
        filter=doc_filter
    )

    return results


def format_retrieved_context(documents):
    """
    Combine retrieved document chunks into
    one context string for the LLM.
    """

    context = []

    for index, doc in enumerate(documents, start=1):

        context.append(
            f"""
            Chunk {index}:
            Content: {doc.page_content}
            Metadata: {doc.metadata}
            """
        )

    return "\n".join(context)