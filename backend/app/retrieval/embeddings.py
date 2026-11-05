
import os
from dotenv import load_dotenv
from langchain_cohere import CohereEmbeddings

# Load environment variables from backend/.env
load_dotenv()


def get_embeddings():
    """
    Initialize Cohere's cloud-based embedding model.
    """

    api_key = os.getenv("COHERE_API_KEY")

    if not api_key:
        raise ValueError("COHERE_API_KEY is missing from .env")

    return CohereEmbeddings(
        model="embed-english-v3.0",
        cohere_api_key=api_key
    )


# Reusable embedding instance
embeddings = get_embeddings()
