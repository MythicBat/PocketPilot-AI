from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from app.agents.orchestrator import run_mission
from app.database import init_db, SessionLocal, Mission, Memory

app = FastAPI(
    title="PocketPilot AI",
    description="Offline-first multi-agent assistant.",
    version="1.0.0",
    lifespan=lifespan
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


@app.get("/")
def home():
    return {
        "message": "PocketPilot AI backend is running",
        "status": "ok"
    }


@app.post("/mission")
def create_mission(request: MissionRequest):
    result = run_mission(request.goal)

    db = SessionLocal()
    saved_mission = Mission(
        goal=request.goal,
        mode=result["mode"],
        final_answer=result["final_answer"]
    )
    db.add(saved_mission)
    db.commit()
    db.refresh(saved_mission)
    db.close()

    result["mission_id"] = saved_mission.id
    return result


@app.get("/missions")
def get_missions():
    db = SessionLocal()
    missions = db.query(Mission).order_by(Mission.created_at.desc()).all()
    db.close()

    return [
        {
            "id": mission.id,
            "goal": mission.goal,
            "mode": mission.mode,
            "final_answer": mission.final_answer,
            "created_at": mission.created_at
        }
        for mission in missions
    ]

@app.get("/memories")
def get_memories():
    db = SessionLocal()
    memories = db.query(Memory).order_by(Memory.created_at.desc()).all()
    db.close()

    return [
        {
            "id": memory.id,
            "content": memory.content,
            "category": memory.category,
            "created_at": memory.created_at
        }
        for memory in memories
    ]

class MemoryRequest(BaseModel):
    content: str
    category: str = "preference"

@app.post("/memories")
def create_memory(request: MemoryRequest):
    db = SessionLocal()
    memory = Memory(
        content = request.content,
        category = request.category
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    db.close()

    return {
        "id": memory.id,
        "content": memory.content,
        "category": memory.category,
        "created_at": memory.created_at
    }