from app.agents.knowledge_vault import search_knowledge


def knowledge_agent(user_goal: str, user_id: int = None) -> str:
    items = search_knowledge(user_goal, user_id=user_id)

    if not items:
        return f"""
Knowledge Agent Output:

No saved knowledge found yet.

For the goal: {user_goal}

Recommended:
1. Save travel notes, class notes, emergency info, or documents in Knowledge Vault.
2. PocketPilot will use them offline in future missions.
"""

    knowledge_text = "\n\n".join(
        [f"Title: {item.title}\nContent: {item.content[:600]}" for item in items]
    )

    return f"""
Knowledge Agent Output:

Relevant saved knowledge found:

{knowledge_text}
"""