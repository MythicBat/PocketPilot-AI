from openai import OpenAI

from app.config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL, ENABLE_OLLAMA_FALLBACK
from app.agents.planner_agent import planner_agent
from app.agents.knowledge_agent import knowledge_agent
from app.agents.emergency_agent import emergency_agent
from app.agents.memory_agent import memory_agent
from app.agents.profile_context import get_profile_context
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
    profile_context = get_profile_context()

    prompt = f"""
You are PocketPilot AI, a production-grade edge personal assistant.

Use the user's saved profile when relevant.
{profile_context}

User goal:
{user_goal}

Agent outputs:

{planner}

{knowledge}

{emergency}

{memory}

Create a polished mission plan using this exact format:

MISSION SUMMARY
- Write a short useful summary.

ACTION PLAN
- Use clear bullet points.
- Keep each task practical and specific.

OFFLINE PREPARATION
- List what the user should save, download, print, or prepare.

RISKS AND MITIGATION
- List each risk followed by a practical mitigation.

FINAL CHECKLIST
- Use simple checklist bullets.

Formatting rules:
- Do not use markdown tables.
- Do not use ### headings.
- Do not use **bold** markdown.
- Do not use code blocks.
- Do not use excessive emojis.
- Use clean plain-text headings and bullet points.
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