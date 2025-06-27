from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import json
import asyncio
from collections import defaultdict, deque

from .node import NodeRegistry, NodeData, INode

@dataclass
class FlowNode:
    """Represents a node in the flow"""
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

@dataclass
class FlowEdge:
    """Represents an edge between nodes"""
    id: str
    source: str
    target: str
    sourceHandle: str
    targetHandle: str

@dataclass
class ChatFlow:
    """Represents a complete chat flow"""
    id: str
    name: str
    nodes: List[FlowNode]
    edges: List[FlowEdge]
    flowData: str

class TopologicalSorter:
    """Topological sorting for node execution order"""
    
    @staticmethod
    def sort(nodes: List[FlowNode], edges: List[FlowEdge]) -> List[str]:
        """Sort nodes in topological order for execution"""
        # Build adjacency list and in-degree count
        graph = defaultdict(list)
        in_degree = defaultdict(int)
        
        # Initialize all nodes with 0 in-degree
        for node in nodes:
            in_degree[node.id] = 0
        
        # Build graph and calculate in-degrees
        for edge in edges:
            graph[edge.source].append(edge.target)
            in_degree[edge.target] += 1
        
        # Kahn's algorithm for topological sorting
        queue = deque([node_id for node_id in in_degree if in_degree[node_id] == 0])
        result = []
        
        while queue:
            current = queue.popleft()
            result.append(current)
            
            # Reduce in-degree for all neighbors
            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # Check for cycles
        if len(result) != len(nodes):
            raise ValueError("Cycle detected in flow graph")
        
        return result

class TypeChecker:
    """Type compatibility checker for node connections"""
    
    @staticmethod
    def is_compatible(source_classes: List[str], target_type: str) -> bool:
        """Check if source output is compatible with target input"""
        return target_type in source_classes

class FlowExecutor:
    """Executes chat flows"""
    
    def __init__(self, node_registry: NodeRegistry):
        self.node_registry = node_registry
        self.node_instances = {}
        self.execution_results = {}
    
    async def execute_flow(self, flow: ChatFlow, input_text: str, session_id: str = None) -> Dict[str, Any]:
        """Execute a complete chat flow"""
        try:
            # Clear previous execution state
            self.node_instances.clear()
            self.execution_results.clear()
            
            # Get execution order
            execution_order = TopologicalSorter.sort(flow.nodes, flow.edges)
            
            # Execute nodes in order
            for node_id in execution_order:
                await self._execute_node(node_id, flow, input_text, session_id)
            
            # Return result from the last node (assuming it's the output)
            last_node_id = execution_order[-1]
            return {
                "result": self.execution_results.get(last_node_id),
                "execution_order": execution_order,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "execution_order": [],
                "session_id": session_id
            }
    
    async def _execute_node(self, node_id: str, flow: ChatFlow, input_text: str, session_id: str):
        """Execute a single node"""
        # Find the node definition
        flow_node = next((n for n in flow.nodes if n.id == node_id), None)
        if not flow_node:
            raise ValueError(f"Node {node_id} not found in flow")
        
        # Get node instance
        node_instance = self.node_registry.get_node_instance(flow_node.type)
        
        # Prepare node inputs
        node_inputs = self._prepare_node_inputs(node_id, flow, flow_node.data.get("inputs", {}))
        
        # Create node data
        node_data = NodeData(
            inputs=node_inputs,
            outputs=flow_node.data.get("outputs", {}),
            id=node_id,
            type=flow_node.type
        )
        
        # Execute node
        result = await node_instance.init(node_data, input_text, {"session_id": session_id})
        
        # Store result
        self.execution_results[node_id] = result
        self.node_instances[node_id] = node_instance
        
        return result
    
    def _prepare_node_inputs(self, node_id: str, flow: ChatFlow, static_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare inputs for a node from connected nodes and static values"""
        inputs = static_inputs.copy()
        
        # Find incoming edges to this node
        incoming_edges = [e for e in flow.edges if e.target == node_id]
        
        for edge in incoming_edges:
            # Get result from source node
            source_result = self.execution_results.get(edge.source)
            if source_result is not None:
                # Map source output to target input
                inputs[edge.targetHandle] = source_result
        
        return inputs
    
    def validate_flow(self, flow: ChatFlow) -> Dict[str, Any]:
        """Validate flow for type compatibility and completeness"""
        errors = []
        warnings = []
        
        try:
            # Check topological order
            execution_order = TopologicalSorter.sort(flow.nodes, flow.edges)
            
            # Validate each connection
            for edge in flow.edges:
                source_node = next((n for n in flow.nodes if n.id == edge.source), None)
                target_node = next((n for n in flow.nodes if n.id == edge.target), None)
                
                if not source_node or not target_node:
                    errors.append(f"Invalid edge: {edge.id}")
                    continue
                
                # Get node instances for type checking
                source_instance = self.node_registry.get_node_instance(source_node.type)
                target_instance = self.node_registry.get_node_instance(target_node.type)
                
                # Find output and input definitions
                source_output = next((o for o in source_instance.outputs if o.name == edge.sourceHandle), None)
                target_input = next((i for i in target_instance.inputs if i.name == edge.targetHandle), None)
                
                if not source_output:
                    errors.append(f"Source output '{edge.sourceHandle}' not found in {source_node.type}")
                    continue
                
                if not target_input:
                    errors.append(f"Target input '{edge.targetHandle}' not found in {target_node.type}")
                    continue
                
                # Check type compatibility
                if not TypeChecker.is_compatible(source_output.baseClasses, target_input.type):
                    errors.append(f"Type mismatch: {source_output.baseClasses} -> {target_input.type}")
            
            # Check for required inputs
            for node in flow.nodes:
                node_instance = self.node_registry.get_node_instance(node.type)
                node_inputs = node.data.get("inputs", {})
                
                # Find connected inputs
                connected_inputs = set()
                for edge in flow.edges:
                    if edge.target == node.id:
                        connected_inputs.add(edge.targetHandle)
                
                # Check required inputs
                for input_param in node_instance.inputs:
                    if input_param.required and not input_param.optional:
                        if input_param.name not in node_inputs and input_param.name not in connected_inputs:
                            errors.append(f"Required input '{input_param.name}' missing in node {node.id}")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "execution_order": execution_order
            }
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [str(e)],
                "warnings": warnings,
                "execution_order": []
            }

class ChatFlowManager:
    """Manages chat flows and their execution"""
    
    def __init__(self):
        self.node_registry = NodeRegistry()
        self.flows = {}  # In-memory storage for demo
        self.sessions = {}  # Session management
    
    def create_flow(self, flow_data: Dict[str, Any]) -> str:
        """Create a new chat flow"""
        flow_id = flow_data.get("id", f"flow_{len(self.flows)}")
        
        # Parse nodes and edges
        nodes = [FlowNode(**node) for node in flow_data.get("nodes", [])]
        edges = [FlowEdge(**edge) for edge in flow_data.get("edges", [])]
        
        # Create flow
        flow = ChatFlow(
            id=flow_id,
            name=flow_data.get("name", f"Flow {flow_id}"),
            nodes=nodes,
            edges=edges,
            flowData=json.dumps(flow_data)
        )
        
        self.flows[flow_id] = flow
        return flow_id
    
    def get_flow(self, flow_id: str) -> Optional[ChatFlow]:
        """Get flow by ID"""
        return self.flows.get(flow_id)
    
    async def execute_flow(self, flow_id: str, input_text: str, session_id: str = None) -> Dict[str, Any]:
        """Execute a flow with given input"""
        flow = self.get_flow(flow_id)
        if not flow:
            return {"error": f"Flow {flow_id} not found"}
        
        executor = FlowExecutor(self.node_registry)
        return await executor.execute_flow(flow, input_text, session_id)
    
    def validate_flow(self, flow_id: str) -> Dict[str, Any]:
        """Validate a flow"""
        flow = self.get_flow(flow_id)
        if not flow:
            return {"error": f"Flow {flow_id} not found"}
        
        executor = FlowExecutor(self.node_registry)
        return executor.validate_flow(flow)
    
    def get_available_nodes(self) -> List[Dict[str, Any]]:
        """Get all available node types"""
        return self.node_registry.get_all_nodes()
    
    def create_session(self, session_id: str = None) -> str:
        """Create a new session"""
        if not session_id:
            session_id = f"session_{len(self.sessions)}"
        
        self.sessions[session_id] = {
            "id": session_id,
            "created_at": "2024-01-01T00:00:00Z",
            "history": []
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        return self.sessions.get(session_id)

