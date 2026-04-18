import os
import uuid
import cv2
import time
import threading
import queue
import numpy as np
from typing import Optional, List
from pydantic import BaseModel

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.deps import require_role, get_current_user
from app.database import supabase
from app.utils import process_frame, detect_violations_from_frame

router = APIRouter(prefix="/cameras", tags=["Cameras"])

UPLOAD_FOLDER = "uploads/videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global Shared State
camera_frames = {}         # Encoded JPEGs for the UI
active_threads = {}        # Tracking active stream threads

# Hardware Locks
webcam_lock = threading.Lock()
webcam_in_use = False

class CameraRegister(BaseModel):
    location_name: str
    ip_address: str        # 👈 Used as the Universal Source (0 for webcam, or URL for others)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# ==========================================
# UNIVERSAL AI WORKER (DECOUPLED LOGIC)
# ==========================================

def ai_worker(camera_id: str, source_input: str):
    global webcam_in_use
    print(f"🤖 AI Node Initializing: {camera_id} via Source: {source_input}")
    
    is_webcam = (source_input == "0")
    source = 0 if is_webcam else source_input
    
    cap = None
    use_dummy = False

    # Prevent multiple threads from opening webcam 0 (Causes OpenCV MSMF crashes)
    if is_webcam:
        with webcam_lock:
            if webcam_in_use:
                print(f"⚠️ Webcam 0 is locked by another Node. Node {camera_id} entering Standby Mode.")
                use_dummy = True
            else:
                webcam_in_use = True
                
    if not use_dummy:
        # Using CAP_DSHOW on Windows prevents MSMF spam warnings for physical cameras
        backend = cv2.CAP_DSHOW if is_webcam and os.name == 'nt' else cv2.CAP_ANY
        cap = cv2.VideoCapture(source, backend)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    while camera_id in active_threads:
        if use_dummy:
            # Standby mode drops inference load and prevents hardware crashes
            time.sleep(2.0)
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "STANDBY: WEBCAM IN USE", (80, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            # Process empty frame just to keep the DB node alive
            process_frame(frame, camera_id=camera_id)
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if ret:
                camera_frames[camera_id] = buffer.tobytes()
            continue

        success, frame = cap.read()
        if not success:
            print(f"⚠️ Connection Lost for Node {camera_id}. Retrying...")
            cap.release()
            time.sleep(5)
            backend = cv2.CAP_DSHOW if is_webcam and os.name == 'nt' else cv2.CAP_ANY
            cap = cv2.VideoCapture(source, backend)
            continue
            
        process_frame(frame, camera_id=camera_id)
        
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        if ret:
            camera_frames[camera_id] = buffer.tobytes()
        
        time.sleep(0.01)
    
    if cap:
        cap.release()
    
    if is_webcam and not use_dummy:
        with webcam_lock:
            webcam_in_use = False
            
    print(f"🛑 Worker stopped for Node: {camera_id}")

# ==========================================
# API ENDPOINTS
# ==========================================

@router.get("/list")
def list_cameras(user=Depends(require_role("officer"))):
    cameras = supabase.table("surveillance_cameras").select("*").execute()
    return cameras.data

@router.post("/register")
def register_camera(camera_data: CameraRegister, user=Depends(require_role("officer"))):
    try:
        # 1. Register Camera Node using the 'ip_address' as the source
        payload = camera_data.dict()
        payload["is_active"] = True
        result = supabase.table("surveillance_cameras").insert(payload).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save Camera Node")
            
        new_cam = result.data[0]
        cam_id = str(new_cam['id'])
        
        # 2. AUTO-LINK: Provision Congestion Row
        congestion_payload = {
            "road_name": f"{camera_data.location_name} Junction",
            "area": camera_data.location_name,
            "camera_id": cam_id,
            "congestion_level": 0,
            "vehicle_count": 0
        }
        supabase.table("congested_roads").insert(congestion_payload).execute()
        
        # 3. Initialize Independent AI Worker for this node
        if cam_id not in active_threads:
            active_threads[cam_id] = True
            threading.Thread(
                target=ai_worker, 
                args=(cam_id, camera_data.ip_address), 
                daemon=True
            ).start()
        
        return {"message": "Node Activated & Threaded", "camera": new_cam}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/live/{camera_id}")
def live_feed(camera_id: str, token: str):
    """Authenticated MJPEG Stream targeting specific camera frames."""
    def frame_generator():
        while True:
            frame_bytes = camera_frames.get(camera_id)
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.04) # Control stream bitrate
        
    return StreamingResponse(frame_generator(), media_type='multipart/x-mixed-replace; boundary=frame')

@router.delete("/{camera_id}")
def delete_camera(camera_id: str, user=Depends(require_role("officer"))):
    try:
        # 1. Kill the background thread safely
        if camera_id in active_threads:
            del active_threads[camera_id]
        
        # 2. Remove from database
        result = supabase.table("surveillance_cameras").delete().eq("id", camera_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Camera Node not found")

        # 3. Cleanup associated congestion row
        supabase.table("congested_roads").delete().eq("camera_id", camera_id).execute()

        if camera_id in camera_frames:
            del camera_frames[camera_id]

        return {"message": "Node decommissioned successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# SYSTEM BOOTSTRAP
# ==========================================

def initialize_active_streams():
    """Reconnects all active cameras to their specific sources on restart."""
    try:
        res = supabase.table("surveillance_cameras").select("*").eq("is_active", True).execute()
        for cam in res.data:
            cam_id = str(cam['id'])
            source_link = cam.get('ip_address')
            
            if cam_id not in active_threads and source_link:
                active_threads[cam_id] = True
                threading.Thread(
                    target=ai_worker, 
                    args=(cam_id, source_link), 
                    daemon=True
                ).start()
                print(f"✅ AI Node Re-linked: {cam['location_name']}")
    except Exception as e:
        print(f"Bootstrap Error: {e}")

# Delay start to ensure database is ready
threading.Timer(3.0, initialize_active_streams).start()