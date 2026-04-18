import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # 👈 Add this import
from .routers import violations, challans, payments, traffic, parking, cameras
from .auth import router as auth_router 
from fastapi.middleware.cors import CORSMiddleware
from .routers import violations, challans, payments, traffic, parking, cameras, citizen
from app.admin_module import officer_mgmt
from app.admin_module import dashboard
from app.admin_module import health
from app.admin_module import audit
from app.admin_module import oracle
from app.admin_module import settings

app = FastAPI(
    title="Bhopal PTU Traffic Backend",
    description="AI-Powered Traffic Violation & Management System",
    version="1.2.0"
)

# Get the absolute path to the static directory inside 'app'
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(CURRENT_DIR, "static")

# 🛡️ Middleware MUST be defined before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 👈 Allowed all origins for Vercel/Production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

# 🔥 MOUNT STATIC FILES HERE
# This allows http://127.0.0.1:8000/static/evidence/filename.jpg to work
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def root():
    return {
        "status": "Online",
        "system": "Bhopal HQ Traffic Command",
        "version": "1.2.0"
    }

app.include_router(auth_router, tags=["Security"])
app.include_router(violations.router, tags=["AI Detection"])
app.include_router(challans.router, tags=["DBMS"])
app.include_router(payments.router, tags=["Finance"])
app.include_router(traffic.router, tags=["Congestion"])
app.include_router(parking.router, tags=["Infrastructure"])
app.include_router(cameras.router, tags=["Surveillance"])
app.include_router(citizen.router, tags=["Citizen Portal"])
app.include_router(officer_mgmt.router, tags=["Admin: Officer Management"])
app.include_router(dashboard.router, tags=["Admin: Unified Dashboard"])
app.include_router(health.router, tags=["Admin: System Health"])
app.include_router(audit.router, tags=["Admin: Personnel Audit"])
app.include_router(oracle.router, tags=["Admin: Oracle Analytics"])
app.include_router(settings.router, tags=["Admin: Architect"])