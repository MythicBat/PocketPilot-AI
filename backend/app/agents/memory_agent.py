memory_store = []

def memory_agent(user_goal: str) -> str:
    memory_store.append(user_goal)

    return f"""
Memory Agent Output:

I saved this goal locally:
"{user_goal}"

Known recent goals:
{memory_store[-5:]}
"""