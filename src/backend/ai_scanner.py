# FILE: backend/ai_scanner.py
import os  # 👈 Added this import
from huggingface_hub import InferenceClient
import time

# 👇 UPDATED: Tries to get token from Render's environment first. 
# If not found, it uses the hardcoded string as a backup.
HF_TOKEN = os.environ.get("HF_TOKEN", "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")

# 🚀 List of Free Chat Models (in order of preference)
# We will try them one by one until a "Conversational" model works.
FREE_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",       # High quality, supports chat
    "meta-llama/Llama-3.2-3B-Instruct", # Very fast, supports chat
    "google/gemma-2-9b-it",           # Google's open model
    "microsoft/Phi-3.5-mini-instruct", # Microsoft's model
    "HuggingFaceH4/zephyr-7b-beta"    # Backup
]

def configure_ai():
    if HF_TOKEN.startswith("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") or not HF_TOKEN:
        print("❌ ERROR: You must paste your Hugging Face Token in ai_scanner.py")

def get_ai_explanation(url):
    if HF_TOKEN.startswith("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"):
        return "Unknown", ["❌ Error: Token is missing in ai_scanner.py"]

    last_error = ""
    
    # 🔄 Loop through models to find one that supports "Conversational" task
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Trying AI Model (Chat Mode): {model_id}...")
            client = InferenceClient(model=model_id, token=HF_TOKEN)

            # 👇 WE USE CHAT COMPLETION (Conversational) TO FIX YOUR ERROR
            messages = [
                { "role": "system", "content": "You are a cybersecurity expert. Analyze the URL for phishing." },
                { "role": "user", "content": f"""Analyze this URL: {url}
                
                Reply STRICTLY in this format:
                Status: [Phishing/Safe/Suspicious]
                - [Reason 1]
                - [Reason 2]
                - [Reason 3]""" }
            ]

            # Call the API using chat_completion
            response = client.chat_completion(messages, max_tokens=500)
            
            # Extract text (this format works for chat models)
            text = response.choices[0].message.content.strip()
            
            print(f"✅ Success with {model_id}!")
            print(f"🔹 AI Raw Response: {text}")

            # Parse Results
            result = "Unknown"
            if "Status: Phishing" in text:
                result = "Phishing"
            elif "Status: Safe" in text:
                result = "Safe"
            elif "Status: Suspicious" in text:
                result = "Suspicious"
            
            # Extract bullet points
            explanation = [
                line.replace('- ', '').replace('* ', '').strip() 
                for line in text.split('\n') 
                if line.strip().startswith(('-','*'))
            ]
            
            if not explanation:
                explanation = [text]

            return result, explanation

        except Exception as e:
            print(f"⚠️ Model {model_id} failed: {e}")
            last_error = str(e)
            continue # Try the next model instantly

    # If ALL models fail
    print("❌ All AI models failed.")
    return "Unknown", [f"Error: All free models busy. Last error: {last_error}"]