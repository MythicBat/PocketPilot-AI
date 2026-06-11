from openai import OpenAI

from app.config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, ENABLE_OLLAMA_FALLBACK
from app.agents.profile_context import get_profile_context
from app.agents.memory_agent import get_recent_memories
from app.agents.knowledge_agent import knowledge_agent
from app.services.ollama_service import run_ollama


def get_memory_context():
    memories = get_recent_memories(limit=8)

    if not memories:
        return "No recent memories found."

    return "\n".join(
        [f"- [{memory.category}] {memory.content}" for memory in memories]
    )


def simulate_goal(goal: str, timeframe: str = "3 months"):
    profile_context = get_profile_context()
    memory_context = get_memory_context()
    knowledge_context = knowledge_agent(goal)

    prompt = f"""
You are PocketPilot AI Goal Simulator.

Your job is to simulate a realistic path from the user's current state to their desired goal.

Use:
- User profile
- User memories
- Knowledge vault
- Practical constraints
- Risk analysis

User Goal:
{goal}

Timeframe:
{timeframe}

{profile_context}

User Memories:
{memory_context}

Knowledge Context:
{knowledge_context}

Create a detailed Goal Simulation with this structure:

1. Goal Summary
2. Assumptions
3. Current State Analysis
4. Phase-by-Phase Roadmap
5. Weekly/Monthly Timeline
6. Required Resources
7. Risks and Mitigation
8. Success Metrics
9. Final Execution Checklist

Make it realistic, specific, and useful.
"""

    if not QWEN_API_KEY:
        if ENABLE_OLLAMA_FALLBACK:
            try:
                return {
                    "mode": "ollama_offline",
                    "simulation": run_ollama(prompt)
                }
            except Exception:
                return offline_simulation(goal, timeframe)

        return offline_simulation(goal, timeframe)

    client = OpenAI(
        api_key=QWEN_API_KEY,
        base_url=QWEN_BASE_URL,
    )

    try:
        response = client.chat.completions.create(
            model=QWEN_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a strategic goal simulation agent."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.45,
        )

        return {
            "mode": "qwen_cloud",
            "simulation": response.choices[0].message.content
        }

    except Exception:
        if ENABLE_OLLAMA_FALLBACK:
            try:
                return {
                    "mode": "ollama_offline",
                    "simulation": run_ollama(prompt)
                }
            except Exception:
                return offline_simulation(goal, timeframe)

        return offline_simulation(goal, timeframe)


def offline_simulation(goal: str, timeframe: str):
    return {
        "mode": "offline_fallback",
        "simulation": f"""
Goal Simulator Offline Mode

Goal:
{goal}

Timeframe:
{timeframe}

1. Goal Summary
You want to achieve this goal within the selected timeframe.

2. Phase Roadmap

Phase 1: Understand the goal
- Define the exact outcome.
- List constraints.
- Identify available resources.

Phase 2: Prepare
- Gather documents, tools, contacts, and knowledge.
- Break the goal into weekly tasks.

Phase 3: Execute
- Complete the highest-impact tasks first.
- Track progress weekly.
- Adjust based on obstacles.

Phase 4: Review
- Measure progress.
- Fix weak areas.
- Prepare a final checklist.

3. Risks
- Lack of time
- Missing resources
- Unclear priorities
- Unexpected delays

4. Mitigation
- Use weekly reviews.
- Keep backup options.
- Focus on small daily progress.

5. Final Checklist
- Goal clearly defined
- Timeline created
- Resources ready
- Risks identified
- Weekly review scheduled
"""
    }