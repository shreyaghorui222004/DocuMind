from langchain_community.document_loaders import PyPDFLoader


def load_pdf(file_path: str):

    # Initialize PDF loader
    loader = PyPDFLoader(file_path)

    # Extract PDF content
    documents = loader.load()

    return documents