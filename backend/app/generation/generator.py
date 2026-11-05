
import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables
load_dotenv()


# ==========================================
# 1. INITIALIZE GROQ LLM
# ==========================================

def get_llm():

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is missing from .env"
        )

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.2,
        groq_api_key=api_key
    )

    return llm


# ==========================================
# 2. RAG ANSWER FORMATTING INSTRUCTIONS
# ==========================================

SYSTEM_PROMPT = """
You are RAGVerse, an intelligent PDF
question-answering assistant.

Your job is to answer questions using ONLY
the information provided in the retrieved context.

==============================
ANSWERING RULES
==============================

1. Never invent or assume information.
2. Do not use information outside the context.
3. If the answer is not available in the context,
   clearly say that the document does not contain
   sufficient information.
4. Answer the user's actual question.
5. Avoid unnecessary introductions and conclusions.
6. Preserve important names, facts, examples,
   and terminology from the document.

==============================
FORMATTING RULES
==============================

1. Use Markdown formatting only.
2. Start with a meaningful heading when appropriate.
3. Use ## for major headings.
4. Use ### for subheadings.
5. Use bullet points (-) for lists.
6. Use numbered lists for sequential instructions.
7. Use **bold** for important keywords.
8. Keep each bullet point concise and readable.
9. Separate sections with blank lines.
10. Use Markdown tables only when genuinely useful.
11. Never generate HTML tags such as <br>, <p>,
    <div>, or <li>.
12. Never return raw HTML.
13. Do not combine multiple unrelated points
    into one long paragraph.

==============================
ANSWER STYLE
==============================

- Be clear and informative.
- Use simple, understandable language.
- Organize long answers into sections.
- Include examples only when supported by context.
- For summaries, organize information by topic.
- For lists, use individual bullet points.
- Avoid repeating the same information.

Your final answer must be clean, properly
formatted Markdown suitable for a chat interface.
"""


# ==========================================
# 3. GENERATE ANSWER
# ==========================================

def generate_answer(query: str, context: str):

    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if not context or not context.strip():
        raise ValueError("Context cannot be empty")

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),

        (
            "human",
            """
            DOCUMENT CONTEXT:
            {context}

            USER QUESTION:
            {query}

            Generate a relevant answer using
            the document context.

            Return the answer in clean Markdown.
            """
        )
    ])

    # Create LangChain chain
    chain = prompt | llm

    # Generate response
    response = chain.invoke({
        "context": context,
        "query": query
    })

    # Extract generated text
    answer = response.content

    if not isinstance(answer, str):
        raise ValueError("Groq returned an invalid response")

    answer = answer.strip()

    if not answer:
        raise ValueError("Groq returned an empty answer")

    return answer
