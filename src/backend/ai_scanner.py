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

def configure_ai():
    if not HF_TOKEN:
        print("⚠️ WARNING: HF_TOKEN is empty in environment variables.")

def get_ai_explanation(url):
    if not HF_TOKEN:
        return "Unknown", ["❌ Error: Server environment is missing the AI Token."]

    last_error = ""
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Trying AI Model: {model_id}...")
            client = InferenceClient(model=model_id, token=HF_TOKEN)

            messages = [
                { "role": "system", "content": "You are a cybersecurity expert." },
                { "role": "user", "content": f"Analyze this URL for phishing: {url}. Reply with Status: [Safe/Phishing/Suspicious] and 3 short bullet reasons." }
            ]

            response = client.chat_completion(messages, max_tokens=500)
            text = response.choices[0].message.content.strip()
            
            result = "Safe"
            if "Phishing" in text: result = "Phishing"
            elif "Suspicious" in text: result = "Suspicious"
            
            explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
            return result, explanation if explanation else [text]

        except Exception as e:
            last_error = str(e)
            continue 

    return "Unknown", [f"Error: AI models are currently busy. {last_error}"]