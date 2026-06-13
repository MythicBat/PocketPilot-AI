from io import BytesIO
import re

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def clean_markdown(text: str) -> str:
    text = re.sub(r"#+\s*", "", text)
    text = re.sub(r"\*\*", "", text)
    text = re.sub(r"\*", "", text)
    text = re.sub(r"`", "", text)
    text = text.replace("---", "")
    text = text.replace("|", " ")
    return text.strip()


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
    story.append(Paragraph(clean_markdown(goal), styles["BodyText"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Generated Plan", styles["Heading2"]))

    for line in final_answer.split("\n"):
        cleaned_line = clean_markdown(line)

        if cleaned_line:
            if cleaned_line.isupper() and len(cleaned_line) < 80:
                story.append(Spacer(1, 10))
                story.append(Paragraph(cleaned_line, styles["Heading2"]))
            else:
                story.append(Paragraph(cleaned_line, styles["BodyText"]))
                story.append(Spacer(1, 6))

    doc.build(story)

    buffer.seek(0)
    return buffer