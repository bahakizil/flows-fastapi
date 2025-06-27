
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import workflows, nodes # nodes router'ını import et
from core import config # config'i import ederek LangSmith'i aktif et
from core.node_discovery import discover_nodes

# Uygulama başlangıcında tüm node'ları keşfet
discover_nodes()

app = FastAPI(
    title="Flowise FastAPI Backend",
    description="LangChain, LangGraph ve FastAPI ile güçlendirilmiş, Flowise benzeri bir workflow motoru.",
    version="0.1.0"
)

# CORS middleware'i ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router'larını ekle
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(nodes.router, prefix="/api/v1/nodes", tags=["Nodes"]) # Yeni router'ı ekle

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "ok"}
