from app.database import SessionLocal, KnowledgeItem
from app.services.embedding_service import (create_embedding, cosine_similarity,)
import json 

def save_knowledge(title: str, content: str, source: str = "manual", user_id: int = None):

    embedding = create_embedding(content)

    db = SessionLocal()
    item = KnowledgeItem(user_id=user_id, title=title, content=content, source=source, embedding=json.dumps(embedding))
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item

def search_knowledge(query: str, limit: int = 5, user_id: int = None):
    db = SessionLocal()

    items = db.query(KnowledgeItem).all()

    if user_id is not None:
        items = items.filter(KnowledgeItem.user_id == user_id)

    query_embedding = create_embedding(query)

    scored = []

    for item in items:

        if not item.embedding:
            continue

        item_embedding = json.loads(item.embedding)

        score = cosine_similarity(
            query_embedding,
            item_embedding
        )

        scored.append(
            (
                score,
                item
            )
        )

    db.close()

    scored.sort(
        key=lambda x: x[0],
        reverse=True
    )

    return [
        item for score, item in scored[:limit]
    ]