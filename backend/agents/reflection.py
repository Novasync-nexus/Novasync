"""
Reflection Agent

Responsibilities:
- Review generated answer
- Detect hallucinations
- Improve answer
"""
from backend.services.llm import LLMService

class ReflectionAgent:
    @staticmethod
    def verify_and_improve(question: str, generated_answer: str, context: str) -> str:
        """
        Reflects on the answer to ensure it is grounded in context.
        If hallucinated, returns an improved version. Otherwise returns the original.
        Since streaming requires instant output, this is typically used in post-processing 
        or for non-streaming workflows.
        """
        prompt = f"""
        You are a rigorous factual verification agent. Review the provided answer against the context.
        Does the answer contain any hallucinations or facts NOT present in the context?
        If it is fully grounded, output the exact word "PASS".
        If it contains errors or hallucinations, rewrite the answer to be strictly accurate to the context.
        
        Question: {question}
        
        Context:
        {context}
        
        Answer to review:
        {generated_answer}
        
        Output:
        """
        response = LLMService.call(prompt, max_tokens=1000, temperature=0.0).strip()
        
        if response.startswith("PASS"):
            return generated_answer
        return response
