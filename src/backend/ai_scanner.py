# FILE: backend/ai_scanner.py
import os
from huggingface_hub import InferenceClient
import time

# 👇 This gets the token from Render, OR uses your hardcoded one as a valid backup.
HF_TOKEN = os.environ.get("HF_TOKEN", "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")

FREE_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "google/gemma-2-9b-it",
    "microsoft/Phi-3.5-mini-instruct",
    "HuggingFaceH4/zephyr-7b-beta"
]

def configure_ai():
    # Only fail if the token is completely empty or explicitly the placeholder text "PASTE_HERE"
    if not HF_TOKEN or HF_TOKEN == "hf_PASTE_YOUR_TOKEN_HERE":
        print("❌ ERROR: You must paste your Hugging Face Token in ai_scanner.py")

def get_ai_explanation(url):
    # Only fail if empty
    if not HF_TOKEN or HF_TOKEN == "hf_PASTE_YOUR_TOKEN_HERE":
        return "Unknown", ["❌ Error: Token is missing in ai_scanner.py"]

    last_error = ""
    
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Trying AI Model (Chat Mode): {model_id}...")
            client = InferenceClient(model=model_id, token=HF_TOKEN)

            messages = [
                { "role": "system", "content": "You are a cybersecurity expert. Analyze the URL for phishing." },
                { "role": "user", "content": f"""Analyze this URL: {url}
                
                Reply STRICTLY in this format:
                Status: [Phishing/Safe/Suspicious]
                - [Reason 1]
                - [Reason 2]
                - [Reason 3]""" }
            ]

            response = client.chat_completion(messages, max_tokens=500)
            text = response.choices[0].message.content.strip()
            
            print(f"✅ Success with {model_id}!")
            print(f"🔹 AI Raw Response: {text}")

            result = "Unknown"
            if "Status: Phishing" in text:
                result = "Phishing"
            elif "Status: Safe" in text:
                result = "Safe"
            elif "Status: Suspicious" in text:
                result = "Suspicious"
            
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
            continue 

    print("❌ All AI models failed.")
    return "Unknown", [f"Error: All free models busy. Last error: {last_error}"]