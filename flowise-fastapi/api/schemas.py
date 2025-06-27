
import uuid
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]

class Edge(BaseModel):
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class Workflow(BaseModel):
    id: str = Field(default_factory=lambda: f"flow_{uuid.uuid4()}")
    name: str = "Untitled Flow"
    nodes: List[Node]
    edges: List[Edge]

class WorkflowExecutionRequest(BaseModel):
    workflow: Workflow
    input: Dict[str, Any]
    workflow_id: Optional[str] = None # Stateful oturumlar için

class WorkflowExecutionResponse(BaseModel):
    output: Dict[str, Any]
    workflow_id: str # Client'ın state'i takip edebilmesi için
