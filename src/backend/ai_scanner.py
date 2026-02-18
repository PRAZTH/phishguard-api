import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv # Run: pip install python-dotenv

# Load variables from a local .env file
load_dotenv()

# Securely pull the token from the environment
HF_TOKEN = os.getenv("HF_TOKEN")

def configure_ai():
    """Checks if the token is present."""
    if not HF_TOKEN:
        print("❌ ERROR: HF_TOKEN environment variable is missing!")

def get_ai_explanation(url):
    try:
        if not HF_TOKEN:
            return "Unknown", ["❌ Hugging Face Token is missing."]

        # Use the variable instead of a hardcoded string
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

        response = client.text_generation(prompt, max_new_tokens=200)
        text = response
        
        result = "Unknown"
        if "Status: Phishing" in text: result = "Phishing"
        elif "Status: Safe" in text: result = "Safe"
        elif "Status: Suspicious" in text: result = "Suspicious"
        
        explanation = [line.replace('- ', '').strip() for line in text.split('\n') if line.strip().startswith('-')]

        if result == "Unknown":
            result = "Suspicious"
            explanation = [text.strip()]

        return result, explanation

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return "Unknown", [f"Error: {str(e)}"]