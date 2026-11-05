## Removes unnecessary whitespace.
## Normalizes extracted PDF text.
## Removes empty pages.
## Preserves page numbers and source metadata.


import re
from langchain_core.documents import Document


def preprocess_documents(
    documents: list[Document]
) -> list[Document]:

    cleaned_documents = []

    for doc in documents:

        # Normalize whitespace
        cleaned_text = re.sub(
            r"\s+",
            " ",
            doc.page_content
        ).strip()

        # Ignore empty pages
        if not cleaned_text:
            continue

        # Preserve original metadata
        cleaned_doc = Document(
            page_content=cleaned_text,
            metadata=doc.metadata.copy()
        )

        cleaned_documents.append(cleaned_doc)

    return cleaned_documents
