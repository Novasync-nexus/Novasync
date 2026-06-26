import google.generativeai as genai
from backend.config import settings

# Initialize Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use the recommended model
model = genai.GenerativeModel('gemini-2.5-flash')

PROMPT_TEMPLATE = """You are an AI assistant.
Answer the user's question strictly using the provided context.
If the answer is not present in the context, respond:
"I could not find the answer in the uploaded documents."

Context:
{context}

Question:
{question}

Answer:"""

def generate_rag_response_stream(question: str, context: str):
    """Generates a streaming response using Gemini API."""
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)
    # Return the generator
    response = model.generate_content(prompt, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text
