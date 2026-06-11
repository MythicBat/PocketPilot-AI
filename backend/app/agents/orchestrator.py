from openai import OpenAI

from app.config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, ENABLE_OLLAMA_FALLBACK
from app.agents.planner_agent import planner_agent
from app.agents.knowledge_agent import knowledge_agent
from app.agents.emergency_agent import emergency_agent
from app.agents.memory_agent import memory_agent
from app.services.ollama_service import run_ollama


def offline_fallback(user_goal: str) -> dict:
    return {
        "mode": "offline",
        "planner": planner_agent(user_goal),
        "knowledge": knowledge_agent(user_goal),
        "emergency": emergency_agent(user_goal),
        "memory": memory_agent(user_goal),
        "final_answer": f"""
PocketPilot Offline Mission Plan:

You said: {user_goal}

I created a basic offline plan using local agents. Add your Qwen API key later to unlock full reasoning.
"""
    }


def run_mission(user_goal: str) -> dict:
    planner = planner_agent(user_goal)
    knowledge = knowledge_agent(user_goal)
    emergency = emergency_agent(user_goal)
    memory = memory_agent(user_goal)

    prompt = f"""
You are PocketPilot AI, a production-grade edge personal assistant.

User goal:
{user_goal}

Agent outputs:

{planner}

{knowledge}

{emergency}

{memory}

Create a polished mission plan with:
1. Summary
2. Step-by-step action plan
3. Offline preparation
4. Risks
5. Final checklist
"""

    if not QWEN_API_KEY:
        if ENABLE_OLLAMA_FALLBACK:
            try:
                local_answer = run_ollama(prompt)

                return {
                    "mode": "ollama_offline",
                    "planner": planner,
                    "knowledge": knowledge,
                    "emergency": emergency,
                    "memory": memory,
                    "final_answer": local_answer
                }
            except Exception:
                return offline_fallback(user_goal)

        return offline_fallback(user_goal)

    client = OpenAI(
        api_key=QWEN_API_KEY,
        base_url=QWEN_BASE_URL,
    )

    try:
        response = client.chat.completions.create(
            model=QWEN_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful multi-agent AI assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )

        return {
            "mode": "qwen_cloud",
            "planner": planner,
            "knowledge": knowledge,
            "emergency": emergency,
            "memory": memory,
            "final_answer": response.choices[0].message.content
        }

    except Exception:
        if ENABLE_OLLAMA_FALLBACK:
            try:
                local_answer = run_ollama(prompt)

                return {
                    "mode": "ollama_offline",
                    "planner": planner,
                    "knowledge": knowledge,
                    "emergency": emergency,
                    "memory": memory,
                    "final_answer": local_answer
                }

            except Exception:
                return offline_fallback(user_goal)

        return offline_fallback(user_goal)