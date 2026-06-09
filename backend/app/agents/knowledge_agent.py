def knowledge_agent(user_goal: str) -> str:
    return f"""
Knowledge Agent Output:

For the goal: {user_goal}

Useful knowledge actions:
1. Search saved notes.
2. Check uploaded documents.
3. Summarize important information.
4. Extract key facts.
5. Prepare a quick reference guide.
"""