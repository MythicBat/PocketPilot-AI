from io import BytesIO
from pypdf import PdfReader
from docx import Document


def parse_uploaded_file(filename: str, content_bytes: bytes) -> str:
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        return parse_pdf(content_bytes)

    if lower_name.endswith(".docx"):
        return parse_docx(content_bytes)

    try:
        return content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return "Could not decode this file type."


def parse_pdf(content_bytes: bytes) -> str:
    pdf_file = BytesIO(content_bytes)
    reader = PdfReader(pdf_file)

    text = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text.append(page_text)

    return "\n\n".join(text).strip() or "No readable text found in PDF."


def parse_docx(content_bytes: bytes) -> str:
    docx_file = BytesIO(content_bytes)
    document = Document(docx_file)

    text = []
    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text.strip())

    return "\n".join(text).strip() or "No readable text found in DOCX."