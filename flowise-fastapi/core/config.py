import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List
import logging

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application settings
    APP_NAME: str = "Flowise FastAPI Backend"
    VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    RELOAD: bool = Field(default=True, env="RELOAD")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
        env="ALLOWED_ORIGINS"
    )
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    GOOGLE_API_KEY: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    SERPER_API_KEY: Optional[str] = Field(default=None, env="SERPER_API_KEY")
    TAVILY_API_KEY: Optional[str] = Field(default=None, env="TAVILY_API_KEY")
    
    # LangSmith settings (optional)
    LANGCHAIN_TRACING_V2: bool = Field(default=False, env="LANGCHAIN_TRACING_V2")
    LANGCHAIN_ENDPOINT: str = Field(default="https://api.smith.langchain.com", env="LANGCHAIN_ENDPOINT")
    LANGCHAIN_API_KEY: Optional[str] = Field(default=None, env="LANGCHAIN_API_KEY")
    LANGCHAIN_PROJECT: str = Field(default="flowise-fastapi", env="LANGCHAIN_PROJECT")
    
    # Database settings (for future use)
    DATABASE_URL: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Redis settings (for session management)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = Field(default=10_000_000, env="MAX_UPLOAD_SIZE")  # 10MB
    UPLOAD_DIRECTORY: str = Field(default="uploads", env="UPLOAD_DIRECTORY")
    
    # Security settings
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Performance settings
    MAX_CONCURRENT_WORKFLOWS: int = Field(default=10, env="MAX_CONCURRENT_WORKFLOWS")
    WORKFLOW_TIMEOUT_SECONDS: int = Field(default=300, env="WORKFLOW_TIMEOUT_SECONDS")  # 5 minutes
    
    # Logging settings
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields instead of raising errors

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

def setup_logging(settings: Settings) -> None:
    """Setup application logging"""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format=settings.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("app.log") if not settings.DEBUG else logging.NullHandler()
        ]
    )
    
    # Set third-party library log levels
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    
    if settings.DEBUG:
        logging.getLogger("root").setLevel(logging.DEBUG)

def setup_langsmith(settings: Settings) -> None:
    """Setup LangSmith tracing if enabled"""
    if settings.LANGCHAIN_TRACING_V2 and settings.LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
        print(f"🔗 LangSmith tracing enabled for project: {settings.LANGCHAIN_PROJECT}")

def validate_api_keys(settings: Settings) -> None:
    """Validate required API keys and warn about missing ones"""
    warnings = []
    
    if not settings.OPENAI_API_KEY:
        warnings.append("OPENAI_API_KEY not set - OpenAI nodes will not work")
    
    if not settings.GOOGLE_API_KEY:
        warnings.append("GOOGLE_API_KEY not set - Google/Gemini nodes will not work")
    
    if not settings.SERPER_API_KEY:
        warnings.append("SERPER_API_KEY not set - Serper search tool will not work")
    
    if not settings.TAVILY_API_KEY:
        warnings.append("TAVILY_API_KEY not set - Tavily search tool will not work")
    
    if warnings:
        print("\n⚠️  API Key Warnings:")
        for warning in warnings:
            print(f"   • {warning}")
        print("   Configure these in .env file or environment variables\n")

def get_api_key(key_name: str) -> Optional[str]:
    """Get API key with fallback to environment variables"""
    settings = get_settings()
    
    # Try settings first, then environment
    key = getattr(settings, key_name.upper(), None)
    if key:
        return key
    
    return os.getenv(key_name.upper())

# Initialize settings and setup
settings = get_settings()
setup_logging(settings)
setup_langsmith(settings)

# Validate API keys on import
if __name__ != "__main__":
    validate_api_keys(settings)
