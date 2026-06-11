from app.database import SessionLocal, Memory


def save_memory(content: str, category: str = "mission"):
    db = SessionLocal()
    memory = Memory(content=content, category=category)
    db.add(memory)
    db.commit()
    db.refresh(memory)
    db.close()
    return memory


def get_recent_memories(limit: int = 5):
    db = SessionLocal()
    memories = db.query(Memory).order_by(Memory.created_at.desc()).limit(limit).all()
    db.close()
    return memories


def memory_agent(user_goal: str) -> str:
    save_memory(user_goal, "mission_goal")
    memories = get_recent_memories()

    memory_text = "\n".join(
        [f"- {memory.content}" for memory in memories]
    )

    return f"""
Memory Agent Output:

Saved this mission goal permanently:
"{user_goal}"

Recent user memories:
{memory_text}
"""