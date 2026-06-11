from openai import OpenAI
import json

from app.config import QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL


def extract_memories_from_text(text: str):
    """
    Extract long-term useful user memories from a mission prompt.
    Returns a list of:
    {
      "content": "...",
      "category": "preference | travel | diet | budget | schedule | study | safety | general"
    }
    """

    if not QWEN_API_KEY:
        return rule_based_memory_extraction(text)

    client = OpenAI(
        api_key=QWEN_API_KEY,
        base_url=QWEN_BASE_URL,
    )

    prompt = f"""
Extract only stable, useful long-term user preferences from this text.

Text:
{text}

Return JSON only in this exact format:
[
  {{
    "content": "I prefer public transport over driving.",
    "category": "travel"
  }}
]

Rules:
- Only extract preferences, constraints, habits, or recurring needs.
- Do not extract temporary one-time goals.
- Do not extract private sensitive information unless the user clearly states it as a preference needed for planning.
- Keep each memory short and useful.
- If nothing useful, return [].
"""

    try:
        response = client.chat.completions.create(
            model=QWEN_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You extract useful user memories as clean JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()
        return json.loads(raw)

    except Exception:
        return rule_based_memory_extraction(text)


def rule_based_memory_extraction(text: str):
    lowered = text.lower()
    memories = []

    if "public transport" in lowered or "train" in lowered or "bus" in lowered:
        memories.append({
            "content": "I prefer public transport when possible.",
            "category": "travel"
        })

    if "vegetarian" in lowered:
        memories.append({
            "content": "I prefer vegetarian food options.",
            "category": "diet"
        })

    if "cheap" in lowered or "budget" in lowered or "low cost" in lowered:
        memories.append({
            "content": "I prefer budget-friendly options.",
            "category": "budget"
        })

    if "morning" in lowered or "early" in lowered:
        memories.append({
            "content": "I prefer early morning plans.",
            "category": "schedule"
        })

    if "offline" in lowered:
        memories.append({
            "content": "I prefer plans that work offline.",
            "category": "general"
        })

    return memories