import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

def configure_ai():
    if not HF_TOKEN:
        print("⚠️ WARNING: No HF_TOKEN found.")

def get_ai_explanation(url):
    try:
        if not HF_TOKEN:
            return "Unknown", ["❌ Error: AI Token missing."]

        # Initialize client
        client = InferenceClient(token=HF_TOKEN)

        # Use chat.completions.create for 'conversational' task support
        response = client.chat.completions.create(
            model="HuggingFaceH4/zephyr-7b-beta",
            messages=[
                {"role": "system", "content": "You are a cybersecurity expert. Analyze URLs for phishing."},
                {"role": "user", "content": f"Analyze this URL: {url}. Reply STRICTLY with Status: [Safe/Phishing/Suspicious] and 3 bullet points."}
            ],
            max_tokens=200
        )

        text = response.choices[0].message.content
        print(f"🔹 AI Raw Response: {text}")

        # Simple parsing
        result = "Suspicious"
        if "Status: Safe" in text: result = "Safe"
        elif "Status: Phishing" in text: result = "Phishing"
        
        explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
        
        return result, explanation if explanation else [text.strip()]

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return "Unknown", [f"Error: {str(e)}"]