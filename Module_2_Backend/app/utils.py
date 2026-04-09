import cv2
import uuid
import time
import requests 
import threading
import os
import re
import numpy as np  # 🔥 Added for color masking math
from datetime import datetime
from ultralytics import YOLO
import easyocr
import torch
from app.database import supabase

# 1. INITIALIZATION & DIRECTORY SETUP
ai_lock = threading.Lock() 

# Regex for Standard Indian Number Plates
INDIAN_PLATE_PATTERN = r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EVIDENCE_PATH = os.path.join(BASE_DIR, "static", "evidence")
os.makedirs(EVIDENCE_PATH, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 OMEN 16 AI Engine Status: Running on {device.upper()}")

# Load YOLOv8 Nano for high-speed detection on OMEN 16
det_model = YOLO("app/models/yolov8n.pt") 
det_model.to(device)
plate_reader = easyocr.Reader(['en'], gpu=True if device == "cuda" else False)

recent_violations = {}

# --- 🔥 NEW: AMBULANCE RED-PIXEL HEURISTIC ---
def is_ambulance_heuristic(crop):
    """
    Analyzes the vehicle crop in HSV color space to detect 
    emergency red pixel density.
    """
    if crop.size == 0:
        return False
    
    # Convert to HSV for robust color isolation
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    
    # Define range for Emergency Red (Standard Siren/Decal Red)
    # Mask 1: Lower red spectrum
    lower_red1 = np.array([0, 120, 70])
    upper_red1 = np.array([10, 255, 255])
    # Mask 2: Upper red spectrum (wraps around in HSV)
    lower_red2 = np.array([170, 120, 70])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)
    
    # Calculate percentage of red pixels relative to vehicle size
    red_pixel_pct = (np.sum(red_mask > 0) / (crop.shape[0] * crop.shape[1])) * 100
    
    # Threshold: If > 3% is red, classify as Emergency Vehicle
    return red_pixel_pct > 3.0

# 2. OPTIMIZED OCR WITH CLEAR VISION PRE-PROCESSING
def extract_plate(frame, bbox):
    x1, y1, x2, y2 = bbox
    h, w = frame.shape[:2]
    crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
    
    if crop.size == 0:
        return "UNKNOWN"
    
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    processed_crop = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
    res = plate_reader.readtext(processed_crop)
    if res:
        raw_plate = res[0][-2].replace(" ", "").replace("-", "").upper()
        if re.match(INDIAN_PLATE_PATTERN, raw_plate):
            return raw_plate
            
    return "UNKNOWN"

# 3. ASYNC NOTIFICATIONS
def send_sms_background(plate, v_type):
    api_url = "http://127.0.0.1:8000/citizen/report-violation"
    params = {"plate": plate, "v_type": v_type}
    try:
        requests.post(api_url, params=params, timeout=5) 
        print(f"📲 SMS Alert sent for {plate}")
    except:
        pass

# 4. DATABASE LOGGING & IMAGE ARCHIVING
def post_violation_direct(v_type, plate_number, camera_id, confidence, violation_crop):
    current_time = time.time()
    cache_key = f"{plate_number}_{v_type}"
    
    if cache_key in recent_violations and current_time - recent_violations[cache_key] < 10:
        return 
        
    recent_violations[cache_key] = current_time
    img_filename = f"ev_{uuid.uuid4().hex[:8]}.jpg"
    img_save_path = os.path.join(EVIDENCE_PATH, img_filename)
    
    if cv2.imwrite(img_save_path, violation_crop):
        evidence_url = f"http://127.0.0.1:8000/static/evidence/{img_filename}"
    else:
        evidence_url = None

    data = {
        "camera_id": str(camera_id), 
        "violation_type": v_type,
        "evidence_image_url": evidence_url, 
        "confidence_score": float(confidence),
        "plate_number": plate_number if plate_number != "UNKNOWN" else None,
        "status": "pending"
    }
    
    try:
        supabase.table("violations").insert(data).execute()
        print(f"✅ AI ARCHIVED: {v_type} | Plate: {plate_number}")

        if plate_number != "UNKNOWN":
            threading.Thread(target=send_sms_background, args=(plate_number, v_type), daemon=True).start()
    except Exception as e:
        print(f"❌ DB Archive Error: {e}")

# 5. MAIN PROCESSING LOOP
def process_frame(frame, camera_id):
    vehicle_count = 0
    is_emergency = False  # 🔥 Track if any ambulance is in frame
    
    with ai_lock:
        results = det_model(frame, verbose=True)

    for r in results:
        for box, cls, conf in zip(r.boxes.xyxy, r.boxes.cls, r.boxes.conf):
            x1, y1, x2, y2 = map(int, box)
            class_id = int(cls)
            confidence = float(conf)
            label = det_model.names[class_id]
            
            # 1. Standard Vehicle Counting
            if class_id in [2, 3, 5, 7]: 
                vehicle_count += 1
                
                # 🔥 2. AMBULANCE CHECK: If it's a Truck/Van class, check for Red-Pixel signature
                if class_id in [5, 7]: # Bus/Truck (Van-like shapes)
                    crop = frame[max(0,y1):min(frame.shape[0],y2), max(0,x1):min(frame.shape[1],x2)]
                    if is_ambulance_heuristic(crop):
                        is_emergency = True
                        label = "AMBULANCE"

            detected_violations = []
            if class_id == 0: 
                detected_violations.append("No Helmet")

            # UI Feedback with Dynamic Colors
            # If emergency, use a pulsing RED border, otherwise Green/Violator Red
            color = (0, 0, 255) if (detected_violations or is_emergency) else (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{label} {confidence:.2f}", (x1, y1-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if detected_violations:
                plate_number = extract_plate(frame, [x1, y1, x2, y2])
                crop = frame[max(0,y1):min(frame.shape[0],y2), max(0,x1):min(frame.shape[1],x2)]
                for v in detected_violations:
                    post_violation_direct(v, plate_number, camera_id, confidence, crop)

    # 🔥 SYNC TELEMETRY WITH EMERGENCY FLAG
    try:
        density = min(100, int((vehicle_count / 20) * 100))
        
        supabase.table("congested_roads").update({
            "vehicle_count": vehicle_count,      
            "congestion_level": density,
            "is_emergency": is_emergency,  # 👈 Crucial for Surveillance Tab auto-green
            "last_updated": datetime.utcnow().isoformat()
        }).eq("camera_id", str(camera_id)).execute() 
        
        if is_emergency:
            print(f"🚨 EMERGENCY DETECTED AT NODE {camera_id[:6]} - TRIGERING GREEN WAVE")
        else:
            print(f"📊 Live Node Sync: {vehicle_count} Veh | {density}% Load | ID: {camera_id[:6]}")

    except Exception as e:
        print(f"❌ Telemetry Sync Error: {e}")

def detect_violations_from_frame(input_data, is_video=False, camera_id="CAM001"):
    if is_video:
        cap = cv2.VideoCapture(input_data)
        while True:
            ret, frame = cap.read()
            if not ret: break
            process_frame(frame, camera_id)
        cap.release()
    else:
        process_frame(input_data, camera_id)