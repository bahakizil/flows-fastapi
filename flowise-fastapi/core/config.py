
import os
from dotenv import load_dotenv

load_dotenv()

# LangSmith entegrasyonu için gerekli (opsiyonel).
langchain_api_key = os.getenv("LANGCHAIN_API_KEY")
if langchain_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = langchain_api_key

# OpenAI API anahtarı
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
