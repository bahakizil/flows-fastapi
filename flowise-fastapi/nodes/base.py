
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_core.runnables import Runnable
from enum import Enum

# 1. Node'un türünü belirten bir Enum tanımlıyoruz.
class NodeType(str, Enum):
    PROVIDER = "provider"    # Bir LangChain nesnesi SAĞLAR (LLM, Tool, Prompt)
    PROCESSOR = "processor"  # Birden fazla nesneyi İŞLER (Agent gibi)
    TERMINATOR = "terminator" # Bir zincirin sonunu DÖNÜŞTÜRÜR (Output Parser gibi)

# 2. Metadata için Pydantic modelleri, standartları zorunlu kılar.
class NodeInput(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True
    # Bu alan, girdinin başka bir node'dan mı (bağlantı) yoksa kullanıcıdan mı geleceğini belirtir.
    is_connection: bool = False 
    default: Any = None

class NodeMetadata(BaseModel):
    name: str
    description: str
    node_type: NodeType # Her node türünü belirtmek zorunda.
    inputs: List[NodeInput] = []
    outputs: List[Dict[str, Any]] = Field(default_factory=list) # Gelecekteki geliştirmeler için

# 3. Ana Soyut Sınıf (Tüm node'ların atası)
class BaseNode(ABC):
    _metadatas: Dict[str, Any] # Geliştiriciler bunu kendi node'larında tanımlayacak.
    
    @property
    def metadata(self) -> NodeMetadata:
        """Metadatayı Pydantic modeline göre doğrular ve döndürür."""
        return NodeMetadata(**self._metadatas)

    @abstractmethod
    def _execute(self, *args, **kwargs) -> Runnable:
        """
        Her alt sınıfın uygulamak zorunda olduğu ana mantık.
        Bu metod, ilgili LangChain nesnesini oluşturur ve döndürür.
        """
        pass

    def execute(self, *args, **kwargs) -> Runnable:
        """
        Workflow Runner tarafından çağrılacak olan genel metod.
        Gelecekte burada loglama, hata yakalama gibi ortak işlemler yapılabilir.
        """
        return self._execute(*args, **kwargs)

# 4. Geliştiricilerin Kullanacağı 3 Standart Node Sınıfı

class ProviderNode(BaseNode):
    """
    Sıfırdan bir LangChain nesnesi (LLM, Tool, Prompt, Memory) oluşturan node'lar için temel sınıf.
    """
    def __init__(self):
        if "node_type" not in self._metadatas:
            self._metadatas["node_type"] = NodeType.PROVIDER

    @abstractmethod
    def _execute(self, **kwargs) -> Runnable:
        pass


class ProcessorNode(BaseNode):
    """
    Birden fazla LangChain nesnesini girdi olarak alıp birleştiren node'lar (örn: Agent).
    """
    def __init__(self):
        if "node_type" not in self._metadatas:
            self._metadatas["node_type"] = NodeType.PROCESSOR
    
    @abstractmethod
    def _execute(self, inputs: Dict[str, Any], connected_nodes: Dict[str, Runnable]) -> Runnable:
        """
        'inputs' kullanıcıdan gelen verileri, 'connected_nodes' ise bağlanan diğer node'ların
        çalıştırılabilir (Runnable) nesnelerini içerir.
        """
        pass

class TerminatorNode(BaseNode):
    """
    Bir zincirin sonuna eklenen ve çıktıyı işleyen/dönüştüren node'lar (örn: OutputParser).
    Genellikle tek bir node'dan girdi alırlar.
    """
    def __init__(self):
        if "node_type" not in self._metadatas:
            self._metadatas["node_type"] = NodeType.TERMINATOR

    @abstractmethod
    def _execute(self, previous_node: Runnable, inputs: Dict[str, Any]) -> Runnable:
        """
        'previous_node' bir önceki node'dan gelen çalıştırılabilir (Runnable) nesnedir.
        """
        pass
