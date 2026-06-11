from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import re

def clean_markdown(text):
    text = re.sub(r"#+\s*", "", text)
    text = re.sub(r"\*\*", "", text)
    text = re.sub(r"\*", "", text)
    text = re.sub(r"`", "", text)
    return text

def create_mission_pdf(goal: str, final_answer: str):
    final_answer = clean_markdown(final_answer)
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("PocketPilot AI Mission Plan", styles["Title"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Mission Goal", styles["Heading2"]))
    story.append(Paragraph(goal, styles["BodyText"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Generated Plan", styles["Heading2"]))

    for line in final_answer.split("\n"):
        if line.strip():
            story.append(Paragraph(line.strip(), styles["BodyText"]))
            story.append(Spacer(1, 6))

    doc.build(story)

    buffer.seek(0)
    return buffer