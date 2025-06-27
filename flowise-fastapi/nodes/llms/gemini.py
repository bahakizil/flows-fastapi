
import os
from ..base import ProviderNode, NodeMetadata, NodeInput, NodeType
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable

class GeminiNode(ProviderNode):
    _metadatas = {
        "name": "GoogleGemini",
        "description": "Provides a Google Gemini chat model.",
        "node_type": NodeType.PROVIDER,
        "inputs": [
            NodeInput(name="google_api_key", type="string", description="Google API Key. If not provided, it will be taken from the GOOGLE_API_KEY environment variable.", required=False),
            NodeInput(name="model_name", type="string", description="The name of the Gemini model to use.", default="gemini-1.5-flash"),
            NodeInput(name="temperature", type="float", description="The temperature to use for generation.", default=0.7)
        ]
    }

    def _execute(self, google_api_key: str = None, model_name: str = "gemini-1.5-flash", temperature: float = 0.7) -> Runnable:
        api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Google API Key is required.")
        
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=api_key
        )
