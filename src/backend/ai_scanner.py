import os
from huggingface_hub import InferenceClient

# Get the token from Render Environment Variables
HF_TOKEN = os.environ.get("HF_TOKEN", "")

FREE_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "google/gemma-2-9b-it",
    "microsoft/Phi-3.5-mini-instruct",
    "HuggingFaceH4/zephyr-7b-beta"
]

# 👇 THIS IS THE MISSING FUNCTION
def configure_ai():
    if not HF_TOKEN:
        print("⚠️ WARNING: No HF_TOKEN found in environment variables.")
    else:
        print("✅ AI Scanner configured with Token.")

def get_ai_explanation(url):
    if not HF_TOKEN:
        return "Unknown", ["❌ Error: AI Token is missing from server."]

    last_error = ""
    for model_id in FREE_MODELS:
        try:
            client = InferenceClient(model=model_id, token=HF_TOKEN)
            prompt = f"Analyze this URL for phishing: {url}. Reply with Status: [Safe/Phishing/Suspicious] and 3 short bullet reasons."
            
            # Using stable text_generation
            text = client.text_generation(prompt, max_new_tokens=500)
            
            result = "Safe"
            if "Phishing" in text: result = "Phishing"
            elif "Suspicious" in text: result = "Suspicious"
            
            explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
            return result, explanation if explanation else [text.strip()]

        except Exception as e:
            last_error = str(e)
            continue 

    return "Unknown", [f"Error: AI models busy. {last_error}"]