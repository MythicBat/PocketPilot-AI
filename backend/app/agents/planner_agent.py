def planner_agent(user_goal: str) -> str:
    return f"""
Planner Agent Output:

Goal: {user_goal}

Suggested plan:
1. Break the goal into small tasks.
2. Prioritize urgent and important items.
3. Create a simple daily schedule.
4. Add reminders for key actions.
5. Review progress at the end of the day.
"""