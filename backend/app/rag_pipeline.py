
# ==========================================
# RAGVERSE - COMPLETE RAG PIPELINE
# ==========================================

from app.retrieval.retriever import (
    retrieve_documents,
    format_retrieved_context
)

from app.generation.generator import generate_answer


# ==========================================
# 1. MAIN RAG FUNCTION
# ==========================================

def ask_question(
    query: str,
    k: int = 3
):
    """
    Complete RAG pipeline:

    1. Retrieve relevant document chunks.
    2. Format retrieved context.
    3. Generate answer using Groq.
    4. Return answer and source documents.
    """

    # Step 1: Validate query
    if not query or not query.strip():
        raise ValueError("Question cannot be empty")

    # Step 2: Retrieve relevant documents
    documents = retrieve_documents(
        query=query,
        k=k
    )

    if not documents:
        return {
            "question": query,
            "answer": "No relevant information was found in the uploaded documents.",
            "sources": [],
            "total_chunks_retrieved": 0
        }

    # Step 3: Format retrieved context
    context = format_retrieved_context(documents)

    # Step 4: Generate answer using Groq
    answer = generate_answer(
        query=query,
        context=context
    )

    # Step 5: Prepare source information
    sources = []

    for doc in documents:
        sources.append({
            "filename": doc.metadata.get("filename"),
            "page": doc.metadata.get("page"),
            "document_id": doc.metadata.get("document_id"),
            "content": doc.page_content
        })

    # Step 6: Return final response
    return {
        "question": query,
        "answer": answer,
        "sources": sources,
        "total_chunks_retrieved": len(documents)
    }


# ==========================================
# 2. LOCAL TEST
# ==========================================

if __name__ == "__main__":

    question = "What activities improve English skills?"

    result = ask_question(
        query=question,
        k=3
    )

    print("\n========== RAGVERSE ==========")

    print("\nQuestion:")
    print(result["question"])

    print("\nGenerated Answer:")
    print(result["answer"])

    print("\nRetrieved Sources:")
    for source in result["sources"]:
        print(
            f"File: {source['filename']}, "
            f"Page: {source['page']}"
        )

    print(
        "\nTotal Retrieved Chunks:",
        result["total_chunks_retrieved"]
    )

    print("\n==============================")
