from typing import Dict, Any, List, AsyncGenerator, Optional
from langchain_core.runnables import Runnable, RunnableConfig
from api.schemas import Workflow
from .node_discovery import get_node_class, get_registry
from nodes.base import ProviderNode, ProcessorNode, TerminatorNode, NodeType
import json
import asyncio

# In-memory cache for compiled and ready-to-run chains
COMPILED_CHAINS: Dict[str, Runnable] = {}

def build_runnable_chain(workflow_def: Workflow) -> Runnable:
    """
    Builds an executable LangChain (LCEL) chain from nodes and edges,
    respecting the new standardized node architecture.
    """
    # 1. Simple topological sort implementation
    def topological_sort(nodes, edges):
        # Build dependency graph
        in_degree = {node.id: 0 for node in nodes}
        adj_list = {node.id: [] for node in nodes}
        
        for edge in edges:
            adj_list[edge.source].append(edge.target)
            in_degree[edge.target] += 1
        
        # Find nodes with no dependencies
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            for neighbor in adj_list[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result
    
    sorted_node_ids = topological_sort(workflow_def.nodes, workflow_def.edges)

    # 2. Initialize all nodes and classify them
    initialized_nodes: Dict[str, Any] = {}
    node_instances: Dict[str, Any] = {}

    for node_id in sorted_node_ids:
        node_def = next(n for n in workflow_def.nodes if n.id == node_id)
        node_class = get_node_class(node_def.type) # Assuming node_def.type holds the class name
        node_instances[node_id] = node_class()

    # 3. Execute nodes in order of their type: Providers -> Processors -> Terminators
    
    # First, run all ProviderNodes as they have no dependencies on other nodes
    for node_id in sorted_node_ids:
        instance = node_instances[node_id]
        if isinstance(instance, ProviderNode):
            node_def = next(n for n in workflow_def.nodes if n.id == node_id)
            # User-provided inputs for the provider node
            provider_inputs = node_def.data.get('inputs', {})
            initialized_nodes[node_id] = instance.execute(**provider_inputs)

    # Next, run ProcessorNodes and TerminatorNodes which depend on other nodes
    final_runnable = None
    for node_id in sorted_node_ids:
        instance = node_instances[node_id]
        if isinstance(instance, (ProcessorNode, TerminatorNode)):
            node_def = next(n for n in workflow_def.nodes if n.id == node_id)
            
            # Gather connected nodes
            connected_nodes: Dict[str, Runnable] = {}
            for edge in workflow_def.edges:
                if edge.target == node_id:
                    source_node_id = edge.source
                    if source_node_id in initialized_nodes:
                        # targetHandle specifies which parameter of the execute method to connect to
                        target_handle = edge.targetHandle or "input"
                        connected_nodes[target_handle] = initialized_nodes[source_node_id]
            
            user_inputs = node_def.data.get('inputs', {})

            if isinstance(instance, ProcessorNode):
                runnable = instance.execute(inputs=user_inputs, connected_nodes=connected_nodes)
                initialized_nodes[node_id] = runnable
                final_runnable = runnable # Keep track of the latest runnable

            elif isinstance(instance, TerminatorNode):
                # Terminator takes the single, final runnable from the previous step
                if final_runnable:
                    runnable = instance.execute(previous_node=final_runnable, inputs=user_inputs)
                    initialized_nodes[node_id] = runnable
                    final_runnable = runnable
                else:
                    raise ValueError(f"TerminatorNode '{node_id}' has no preceding node to terminate.")

    if not final_runnable:
        # Handle cases where the workflow might only contain a single provider
        if len(initialized_nodes) == 1:
            return list(initialized_nodes.values())[0]
        raise ValueError("Could not create an executable chain from the workflow.")

    return final_runnable


async def run_workflow(workflow_def: Workflow, input_text: str, workflow_id: str) -> Dict[str, Any]:
    """
    Executes a workflow using the given definition and input.
    Uses `workflow_id` for stateful memory.
    """
    # Ensure workflow_id is not None
    if not workflow_id:
        workflow_id = workflow_def.id or "default_workflow"
    
    if workflow_id not in COMPILED_CHAINS:
        print(f"Chain not found in cache. Building new chain for: {workflow_id}")
        COMPILED_CHAINS[workflow_id] = build_runnable_chain(workflow_def)
    
    runnable_chain = COMPILED_CHAINS[workflow_id]

    config = RunnableConfig(metadata={"workflow_id": workflow_def.id or "unknown", "workflow_name": workflow_def.name})
    
    input_dict = {"input": input_text}

    result = await runnable_chain.ainvoke(input_dict, config=config)
    
    if hasattr(result, 'content'):
        return {"output": result.content}
    return result


class WorkflowRunner:
    """
    Main class for executing workflows with node-based architecture
    """
    
    def __init__(self, registry: Optional[Dict[str, Any]] = None):
        self.registry = registry or get_registry()
    
    async def execute_workflow(
        self,
        workflow_data: Dict[str, Any],
        input_text: str,
        session_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow with the given input
        """
        try:
            # Convert workflow_data to Workflow object
            workflow = Workflow(
                id=workflow_data.get("id", "workflow_" + str(hash(str(workflow_data)))),
                name=workflow_data.get("name", "Unnamed Workflow"),
                nodes=workflow_data.get("nodes", []),
                edges=workflow_data.get("edges", [])
            )
            
            # For now, just return a simple mocked response. TODO: integrate real execution via run_workflow
            result = {
                "result": f"Workflow '{workflow.name}' executed with input: {input_text}",
                "execution_order": [node.id for node in workflow.nodes],
                "status": "completed"
            }
            
            return result
            
        except Exception as e:
            return {
                "result": None,
                "error": str(e),
                "status": "failed"
            }
    
    async def execute_workflow_stream(
        self,
        workflow_data: Dict[str, Any],
        input_text: str,
        session_context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute a workflow with streaming output
        """
        try:
            # Convert workflow_data to Workflow object
            workflow = Workflow(
                id=workflow_data.get("id", "workflow_" + str(hash(str(workflow_data)))),
                name=workflow_data.get("name", "Unnamed Workflow"),
                nodes=workflow_data.get("nodes", []),
                edges=workflow_data.get("edges", [])
            )
            
            # Simulate streaming execution
            yield {"type": "start", "message": f"Starting execution of workflow: {workflow.name}"}
            
            for i, node in enumerate(workflow.nodes):
                # Simulate node start
                await asyncio.sleep(0.1)  # Simulate processing time
                yield {
                    "type": "node_start",
                    "node_id": node.id,
                    "node_type": node.type,
                    "message": f"Executing node {node.id}"
                }

                # Simulate node completion
                await asyncio.sleep(0.2)  # Simulate processing time
                yield {
                    "type": "node_complete",
                    "node_id": node.id,
                    "result": f"Node {node.id} completed successfully"
                }
            
            # Final result
            yield {
                "type": "result",
                "result": f"Workflow completed successfully with input: {input_text}",
                "execution_order": [node.id for node in workflow.nodes]
            }
            
        except Exception as e:
            yield {"type": "error", "error": str(e)}
    
    def validate_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a workflow definition
        """
        try:
            workflow = Workflow(
                id=workflow_data.get("id", "temp"),
                name=workflow_data.get("name", "Temp Workflow"),
                nodes=workflow_data.get("nodes", []),
                edges=workflow_data.get("edges", [])
            )
            
            # Basic validation
            if not workflow.nodes:
                return {"valid": False, "errors": ["Workflow must have at least one node"]}
            
            # Check for orphaned edges
            node_ids = {node.id for node in workflow.nodes}
            for edge in workflow.edges:
                if edge.source not in node_ids:
                    return {"valid": False, "errors": [f"Edge source '{edge.source}' not found in nodes"]}
                if edge.target not in node_ids:
                    return {"valid": False, "errors": [f"Edge target '{edge.target}' not found in nodes"]}
            
            return {"valid": True, "message": "Workflow is valid"}
            
        except Exception as e:
            return {"valid": False, "errors": [str(e)]}


