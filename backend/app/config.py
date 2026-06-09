import os
from dotenv import load_dotenv

load_dotenv()

QWEN_API_KEY = os.getenv("QWEN_API_KEY", "")
QWEN_BASE_URL = os.getenv(
    "QWEN_BASE_URL",
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
)
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen-plus")