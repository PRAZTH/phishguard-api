# FILE: backend/ai_scanner.py
from huggingface_hub import InferenceClient
import re

# 👇 PASTE YOUR HUGGING FACE TOKEN HERE (starts with hf_)
HF_TOKEN = "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"

def configure_ai():
    """Checks if the token is present."""
    if HF_TOKEN == "hf_PASTE_YOUR_TOKEN_HERE" or not HF_TOKEN:
        print("❌ ERROR: You must paste your Hugging Face Token in ai_scanner.py")

def get_ai_explanation(url):
    try:
        if HF_TOKEN == "hf_PASTE_YOUR_TOKEN_HERE":
            return "Unknown", ["❌ Hugging Face Token is missing."]

        # We use a free, fast model suitable for analysis
        client = InferenceClient(model="HuggingFaceH4/zephyr-7b-beta", token=HF_TOKEN)

        prompt = f"""<|system|>
You are a cybersecurity expert. Analyze the following URL for phishing risks.
Reply STRICTLY in this format:
Status: [Phishing/Safe/Suspicious]
- [Reason 1]
- [Reason 2]
- [Reason 3]
</s>
<|user|>
Analyze this URL: {url}
</s>
<|assistant|>"""

        # Call the API
        response = client.text_generation(prompt, max_new_tokens=200)
        text = response
        
        print(f"🔹 AI Raw Response: {text}") # Debugging

        # Parsing Logic
        result = "Unknown"
        explanation = []

        if "Status: Phishing" in text:
            result = "Phishing"
        elif "Status: Safe" in text:
            result = "Safe"
        elif "Status: Suspicious" in text:
            result = "Suspicious"
        
        # Extract bullet points
        explanation = [line.replace('- ', '').strip() for line in text.split('\n') if line.strip().startswith('-')]

        if result == "Unknown":
            # Fallback if AI didn't follow format exactly
            result = "Suspicious"
            explanation = [text.strip()]

        return result, explanation

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return "Unknown", [f"Error: {str(e)}"]