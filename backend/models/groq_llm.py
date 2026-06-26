from groq import Groq
from backend.config import settings

# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

# Model: Llama 3.3 70B — fast, powerful, free tier
GROQ_MODEL = "llama-3.3-70b-versatile"

PROMPT_TEMPLATE = """You are a helpful AI assistant for document Q&A.
Answer the user's question strictly using the provided context from their uploaded documents.
Be concise, accurate, and directly answer the question.
If the answer is not found in the context, say: "I could not find the answer in the uploaded documents."

Context:
{context}

Question:
{question}

Answer:"""


def generate_rag_response_stream(question: str, context: str):
    """Generates a streaming response using Groq API (Llama 3.3 70B)."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
        yield "⚠️ **Error:** You need to add a valid Groq API key to the `.env` file and restart the backend server."
        return

    prompt = PROMPT_TEMPLATE.format(context=context, question=question)

    try:
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            temperature=0.3,
            max_tokens=1024,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        yield f"⚠️ **Error from Groq API:** {str(e)}"
