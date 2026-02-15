import os
from huggingface_hub import InferenceClient

# This grabs the token you provided from Render's secret settings
HF_TOKEN = os.environ.get("HF_TOKEN", "")

FREE_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "google/gemma-2-9b-it",
    "microsoft/Phi-3.5-mini-instruct",
    "HuggingFaceH4/zephyr-7b-beta"
]

def get_ai_explanation(url):
    if not HF_TOKEN:
        return "Unknown", ["❌ Error: Server environment is missing the AI Token."]

    last_error = ""
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Trying AI Model: {model_id}...")
            client = InferenceClient(model=model_id, token=HF_TOKEN)

            # 👇 FIXED: Using the standard 'post' method or 'chat' if supported
            # This is the most compatible way for free inference models
            prompt = f"System: You are a cybersecurity expert.\nUser: Analyze this URL for phishing: {url}. Reply with Status: [Safe/Phishing/Suspicious] and 3 short bullet reasons."
            
            # Using text_generation as a fallback which is highly stable
            text = client.text_generation(prompt, max_new_tokens=500)
            
            print(f"✅ Success with {model_id}!")
            
            # Simple parsing logic
            result = "Safe"
            if "Phishing" in text: result = "Phishing"
            elif "Suspicious" in text: result = "Suspicious"
            
            explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
            return result, explanation if explanation else [text.strip()]

        except Exception as e:
            print(f"⚠️ {model_id} failed: {str(e)}")
            last_error = str(e)
            continue 

    return "Unknown", [f"Error: AI models are currently busy. {last_error}"]