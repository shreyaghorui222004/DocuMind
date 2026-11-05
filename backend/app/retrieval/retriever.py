
# ==========================================
# RAGVERSE - SEMANTIC RETRIEVER
# ==========================================

from app.retrieval.vector_store import get_vector_store


def retrieve_documents(
    query: str,
    k: int = 3
):
    """
    Retrieve the most relevant document chunks
    from Neon PostgreSQL using vector similarity.
    """

    # Validate user query
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if k < 1:
        raise ValueError("k must be at least 1")

    # Get existing vector store
    vector_store = get_vector_store()

    # Perform semantic similarity search
    results = vector_store.similarity_search(
        query=query,
        k=k
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
