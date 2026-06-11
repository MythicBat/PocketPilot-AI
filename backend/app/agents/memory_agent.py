from app.database import SessionLocal, Memory
from app.agents.memory_extractor import extract_memories_from_text


def save_memory(content: str, category: str = "general"):
    db = SessionLocal()

    existing = (
        db.query(Memory)
        .filter(Memory.content == content)
        .first()
    )

    if existing:
        db.close()
        return existing

    memory = Memory(content=content, category=category)
    db.add(memory)
    db.commit()
    db.refresh(memory)
    db.close()
    return memory


def get_recent_memories(limit: int = 8):
    db = SessionLocal()
    memories = db.query(Memory).order_by(Memory.created_at.desc()).limit(limit).all()
    db.close()
    return memories


def memory_agent(user_goal: str) -> str:
    extracted = extract_memories_from_text(user_goal)

    saved = []
    for item in extracted:
        content = item.get("content")
        category = item.get("category", "general")

        if content:
            saved.append(save_memory(content, category))

    memories = get_recent_memories()

    memory_text = "\n".join(
        [f"- [{memory.category}] {memory.content}" for memory in memories]
    )

    extracted_text = "\n".join(
        [f"- [{memory.category}] {memory.content}" for memory in saved]
    ) or "No new long-term preferences detected."

    return f"""
Memory Agent Output:

New extracted memories:
{extracted_text}

Recent user memories:
{memory_text}
"""