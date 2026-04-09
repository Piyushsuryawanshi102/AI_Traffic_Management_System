import cv2
import os
import time
import base64
import requests
import json
from dotenv import load_dotenv
from uploader import CloudUploader

load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

uploader = CloudUploader(SUPABASE_URL, SUPABASE_KEY)

def analyze_frame(frame):
    print("🤖 Analyzing frame...")
    
    # 1. Encode image to Base64
    _, buffer = cv2.imencode('.jpg', frame)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
# UPDATED URL: Using the model found in your list (Gemini 2.0 Flash)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"   
    payload = {
        "contents": [{
            "parts": [
                {"text": "Analyze this traffic image. Return ONLY JSON: {\"violation\": true, \"type\": \"No Helmet\", \"confidence\": 0.95}. If no violation, return {\"violation\": false}."},
                {"inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_base64
                }}
            ]
        }],
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
    }
    
    try:
        response = requests.post(url, json=payload)
        result = response.json()
        
        # --- DEBUGGING: Print the error if Google refuses ---
        if "candidates" not in result:
            print("\n⚠️ GOOGLE BLOCKED REQUEST. RAW RESPONSE:")
            print(json.dumps(result, indent=2))
            return None
        # --------------------------------------------------

        # 4. Parse Response
        text = result['candidates'][0]['content']['parts'][0]['text']
        text = text.replace("```json", "").replace("```", "").strip()
        
        data = json.loads(text)
        
        if data.get("violation"):
            return data
        return None
        
    except Exception as e:
        print(f"❌ AI Error Details: {e}")
        return None

# --- MAIN LOOP ---
cap = cv2.VideoCapture(0)

print("🚦 AI Camera Active (Universal Mode). Press 'S' to scan, 'Q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret: break
    
    cv2.imshow("Bhopal Traffic AI", frame)
    key = cv2.waitKey(1) & 0xFF
    
    if key == ord('s'):
        result = analyze_frame(frame)
        if result:
            uploader.upload_violation(frame, result)
        else:
            print("👍 No violation detected.")
            
    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()