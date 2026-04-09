import os
import time
import cv2
import requests
import json

class CloudUploader:
    def __init__(self, url, key):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        self.storage_headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "image/jpeg"
        }

    def upload_violation(self, frame, violation_data):
        timestamp = int(time.time())
        filename = f"violation_{timestamp}.jpg"
        
        # 1. Save frame locally
        cv2.imwrite(filename, frame)
        print(f"☁️ Uploading evidence: {filename}...")

        try:
            # 2. Upload Image via REST API
            with open(filename, 'rb') as f:
                data = f.read()
                
            upload_url = f"{self.url}/storage/v1/object/evidence/{filename}"
            response = requests.post(upload_url, headers=self.storage_headers, data=data)
            
            if response.status_code != 200:
                print(f"❌ Upload Error: {response.text}")
                return

            # 3. Construct Public URL
            img_url = f"{self.url}/storage/v1/object/public/evidence/{filename}"
            
            # 4. Insert Record via REST API
            record = {
                "violation_type": violation_data['type'],
                "confidence_score": violation_data['confidence'],
                "evidence_image_url": img_url,
                "status": "pending"
            }
            
            db_url = f"{self.url}/rest/v1/violations"
            db_response = requests.post(db_url, headers=self.headers, json=record)
            
            if db_response.status_code == 201:
                print(f"✅ Success! Violation logged: {violation_data['type']}")
            else:
                print(f"❌ DB Error: {db_response.text}")

        except Exception as e:
            print(f"❌ Critical Error: {e}")
            
        finally:
            if os.path.exists(filename):
                os.remove(filename)