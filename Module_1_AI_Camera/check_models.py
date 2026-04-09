import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# If .env fails, paste your key here manually to test:
# api_key = "AIzaSyCi..." 

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    data = response.json()
    
    print("\n✅ AVAILABLE MODELS FOR YOUR KEY:")
    print("-" * 40)
    
    if 'models' in data:
        for m in data['models']:
            # We only care about models that can handle images ("vision" or "generateContent")
            if "generateContent" in m['supportedGenerationMethods']:
                print(f"Name: {m['name']}")
    else:
        print("❌ Error:", data)
        
except Exception as e:
    print("❌ Script failed:", e)