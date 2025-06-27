from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel
from dataclasses import dataclass
import json

class NodeParam(BaseModel):
    """Node input/output parameter definition"""
    label: str
    name: str
    type: str
    required: bool = True
    default: Optional[Any] = None
    options: Optional[List[Dict]] = None
    list: bool = False
    optional: bool = False

class NodeOutput(BaseModel):
    """Node output definition"""
    label: str
    name: str
    baseClasses: List[str]

@dataclass
class NodeData:
    """Node execution data"""
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    id: str
    type: str

class INode(ABC):
    """Base interface for all nodes - Python equivalent of Flowise INode"""
    
    def __init__(self):
        self.label: str = ""
        self.name: str = ""
        self.version: float = 1.0
        self.type: str = ""
        self.icon: str = ""
        self.category: str = ""
        self.description: str = ""
        self.baseClasses: List[str] = []
        self.inputs: List[NodeParam] = []
        self.outputs: List[NodeOutput] = []
    
    @abstractmethod
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Any:
        """Initialize and execute the node"""
        pass
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> bool:
        """Validate required inputs are present"""
        for param in self.inputs:
            if param.required and not param.optional:
                if param.name not in inputs or inputs[param.name] is None:
                    raise ValueError(f"Required input '{param.name}' is missing")
        return True
    
    def get_input_value(self, inputs: Dict[str, Any], param_name: str, default: Any = None) -> Any:
        """Get input value with default fallback"""
        return inputs.get(param_name, default)

class ChatOpenAINode(INode):
    """ChatOpenAI node implementation"""
    
    def __init__(self):
        super().__init__()
        self.label = "ChatOpenAI"
        self.name = "chatOpenAI"
        self.version = 1.0
        self.type = "ChatOpenAI"
        self.icon = "openai.svg"
        self.category = "Chat Models"
        self.baseClasses = [self.type, "BaseChatModel", "BaseLanguageModel"]
        
        self.inputs = [
            NodeParam(
                label="OpenAI API Key",
                name="openAIApiKey",
                type="password",
                required=True
            ),
            NodeParam(
                label="Model Name",
                name="modelName",
                type="options",
                options=[
                    {"label": "gpt-4", "name": "gpt-4"},
                    {"label": "gpt-3.5-turbo", "name": "gpt-3.5-turbo"}
                ],
                default="gpt-3.5-turbo"
            ),
            NodeParam(
                label="Temperature",
                name="temperature",
                type="number",
                default=0.7,
                optional=True
            )
        ]
        
        self.outputs = [
            NodeOutput(
                label="ChatOpenAI",
                name="chatOpenAI",
                baseClasses=["ChatOpenAI", "BaseChatModel", "BaseLanguageModel"]
            )
        ]
    
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Dict[str, Any]:
        """Initialize ChatOpenAI instance"""
        self.validate_inputs(node_data.inputs)
        
        api_key = self.get_input_value(node_data.inputs, "openAIApiKey")
        model_name = self.get_input_value(node_data.inputs, "modelName", "gpt-3.5-turbo")
        temperature = float(self.get_input_value(node_data.inputs, "temperature", 0.7))
        
        # Simulate ChatOpenAI instance creation
        chat_openai = {
            "type": "ChatOpenAI",
            "config": {
                "model_name": model_name,
                "temperature": temperature,
                "api_key": api_key[:10] + "..." if api_key else None
            },
            "baseClasses": self.baseClasses
        }
        
        return chat_openai

class PromptTemplateNode(INode):
    """Prompt Template node implementation"""
    
    def __init__(self):
        super().__init__()
        self.label = "Prompt Template"
        self.name = "promptTemplate"
        self.version = 1.0
        self.type = "PromptTemplate"
        self.icon = "prompt.svg"
        self.category = "Prompts"
        self.baseClasses = [self.type, "BasePromptTemplate"]
        
        self.inputs = [
            NodeParam(
                label="Template",
                name="template",
                type="string",
                required=True,
                default="You are a helpful assistant. {input}"
            ),
            NodeParam(
                label="Format Prompt Values",
                name="promptValues",
                type="json",
                optional=True
            )
        ]
        
        self.outputs = [
            NodeOutput(
                label="Prompt Template",
                name="promptTemplate",
                baseClasses=["PromptTemplate", "BasePromptTemplate"]
            )
        ]
    
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Dict[str, Any]:
        """Initialize Prompt Template"""
        self.validate_inputs(node_data.inputs)
        
        template = self.get_input_value(node_data.inputs, "template")
        prompt_values = self.get_input_value(node_data.inputs, "promptValues", {})
        
        # Format template with input
        formatted_template = template.replace("{input}", input_text)
        
        # Apply additional prompt values
        for key, value in prompt_values.items():
            formatted_template = formatted_template.replace(f"{{{key}}}", str(value))
        
        prompt_template = {
            "type": "PromptTemplate",
            "template": template,
            "formatted": formatted_template,
            "baseClasses": self.baseClasses
        }
        
        return prompt_template

class LLMChainNode(INode):
    """LLM Chain node implementation"""
    
    def __init__(self):
        super().__init__()
        self.label = "LLM Chain"
        self.name = "llmChain"
        self.version = 1.0
        self.type = "LLMChain"
        self.icon = "chain.svg"
        self.category = "Chains"
        self.baseClasses = [self.type, "BaseChain"]
        
        self.inputs = [
            NodeParam(
                label="Language Model",
                name="model",
                type="BaseLanguageModel",
                required=True
            ),
            NodeParam(
                label="Prompt",
                name="prompt",
                type="BasePromptTemplate",
                required=True
            ),
            NodeParam(
                label="Chain Name",
                name="chainName",
                type="string",
                optional=True
            )
        ]
        
        self.outputs = [
            NodeOutput(
                label="LLM Chain",
                name="llmChain",
                baseClasses=["LLMChain", "BaseChain"]
            )
        ]
    
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Dict[str, Any]:
        """Initialize and execute LLM Chain"""
        self.validate_inputs(node_data.inputs)
        
        model = self.get_input_value(node_data.inputs, "model")
        prompt = self.get_input_value(node_data.inputs, "prompt")
        chain_name = self.get_input_value(node_data.inputs, "chainName", "default_chain")
        
        # Simulate LLM Chain execution
        if not model or not prompt:
            raise ValueError("Model and prompt are required for LLM Chain")
        
        # Mock AI response based on prompt
        formatted_prompt = prompt.get("formatted", "")
        
        # Simple mock response generation
        if "merhaba" in formatted_prompt.lower() or "hello" in formatted_prompt.lower():
            response = "Merhaba! Ben yardımcı bir AI asistanıyım. Size nasıl yardımcı olabilirim?"
        elif "nasılsın" in formatted_prompt.lower() or "how are you" in formatted_prompt.lower():
            response = "Teşekkür ederim! Ben bir AI olarak her zaman iyiyim ve size yardım etmeye hazırım."
        else:
            response = f"Anlıyorum. '{input_text}' hakkında size yardımcı olmaya çalışacağım."
        
        chain_result = {
            "type": "LLMChain",
            "response": response,
            "model_used": model.get("config", {}).get("model_name", "unknown"),
            "prompt_used": formatted_prompt,
            "baseClasses": self.baseClasses
        }
        
        return chain_result

# Node Registry
class NodeRegistry:
    """Registry for all available nodes"""
    
    def __init__(self):
        self.nodes = {}
        self._register_default_nodes()
    
    def _register_default_nodes(self):
        """Register default node types"""
        self.register_node("chatOpenAI", ChatOpenAINode)
        self.register_node("promptTemplate", PromptTemplateNode)
        self.register_node("llmChain", LLMChainNode)
    
    def register_node(self, node_type: str, node_class: type):
        """Register a new node type"""
        self.nodes[node_type] = node_class
    
    def get_node_instance(self, node_type: str) -> INode:
        """Get node instance by type"""
        if node_type not in self.nodes:
            raise ValueError(f"Unknown node type: {node_type}")
        return self.nodes[node_type]()
    
    def get_all_nodes(self) -> List[Dict[str, Any]]:
        """Get all available node definitions"""
        result = []
        for node_type, node_class in self.nodes.items():
            instance = node_class()
            result.append({
                "name": instance.name,
                "label": instance.label,
                "type": instance.type,
                "category": instance.category,
                "description": instance.description,
                "inputs": [param.dict() for param in instance.inputs],
                "outputs": [output.dict() for output in instance.outputs]
            })
        return result

