from typing import Dict, Any, List
from langchain_core.runnables import Runnable
from api.schemas import Workflow
from .node_discovery import get_node_class
from nodes.base import ProviderNode, ProcessorNode, TerminatorNode, NodeType
from toposort import toposort_flatten

# In-memory cache for compiled and ready-to-run chains
COMPILED_CHAINS: Dict[str, Runnable] = {}

def build_runnable_chain(workflow_def: Workflow) -> Runnable:
    """
    Builds an executable LangChain (LCEL) chain from nodes and edges,
    respecting the new standardized node architecture.
    """
    # 1. Topologically sort the nodes
    dependencies = {node.id: [] for node in workflow_def.nodes}
    for edge in workflow_def.edges:
        dependencies[edge.target].append(edge.source)
    
    sorted_node_ids = toposort_flatten(dependencies)

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
                        target_handle = edge.targetHandle
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
    if workflow_id not in COMPILED_CHAINS:
        print(f"Chain not found in cache. Building new chain for: {workflow_id}")
        COMPILED_CHAINS[workflow_id] = build_runnable_chain(workflow_def)
    
    runnable_chain = COMPILED_CHAINS[workflow_id]

    config = {"metadata": {"workflow_id": workflow_def.id, "workflow_name": workflow_def.name}}
    
    input_dict = {"input": input_text}

    result = await runnable_chain.ainvoke(input_dict, config=config)
    
    if hasattr(result, 'content'):
        return {"output": result.content}
    return result


