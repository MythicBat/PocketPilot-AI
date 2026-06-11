from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from app.agents.orchestrator import run_mission
from app.database import init_db, SessionLocal, Mission, Memory, KnowledgeItem, UserProfile
from app.agents.knowledge_vault import save_knowledge
from app.agents.goal_simulator import simulate_goal
from app.utils.file_parser import parse_uploaded_file
from app.utils.pdf_exporter import create_mission_pdf
from app.services.embedding_service import create_embedding

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

@app.get("/missions/{mission_id}/export")
def export_mission_pdf(mission_id: int):
    db = SessionLocal()
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    db.close()

    if not mission:
        return {"error": "Mission not found"}

    pdf_buffer = create_mission_pdf(
        goal=mission.goal,
        final_answer=mission.final_answer
    )

    filename = f"pocketpilot_mission_{mission_id}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

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

class KnowledgeRequest(BaseModel):
    title: str
    content: str
    source: str = "manual"

@app.post("/knowledge")
def create_knowledge(request: KnowledgeRequest):
    item = save_knowledge(
        title=request.title,
        content=request.content,
        source=request.source
    )

    return {
        "id": item.id,
        "title": item.title,
        "content": item.content,
        "source": item.source,
        "created_at": item.created_at
    }

@app.get("/knowledge")
def get_knowledge():
    db = SessionLocal()
    items = db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc()).all()
    db.close()

    return [
        {
            "id": item.id,
            "title": item.title,
            "content": item.content,
            "source": item.source,
            "created_at": item.created_at
        }
        for item in items
    ]

@app.post("/knowledge/upload")
async def upload_knowledge(file: UploadFile = File(...)):
    content_bytes = await file.read()

    content = parse_uploaded_file(
        filename=file.filename,
        content_bytes=content_bytes
    )

    item = save_knowledge(
        title=file.filename,
        content=content,
        source="upload"
    )

    return {
        "id": item.id,
        "title": item.title,
        "content": item.content[:500],
        "source": item.source,
        "created_at": item.created_at
    }

@app.post("/knowledge/reindex")
def reindex_knowledge():
    db = SessionLocal()

    items = db.query(KnowledgeItem).all()

    for item in items:
        item.embedding = json.dumps(
            create_embedding(item.content)
        )

    db.commit()
    db.close()

    return {
        "message": "Knowledge reindexed",
        "items_updated": len(items)
    }

class UserProfileRequest(BaseModel):
    name: str = ""
    budget_style: str = ""
    transport_preference: str = ""
    food_preference: str = ""
    planning_style: str = ""
    location: str = ""

@app.get("/profile")
def get_profile():
    db = SessionLocal()
    profile = db.query(UserProfile).first()

    if not profile:
        profile = UserProfile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    db.close()

    return {
        "id": profile.id,
        "name": profile.name,
        "budget_style": profile.budget_style,
        "transport_preference": profile.transport_preference,
        "food_preference": profile.food_preference,
        "planning_style": profile.planning_style,
        "location": profile.location,
        "updated_at": profile.updated_at
    }

@app.post("/profile")
def update_profile(request: UserProfileRequest):
    db = SessionLocal()
    profile = db.query(UserProfile).first()

    if not profile:
        profile = UserProfile()
        db.add(profile)

    profile.name = request.name
    profile.budget_style = request.budget_style
    profile.transport_preference = request.transport_preference
    profile.food_preference = request.food_preference
    profile.planning_style = request.planning_style
    profile.location = request.location

    db.commit()
    db.refresh(profile)
    db.close()

    return {
        "message": "Profile Updated",
        "profile": {
            "id": profile.id,
            "name": profile.name,
            "budget_style": profile.budget_style,
            "transport_preference": profile.transport_preference,
            "food_preference": profile.food_preference,
            "planning_style": profile.planning_style,
            "location": profile.location,
            "updated_at": profile.updated_at
        }
    }

class GoalSimulationRequest(BaseModel):
    goal: str
    timeframe: str = "3 months"

@app.post("/simulate-goal")
def simulate_user_goal(request: GoalSimulationRequest):
    return simulate_goal(
        goal=request.goal,
        timeframe=request.timeframe
    )
