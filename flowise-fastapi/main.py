from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import workflows, nodes
from core.config import get_settings, setup_logging, setup_langsmith, validate_api_keys
from core.node_discovery import discover_nodes

# Initialize settings and setup
settings = get_settings()
setup_logging(settings)
setup_langsmith(settings)
validate_api_keys(settings)

# Discover all available nodes at startup
print("🔍 Discovering available nodes...")
discover_nodes()

app = FastAPI(
    title=settings.APP_NAME,
    description="LangChain, LangGraph ve FastAPI ile güçlendirilmiş, Flowise benzeri bir workflow motoru.",
    version=settings.VERSION,
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(nodes.router, prefix="/api/v1/nodes", tags=["Nodes"])

# Health check endpoint
@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "message": "Flowise FastAPI Backend is running!"
    }

@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": settings.VERSION
    }

# API info endpoint
@app.get("/api/v1/info", tags=["Info"])
def get_api_info():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "endpoints": {
            "workflows": "/api/v1/workflows",
            "health": "/api/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    ) 