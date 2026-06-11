from app.database import SessionLocal, KnowledgeItem

def save_knowledge(title: str, content: str, source: str = "manual"):
    db = SessionLocal()
    item = KnowledgeItem(title=title, content=content, source=source)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item

def search_knowledge(query: str, limit: int = 5):
    db = SessionLocal()

    items = (
        db.query(KnowledgeItem)
        .filter(KnowledgeItem.content.ilike(f"%{query[:40]}%"))
        .limit(limit)
        .all()
    )

    if not items:
        items = db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc()).limit(limit).all()
    
    db.close()
    return items