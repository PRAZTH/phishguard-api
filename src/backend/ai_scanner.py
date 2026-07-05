import os
from huggingface_hub import InferenceClient

# Pulls securely from Render Environment Variables at runtime
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# Up-to-date, fast, and free conversational models on HF Router
FREE_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct", 
    "mistralai/Mistral-7B-Instruct-v0.3",
    "microsoft/Phi-3.5-mini-instruct",
    "google/gemma-2-9b-it"
]

def configure_ai():
    """Satisfies app.py import verification on startup"""
    if not HF_TOKEN:
        print("⚠️ WARNING: No HF_TOKEN found in system environment variables.")
    else:
        print("✅ PhishGuard AI Engine successfully mapped to environment variables.")

def get_ai_explanation(url):
    if not HF_TOKEN:
        return "Unknown", ["❌ Error: Server environment is missing the AI Token."]

    last_error = ""
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Connecting to Hugging Face Router: {model_id}...")
            # The modern client automatically maps connections to router.huggingface.co
            client = InferenceClient(token=HF_TOKEN)

            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "You are an expert cybersecurity scanner analyzer."},
                    {"role": "user", "content": f"Analyze this URL for phishing vulnerabilities: {url}. Reply STRICTLY in this format:\nStatus: [Safe/Phishing/Suspicious]\n- Reason 1\n- Reason 2"}
                ],
                max_tokens=300
            )

            text = response.choices[0].message.content.strip()
            print(f"✅ Success response from {model_id}!")
            
            # Parse safety assessment status
            result = "Safe"
            if "Phishing" in text: 
                result = "Phishing"
            elif "Suspicious" in text: 
                result = "Suspicious"
            
            # Extract bulleted point justifications
            explanation = [
                line.strip() for line in text.split('\n') 
                if line.strip().startswith(('-', '*'))
            ]
            
            return result, explanation if explanation else [text.strip()]

        except Exception as e:
            print(f"⚠️ Model {model_id} handshake failed: {str(e)}")
            last_error = str(e)
            continue 

    return "Unknown", [f"Error: All endpoint fallbacks failed. Details: {last_error}"]