from app.database import SessionLocal, KnowledgeItem
from app.services.embedding_service import (create_embedding, cosine_similarity,)
import json 

def save_knowledge(title: str, content: str, source: str = "manual", user_id: int = None):

    embedding = create_embedding(content)

    db = SessionLocal()
    item = KnowledgeItem(user_id=user_id, title=title, content=content, source=source, embedding=json.dumps(embedding) if embedding else None)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item

def search_knowledge(query: str, limit: int = 5, user_id: int = None):
    db = SessionLocal()

    items_query = db.query(KnowledgeItem)

    if user_id is not None:
        items_query = items_query.filter(KnowledgeItem.user_id == user_id)
    
    items = items_query.all()

    if not items:
        db.close()
        return []

    query_embedding = create_embedding(query)

    if query_embedding is None:
        db.close()
        return items[:limit]

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