from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.orchestrator import run_mission

app = FastAPI(
    title="PocketPilot AI",
    description="Offline-first multi-agent assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MissionRequest(BaseModel):
    goal: str

@app.get("/")
def home():
    return {
        "message": "PocketPilot AI backend is running",
        "status": "ok"
    }

@app.post("/mission")
def create_mission(request: MissionRequest):
    return run_mission(request.goal)