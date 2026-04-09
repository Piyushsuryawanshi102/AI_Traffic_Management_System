import cv2
import google.generative_ai as genai
from PIL import Image

class TrafficDetector:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def analyze(self, frame):
        # Convert CV2 (BGR) to PIL (RGB)
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)

        prompt = """
        Analyze image for traffic violations.
        Return JSON: {"violation": true/false, "type": "No Helmet/Red Light/None", "confidence": 0.0-1.0}
        """
        try:
            response = self.model.generate_content([prompt, pil_img])
            # In a real app, parse the JSON string response.text here
            # returning dummy data for safety in this example
            return {"violation": True, "type": "No Helmet", "confidence": 0.95}
        except Exception as e:
            print(f"AI Error: {e}")
            return None