from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import asyncio
from datetime import datetime
import uuid

from core.simple_runner import WorkflowRunner
from core.node_discovery import get_registry
from core.config import get_settings

router = APIRouter()
settings = get_settings()

# Request/Response Models
class WorkflowNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = "output"
    targetHandle: Optional[str] = "input"

class WorkflowDefinition(BaseModel):
    id: Optional[str] = None
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowExecutionRequest(BaseModel):
    workflow: WorkflowDefinition
    input: str = "Hello"
    session_id: Optional[str] = None
    stream: bool = False

class WorkflowExecutionResponse(BaseModel):
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_order: Optional[List[str]] = None
    session_id: Optional[str] = None
    execution_time: Optional[float] = None

class ChatMessage(BaseModel):
    message: str
    flow_id: str
    session_id: Optional[str] = None

# Session storage (In production, use Redis or database)
class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
    
    def create_session(self, session_id: Optional[str] = None) -> str:
        if not session_id:
            session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            "id": session_id,
            "created_at": datetime.now(),
            "messages": [],
            "context": {},
            "last_workflow": None
        }
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, data: Dict[str, Any]):
        if session_id in self.sessions:
            self.sessions[session_id].update(data)
    
    def add_message(self, session_id: str, message: str, response: str):
        if session_id in self.sessions:
            self.sessions[session_id]["messages"].append({
                "timestamp": datetime.now(),
                "human": message,
                "ai": response
            })

session_manager = SessionManager()

def get_workflow_runner():
    """Dependency injection for WorkflowRunner"""
    registry = get_registry()
    return WorkflowRunner(registry)

@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    request: WorkflowExecutionRequest,
    workflow_runner: WorkflowRunner = Depends(get_workflow_runner)
):
    """
    Execute a workflow with the given input
    """
    try:
        start_time = datetime.now()
        
        # Create or get session
        session_id = request.session_id or session_manager.create_session()
        session = session_manager.get_session(session_id)
        
        # Prepare workflow data
        workflow_data = {
            "nodes": [node.dict() for node in request.workflow.nodes],
            "edges": [edge.dict() for edge in request.workflow.edges]
        }
        
        print(f"🚀 Executing workflow: {request.workflow.name}")
        print(f"📝 Input: {request.input}")
        print(f"🔗 Session: {session_id}")
        
        # Execute workflow
        result = await workflow_runner.execute_workflow(
            workflow_data, 
            request.input,
            session_context=session
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Update session
        if session:
            session_manager.add_message(session_id, request.input, str(result.get("result", "")))
            session_manager.update_session(session_id, {"last_workflow": request.workflow.name})
        
        print(f"✅ Workflow completed in {execution_time:.2f}s")
        
        return WorkflowExecutionResponse(
            success=True,
            result=result.get("result"),
            execution_order=result.get("execution_order", []),
            session_id=session_id,
            execution_time=execution_time
        )
        
    except Exception as e:
        print(f"❌ Workflow execution failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "workflow_name": request.workflow.name
            }
        )

@router.post("/execute/stream")
async def execute_workflow_stream(
    request: WorkflowExecutionRequest,
    workflow_runner: WorkflowRunner = Depends(get_workflow_runner)
):
    """
    Execute a workflow with streaming response
    """
    async def generate_stream():
        try:
            session_id = request.session_id or session_manager.create_session()
            session = session_manager.get_session(session_id)
            
            workflow_data = {
                "nodes": [node.dict() for node in request.workflow.nodes],
                "edges": [edge.dict() for edge in request.workflow.edges]
            }
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting workflow execution...'})}\n\n"
            
            # Execute workflow with streaming
            async for chunk in workflow_runner.execute_workflow_stream(
                workflow_data, 
                request.input,
                session_context=session
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            
            # Send completion
            yield f"data: {json.dumps({'type': 'complete', 'session_id': session_id})}\n\n"
            
        except Exception as e:
            error_data = {
                'type': 'error',
                'error': str(e),
                'error_type': type(e).__name__
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.post("/validate")
async def validate_workflow(
    workflow: WorkflowDefinition,
    workflow_runner: WorkflowRunner = Depends(get_workflow_runner)
):
    """
    Validate a workflow without executing it
    """
    try:
        workflow_data = {
            "nodes": [node.dict() for node in workflow.nodes],
            "edges": [edge.dict() for edge in workflow.edges]
        }
        
        validation_result = workflow_runner.validate_workflow(workflow_data)
        
        return {
            "valid": validation_result["valid"],
            "errors": validation_result.get("errors", []),
            "warnings": validation_result.get("warnings", []),
            "node_count": len(workflow.nodes),
            "edge_count": len(workflow.edges)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: {str(e)}"
        )

@router.post("/sessions")
async def create_session():
    """
    Create a new chat session
    """
    session_id = session_manager.create_session()
    return {
        "session_id": session_id,
        "created_at": datetime.now().isoformat()
    }

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get session details and history
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "created_at": session["created_at"].isoformat(),
        "message_count": len(session["messages"]),
        "last_workflow": session.get("last_workflow"),
        "messages": session["messages"][-10:]  # Last 10 messages
    }

@router.post("/chat")
async def chat_with_workflow(
    chat_request: ChatMessage,
    workflow_runner: WorkflowRunner = Depends(get_workflow_runner)
):
    """
    Simple chat endpoint for quick testing
    """
    try:
        # This is a simplified chat endpoint
        # In a real implementation, you'd load the workflow by flow_id
        # For now, we'll return a simple response
        
        session_id = chat_request.session_id or session_manager.create_session()
        session = session_manager.get_session(session_id)
        
        # Simple echo response (replace with actual workflow execution)
        response = f"Echo: {chat_request.message}"
        
        session_manager.add_message(session_id, chat_request.message, response)
        
        return {
            "response": response,
            "session_id": session_id,
            "flow_id": chat_request.flow_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    registry = get_registry()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "available_nodes": len(registry),
        "node_types": list(registry.keys())
    }

# Background task for cleanup (optional)
@router.post("/cleanup")
async def cleanup_sessions(background_tasks: BackgroundTasks):
    """
    Cleanup old sessions (background task)
    """
    def cleanup():
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, session_data in session_manager.sessions.items():
            # Remove sessions older than 24 hours
            if (current_time - session_data["created_at"]).total_seconds() > 86400:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del session_manager.sessions[session_id]
        
        print(f"🧹 Cleaned up {len(expired_sessions)} expired sessions")
    
    background_tasks.add_task(cleanup)
    return {"message": "Cleanup task scheduled"}

# Development/Debug endpoints
@router.get("/debug/sessions")
async def debug_sessions():
    """
    Debug endpoint to see all sessions (development only)
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    return {
        "total_sessions": len(session_manager.sessions),
        "sessions": {
            sid: {
                "created_at": data["created_at"].isoformat(),
                "message_count": len(data["messages"]),
                "last_workflow": data.get("last_workflow")
            }
            for sid, data in session_manager.sessions.items()
        }
    }
