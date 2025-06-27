
from ..base import ProcessorNode, NodeMetadata, NodeInput, NodeType
from typing import Dict, Any
from langchain_core.runnables import Runnable
from langchain.agents import AgentExecutor, create_react_agent

class ReactAgentNode(ProcessorNode):
    _metadatas = {
        "name": "ReactAgent",
        "description": "Creates a ReAct agent from an LLM, tools, and a prompt.",
        "node_type": NodeType.PROCESSOR,
        "inputs": [
            NodeInput(name="llm", type="Runnable", description="The language model to use.", is_connection=True),
            NodeInput(name="tools", type="list[BaseTool]", description="The tools for the agent to use.", is_connection=True),
            NodeInput(name="prompt", type="PromptTemplate", description="The prompt for the agent.", is_connection=True),
            NodeInput(name="memory", type="BaseChatMemory", description="The memory for the agent.", is_connection=True, required=False)
        ]
    }

    def _execute(self, inputs: Dict[str, Any], connected_nodes: Dict[str, Runnable]) -> Runnable:
        llm = connected_nodes.get("llm")
        tools = connected_nodes.get("tools")
        prompt = connected_nodes.get("prompt")
        memory = connected_nodes.get("memory") # Optional

        if not all([llm, tools, prompt]):
            raise ValueError("LLM, tools, and prompt must be provided to the ReactAgentNode.")

        agent = create_react_agent(llm, tools, prompt)
        
        return AgentExecutor(
            agent=agent, 
            tools=tools, 
            memory=memory,
            verbose=True,
            handle_parsing_errors=True
        )
