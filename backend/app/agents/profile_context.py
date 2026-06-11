from app.database import SessionLocal, UserProfile


def get_profile_context() -> str:
    db = SessionLocal()
    profile = db.query(UserProfile).first()
    db.close()

    if not profile:
        return "No user profile saved yet."

    return f"""
User Profile:
- Name: {profile.name or "Not provided"}
- Location: {profile.location or "Not provided"}
- Budget style: {profile.budget_style or "Not provided"}
- Transport preference: {profile.transport_preference or "Not provided"}
- Food preference: {profile.food_preference or "Not provided"}
- Planning style: {profile.planning_style or "Not provided"}
"""