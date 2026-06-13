from sentence_transformers import SentenceTransformer
import numpy as np

MODEL_NAME = "all-MiniLM-L6-v2"

try:
    model = SentenceTransformer(
        MODEL_NAME,
        local_files_only=True
    )
except Exception:
    model = None
    print("WARNING: Local embedding model not found. Vector RAG disabled offline.")


def create_embedding(text: str):
    if model is None:
        return None

    vector = model.encode(text)
    return vector.tolist()


def cosine_similarity(a, b):
    if a is None or b is None:
        return 0

    a = np.array(a)
    b = np.array(b)

    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )