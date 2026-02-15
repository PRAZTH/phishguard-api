import os
from huggingface_hub import InferenceClient

HF_TOKEN = os.environ.get("HF_TOKEN", "")

# We updated the model list to more recent, stable ones
FREE_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct", 
    "mistralai/Mistral-7B-Instruct-v0.3",
    "microsoft/Phi-3.5-mini-instruct",
    "google/gemma-2-9b-it"
]

def configure_ai():
    if not HF_TOKEN:
        print("⚠️ WARNING: No HF_TOKEN found.")

def get_ai_explanation(url):
    if not HF_TOKEN:
        return "Unknown", ["❌ Error: AI Token missing."]

    last_error = ""
    for model_id in FREE_MODELS:
        try:
            print(f"🔄 Connecting to: {model_id}...")
            # The client automatically handles the new 'router' URL
            client = InferenceClient(token=HF_TOKEN)

            # Using the modern 'chat.completions' style
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert."},
                    {"role": "user", "content": f"Analyze this URL for phishing: {url}. Reply: Status: [Safe/Phishing/Suspicious] and 3 short reasons."}
                ],
                max_tokens=300
            )

            text = response.choices[0].message.content.strip()
            
            result = "Safe"
            if "Phishing" in text: result = "Phishing"
            elif "Suspicious" in text: result = "Suspicious"
            
            explanation = [line.strip() for line in text.split('\n') if line.strip().startswith(('-', '*'))]
            return result, explanation if explanation else [text.strip()]

        except Exception as e:
            print(f"⚠️ {model_id} failed: {str(e)}")
            last_error = str(e)
            continue 

    return "Unknown", [f"Error: API endpoint updated. Please use new router. {last_error}"]