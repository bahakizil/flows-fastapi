import uuid
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

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

class Workflow(BaseModel):
    id: Optional[str] = None
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowExecutionRequest(BaseModel):
    workflow: Workflow
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
