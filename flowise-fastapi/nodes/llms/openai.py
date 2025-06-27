
import os
from ..base import ProviderNode, NodeMetadata, NodeInput, NodeType
from langchain_openai import ChatOpenAI
from langchain_core.runnables import Runnable

class OpenAINode(ProviderNode):
    _metadatas = {
        "name": "OpenAIChat",
        "description": "Provides an OpenAI chat model.",
        "node_type": NodeType.PROVIDER,
        "inputs": [
            NodeInput(name="openai_api_key", type="string", description="OpenAI API Key. If not provided, it will be taken from the OPENAI_API_KEY environment variable.", required=False),
            NodeInput(name="model_name", type="string", description="The name of the OpenAI model to use.", default="gpt-4o-mini"),
            NodeInput(name="temperature", type="float", description="The temperature to use for generation.", default=0.7)
        ]
    }

    def _execute(self, openai_api_key: str = None, model_name: str = "gpt-4o-mini", temperature: float = 0.7) -> Runnable:
        api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API Key is required.")
        
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key=api_key
        )
