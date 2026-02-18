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

        client = InferenceClient(token=HF_TOKEN)

        # Switching to a more modern and widely supported model
        # Using chat.completions.create handles the 'conversational' task correctly
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.2-3B-Instruct", 
            messages=[
                {"role": "system", "content": "You are a cybersecurity expert."},
                {"role": "user", "content": f"Analyze this URL for phishing: {url}. Reply STRICTLY in this format:\nStatus: [Safe/Phishing/Suspicious]\n- Reason 1\n- Reason 2\n- Reason 3"}
            ],
            max_tokens=200
        )

        text = response.choices[0].message.content
        print(f"🔹 AI Response: {text}")

        # Parsing Logic
        result = "Suspicious"
        if "Status: Safe" in text: result = "Safe"
        elif "Status: Phishing" in text: result = "Phishing"
        
        explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
        
        return result, explanation if explanation else [text.strip()]

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return "Unknown", [f"Error: {str(e)}"]