# React Flow + Python FastAPI ile Flowise Benzeri Uygulama - Baştan Sona Rehber

## BÖLÜM 1: TERİMLERİ ANLAMAK

### 1.1 Node Nedir? Class mı, Obje mi?

**Node = Lego Parçası**

```python
# Node bir CLASS'tır (kalıp/şablon)
class ChatGPTNode:
    def __init__(self):
        self.name = "ChatGPT"
        self.inputs = ["prompt", "temperature"]
        self.outputs = ["response"]
    
    def run(self, prompt, temperature):
        # ChatGPT'ye bağlan ve cevap al
        return "AI response"

# Node'u kullanmak = OBJE oluşturmak
node1 = ChatGPTNode()  # Bu bir OBJE (instance)
result = node1.run("Merhaba", 0.7)
```

### 1.2 Edge Nedir?

**Edge = Bağlantı Kablosu**

```python
# Frontend'den gelen JSON
edge = {
    "source": "node1",        # Nereden (hangi node'dan)
    "sourceHandle": "output", # O node'un hangi çıkışından
    "target": "node2",        # Nereye (hangi node'a)
    "targetHandle": "input"   # O node'un hangi girişine
}

# Yani: node1'in output'u → node2'nin input'una bağlı
```

### 1.3 Objelerin Node'lara Input Olarak Geçmesi

```python
# Node 1: ChatGPT objesi oluşturur
class ChatGPTNode:
    def run(self):
        chatgpt = ChatGPT(api_key="xxx")  # Bir OBJE oluşturdu
        return chatgpt  # Bu objeyi döndürdü

# Node 2: Bu objeyi alır ve kullanır
class ConversationNode:
    def run(self, llm):  # llm = yukarıdaki chatgpt objesi
        response = llm.chat("Merhaba")  # Objeyi kullanıyor
        return response

# Bağlantı:
node1_result = ChatGPTNode().run()      # chatgpt objesi
node2_result = ConversationNode().run(node1_result)  # objeyi aldı
```

### 1.4 Directed Graph (Yönlü Graf) Nedir?

```
Directed Graph = Tek yönlü yollar

A → B → C
↓       ↓
D → E → F

- Ok yönünde gidebilirsin
- C'den A'ya gidemezsin (ters yön yok)
```

### 1.5 Topological Sort Nedir?

**Sıralama Algoritması: Hangi node'u önce çalıştıracağız?**

```python
# Problem:
# B, A'ya bağlı
# C, B'ye bağlı
# Hangi sırayla çalıştırmalı? A → B → C

def topological_sort(nodes, edges):
    # 1. Her node'un kaç bağlantısı var?
    dependencies = {
        "A": 0,  # Kimseye bağlı değil
        "B": 1,  # A'ya bağlı
        "C": 1   # B'ye bağlı
    }
    
    # 2. Bağlı olmayanlardan başla
    order = []
    while nodes:
        # Bağımlılığı olmayanı bul
        for node in nodes:
            if dependencies[node] == 0:
                order.append(node)  # Sıraya ekle
                # Bu node'a bağlı olanların sayısını azalt
                
    return order  # ["A", "B", "C"]
```

### 1.6 End Node ve Geriye Traverse

```
End Node = Son durak (output edge'i yok)

A → B → C
    ↓
    D → E (End node - E'den başka yere ok yok)

Geriye traverse = Sondan başa doğru git
E → D → B → A (dependencies'leri bul)
```

### 1.7 Handle Nedir?

```
Handle = Priz/Soket

[ChatGPT Node]
  Inputs:
    - prompt (handle)     ← Buraya prompt bağlanır
    - temperature (handle) ← Buraya temperature bağlanır
  Outputs:
    - response (handle)   → Buradan response çıkar
```

### 1.8 ReAct Agent Nedir?

```
ReAct = Reason + Act (Düşün + Hareket Et)

1. Soru: "Paris'in nüfusu nedir?"
2. Düşün: "Bunu bilmiyorum, arama yapmam lazım"
3. Hareket: SearchTool.search("Paris population")
4. Sonuç: "2.1 milyon"
5. Düşün: "Cevabı buldum"
6. Final: "Paris'in nüfusu 2.1 milyondur"
```

### 1.9 State Management

```python
# State = Hafıza/Durum

flow_state = {
    "user_name": "Ahmet",
    "conversation_id": "123",
    "messages": ["Merhaba", "Nasılsın?"],
    "custom_data": {"mood": "happy"}
}

# State'e yazma
flow_state["user_name"] = "Mehmet"

# State'den okuma
name = flow_state["user_name"]
```

### 1.10 Node Registry

```python
# Registry = Telefon Rehberi

node_registry = {
    "chatgpt": ChatGPTNode,      # İsim → Class eşleşmesi
    "prompt": PromptNode,
    "memory": MemoryNode
}

# Kullanım
node_name = "chatgpt"
NodeClass = node_registry[node_name]  # Class'ı bul
node = NodeClass()  # Obje oluştur
```

## BÖLÜM 2: SIFIRDAN UYGULAMA YAPIMI

### ADIM 1: Proje Yapısı

```
my-flowise-clone/
├── backend/
│   ├── main.py              # FastAPI ana dosya
│   ├── models.py             # Pydantic modeller
│   ├── nodes/
│   │   ├── __init__.py
│   │   ├── base.py          # Base node class
│   │   ├── llm_nodes.py     # LLM node'ları
│   │   ├── tool_nodes.py    # Tool node'ları
│   │   └── chain_nodes.py   # Chain node'ları
│   ├── executor.py          # Flow çalıştırıcı
│   └── registry.py          # Node registry
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.js
    │   ├── components/
    │   │   ├── Flow.js      # React Flow component
    │   │   └── Sidebar.js   # Node listesi
    │   └── api.js           # Backend iletişimi
```

### ADIM 2: Backend - Base Node Sistemi

```python
# backend/nodes/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from pydantic import BaseModel

# Node'un aldığı parametreler
class NodeInput(BaseModel):
    name: str          # "prompt", "temperature" gibi
    type: str          # "string", "number", "object"
    required: bool = True
    default: Any = None

# Node'un çıktıları
class NodeOutput(BaseModel):
    name: str          # "response", "result" gibi
    type: str          # Çıktının tipi

# Ana Node sınıfı (kalıp)
class BaseNode(ABC):
    """Tüm node'ların türeyeceği ana sınıf"""
    
    def __init__(self):
        self.id = ""  # Her node'un unique ID'si
        self.name = ""  # Node tipi (chatgpt, prompt, vb)
        self.label = ""  # UI'da görünen isim
        self.category = ""  # Kategori (llms, tools, vb)
        self.inputs: List[NodeInput] = []
        self.outputs: List[NodeOutput] = []
        
    @abstractmethod
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Node'u çalıştır - Alt sınıflar implement etmeli"""
        pass
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> bool:
        """Gelen inputları kontrol et"""
        for input_def in self.inputs:
            if input_def.required and input_def.name not in inputs:
                raise ValueError(f"Required input missing: {input_def.name}")
        return True
```

### ADIM 3: İlk Node'umuzu Yapalım - ChatGPT Node

```python
# backend/nodes/llm_nodes.py
from .base import BaseNode, NodeInput, NodeOutput
from langchain_openai import ChatOpenAI

class ChatGPTNode(BaseNode):
    """ChatGPT/OpenAI modeli node'u"""
    
    def __init__(self):
        super().__init__()
        self.name = "chatgpt"
        self.label = "ChatGPT"
        self.category = "llms"
        
        # Bu node'un inputları
        self.inputs = [
            NodeInput(name="api_key", type="string", required=True),
            NodeInput(name="model", type="string", default="gpt-3.5-turbo"),
            NodeInput(name="temperature", type="number", default=0.7)
        ]
        
        # Bu node'un outputları
        self.outputs = [
            NodeOutput(name="llm", type="ChatOpenAI")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> ChatOpenAI:
        """ChatGPT objesi oluştur ve döndür"""
        # Input'ları al
        api_key = inputs["api_key"]
        model = inputs.get("model", "gpt-3.5-turbo")
        temperature = inputs.get("temperature", 0.7)
        
        # LangChain ChatOpenAI objesi oluştur
        llm = ChatOpenAI(
            api_key=api_key,
            model=model,
            temperature=temperature
        )
        
        return llm  # Bu obje başka node'lara input olacak
```

### ADIM 4: Prompt Template Node

```python
# backend/nodes/llm_nodes.py (devamı)
from langchain.prompts import PromptTemplate

class PromptTemplateNode(BaseNode):
    """Prompt şablonu node'u"""
    
    def __init__(self):
        super().__init__()
        self.name = "prompt_template"
        self.label = "Prompt Template"
        self.category = "prompts"
        
        self.inputs = [
            NodeInput(name="template", type="string", required=True),
            NodeInput(name="input_variables", type="list", default=["input"])
        ]
        
        self.outputs = [
            NodeOutput(name="prompt", type="PromptTemplate")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> PromptTemplate:
        """Prompt template oluştur"""
        template = inputs["template"]
        input_variables = inputs.get("input_variables", ["input"])
        
        prompt = PromptTemplate(
            template=template,
            input_variables=input_variables
        )
        
        return prompt
```

### ADIM 5: Chain Node - Parçaları Birleştir

```python
# backend/nodes/chain_nodes.py
from langchain.chains import LLMChain
from .base import BaseNode, NodeInput, NodeOutput

class LLMChainNode(BaseNode):
    """LLM ve Prompt'u birleştiren chain"""
    
    def __init__(self):
        super().__init__()
        self.name = "llm_chain"
        self.label = "LLM Chain"
        self.category = "chains"
        
        self.inputs = [
            NodeInput(name="llm", type="object", required=True),
            NodeInput(name="prompt", type="object", required=True)
        ]
        
        self.outputs = [
            NodeOutput(name="chain", type="LLMChain")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> LLMChain:
        """LLM ve Prompt'u birleştir"""
        llm = inputs["llm"]  # ChatGPTNode'dan gelen obje
        prompt = inputs["prompt"]  # PromptTemplateNode'dan gelen obje
        
        chain = LLMChain(
            llm=llm,
            prompt=prompt
        )
        
        return chain
```

### ADIM 6: Node Registry - Node'ları Kaydet

```python
# backend/registry.py
from typing import Dict, Type
from nodes.base import BaseNode
from nodes.llm_nodes import ChatGPTNode, PromptTemplateNode
from nodes.chain_nodes import LLMChainNode

class NodeRegistry:
    """Tüm node'ları tutan registry (telefon rehberi gibi)"""
    
    def __init__(self):
        self.nodes: Dict[str, Type[BaseNode]] = {}
        self._register_all_nodes()
    
    def _register_all_nodes(self):
        """Tüm node'ları kaydet"""
        # Her node'u ismiyle kaydet
        node_classes = [
            ChatGPTNode,
            PromptTemplateNode,
            LLMChainNode
        ]
        
        for NodeClass in node_classes:
            instance = NodeClass()
            self.nodes[instance.name] = NodeClass
    
    def get_node_class(self, node_name: str) -> Type[BaseNode]:
        """İsme göre node class'ını getir"""
        if node_name not in self.nodes:
            raise ValueError(f"Unknown node: {node_name}")
        return self.nodes[node_name]
    
    def create_node(self, node_name: str) -> BaseNode:
        """Yeni node instance'ı oluştur"""
        NodeClass = self.get_node_class(node_name)
        return NodeClass()
    
    def get_all_nodes(self) -> Dict[str, Dict]:
        """Frontend için tüm node bilgilerini getir"""
        result = {}
        for node_name, NodeClass in self.nodes.items():
            instance = NodeClass()
            result[node_name] = {
                "name": instance.name,
                "label": instance.label,
                "category": instance.category,
                "inputs": [inp.dict() for inp in instance.inputs],
                "outputs": [out.dict() for out in instance.outputs]
            }
        return result
```

### ADIM 7: Flow Executor - Akışı Çalıştır

```python
# backend/executor.py
from typing import Dict, List, Any
from collections import defaultdict, deque
from registry import NodeRegistry

class FlowExecutor:
    """Flow'u çalıştıran motor"""
    
    def __init__(self, registry: NodeRegistry):
        self.registry = registry
        self.node_outputs = {}  # Her node'un çıktısını sakla
    
    async def execute(self, flow_data: Dict) -> Any:
        """
        Flow'u çalıştır
        flow_data = {
            "nodes": [...],  # Node listesi
            "edges": [...]   # Bağlantı listesi
        }
        """
        nodes = flow_data["nodes"]
        edges = flow_data["edges"]
        
        # 1. Çalıştırma sırasını bul (topological sort)
        execution_order = self._get_execution_order(nodes, edges)
        
        # 2. Her node'u sırayla çalıştır
        for node_id in execution_order:
            # Node bilgisini bul
            node_data = next(n for n in nodes if n["id"] == node_id)
            
            # Node instance'ı oluştur
            node = self.registry.create_node(node_data["type"])
            node.id = node_id
            
            # Bu node'un input'larını hazırla
            node_inputs = await self._prepare_inputs(node_id, node_data, edges)
            
            # Node'u çalıştır
            result = await node.execute(node_inputs)
            
            # Sonucu sakla
            self.node_outputs[node_id] = result
        
        # Son node'un çıktısını döndür
        return self.node_outputs[execution_order[-1]]
    
    def _get_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Topological sort ile çalıştırma sırasını bul"""
        # Her node'un kaç giriş bağlantısı var?
        in_degree = defaultdict(int)
        adjacency = defaultdict(list)
        
        # Tüm node'ları ekle
        node_ids = [n["id"] for n in nodes]
        for node_id in node_ids:
            in_degree[node_id] = 0
        
        # Bağlantıları say
        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            adjacency[source].append(target)
            in_degree[target] += 1
        
        # Giriş bağlantısı olmayanlardan başla
        queue = deque([n for n in node_ids if in_degree[n] == 0])
        result = []
        
        while queue:
            node = queue.popleft()
            result.append(node)
            
            # Bu node'a bağlı olanların giriş sayısını azalt
            for neighbor in adjacency[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result
    
    async def _prepare_inputs(self, node_id: str, node_data: Dict, edges: List[Dict]) -> Dict:
        """Node için input'ları hazırla"""
        inputs = {}
        
        # Node'un kendi input değerleri (UI'dan gelen)
        if "inputs" in node_data["data"]:
            inputs.update(node_data["data"]["inputs"])
        
        # Bağlantılardan gelen input'lar
        incoming_edges = [e for e in edges if e["target"] == node_id]
        
        for edge in incoming_edges:
            source_id = edge["source"]
            target_handle = edge["targetHandle"]
            
            # Source node'un output'unu al
            if source_id in self.node_outputs:
                inputs[target_handle] = self.node_outputs[source_id]
        
        return inputs
```

### ADIM 8: FastAPI Ana Dosya

```python
# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import json

from registry import NodeRegistry
from executor import FlowExecutor

app = FastAPI()

# CORS ayarları (React'tan gelen isteklere izin ver)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global registry
registry = NodeRegistry()

# API Modelleri
class FlowData(BaseModel):
    nodes: list
    edges: list

class ChatMessage(BaseModel):
    message: str
    flow_id: str

# API Endpoints
@app.get("/api/nodes")
async def get_nodes():
    """Tüm mevcut node'ları getir"""
    return registry.get_all_nodes()

@app.post("/api/execute")
async def execute_flow(flow_data: FlowData):
    """Flow'u çalıştır"""
    executor = FlowExecutor(registry)
    result = await executor.execute(flow_data.dict())
    return {"result": str(result)}

@app.websocket("/ws/chat/{flow_id}")
async def websocket_chat(websocket: WebSocket, flow_id: str):
    """WebSocket üzerinden chat"""
    await websocket.accept()
    
    try:
        while True:
            # Mesajı al
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Flow'u çalıştır
            # TODO: Flow'u veritabanından al
            # TODO: Mesajı flow'a input olarak ver
            
            # Cevabı gönder
            await websocket.send_json({
                "type": "response",
                "message": "AI response here"
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### ADIM 9: Frontend - React Flow Kurulumu

```bash
# Frontend klasörü oluştur
mkdir frontend
cd frontend

# React uygulaması oluştur
npx create-react-app . --template typescript

# React Flow'u yükle
npm install reactflow
npm install axios
```

### ADIM 10: Frontend - Flow Component

```jsx
// frontend/src/components/Flow.js
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

// Custom Node Component
const CustomNode = ({ data }) => {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '10px',
      minWidth: '150px'
    }}>
      <div style={{ fontWeight: 'bold' }}>{data.label}</div>
      
      {/* Inputs */}
      {data.inputs && data.inputs.map((input, i) => (
        <div key={i} style={{ fontSize: '12px', marginTop: '5px' }}>
          📥 {input.label}
        </div>
      ))}
      
      {/* Outputs */}
      {data.outputs && data.outputs.map((output, i) => (
        <div key={i} style={{ fontSize: '12px', marginTop: '5px' }}>
          📤 {output.label}
        </div>
      ))}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeTypes, setNodeTypes] = useState({});

  // Backend'den node tiplerini al
  useEffect(() => {
    axios.get('http://localhost:8000/api/nodes')
      .then(response => {
        setNodeTypes(response.data);
      });
  }, []);

  // Yeni edge ekleme
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Node ekleme (drag & drop)
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('nodeType');
      const nodeData = nodeTypes[type];
      
      if (!nodeData) return;

      const position = {
        x: event.clientX - event.target.getBoundingClientRect().left,
        y: event.clientY - event.target.getBoundingClientRect().top,
      };

      const newNode = {
        id: `${type}_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeData.label,
          nodeType: type,
          inputs: nodeData.inputs,
          outputs: nodeData.outputs,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodeTypes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Flow'u çalıştır
  const executeFlow = async () => {
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        data: node.data
      })),
      edges: edges
    };

    try {
      const response = await axios.post('http://localhost:8000/api/execute', flowData);
      console.log('Result:', response.data);
      alert('Flow executed! Check console for results.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error executing flow!');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Sol Panel - Node Listesi */}
      <div style={{
        width: '200px',
        background: '#f5f5f5',
        padding: '10px',
        borderRight: '1px solid #ddd'
      }}>
        <h3>Nodes</h3>
        {Object.entries(nodeTypes).map(([type, node]) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('nodeType', type)}
            style={{
              background: 'white',
              padding: '10px',
              margin: '5px 0',
              borderRadius: '5px',
              cursor: 'move',
              border: '1px solid #ddd'
            }}
          >
            {node.label}
          </div>
        ))}
        
        <button
          onClick={executeFlow}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Run Flow
        </button>
      </div>

      {/* Sağ Panel - Flow Editor */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default Flow;
```

### ADIM 11: Basit Bir Flow Örneği - Chat Uygulaması

```python
# backend/nodes/output_nodes.py
from .base import BaseNode, NodeInput, NodeOutput

class ChatOutputNode(BaseNode):
    """Chat çıktısı için final node"""
    
    def __init__(self):
        super().__init__()
        self.name = "chat_output"
        self.label = "Chat Output"
        self.category = "outputs"
        
        self.inputs = [
            NodeInput(name="chain", type="object", required=True),
            NodeInput(name="user_input", type="string", required=True)
        ]
        
        self.outputs = [
            NodeOutput(name="response", type="string")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> str:
        """Chain'i çalıştır ve sonucu döndür"""
        chain = inputs["chain"]
        user_input = inputs["user_input"]
        
        # LangChain'i çalıştır
        response = await chain.arun(input=user_input)
        
        return response
```

### ADIM 12: Memory (Hafıza) Node Ekleyelim

```python
# backend/nodes/memory_nodes.py
from langchain.memory import ConversationBufferMemory
from .base import BaseNode, NodeInput, NodeOutput

class ConversationMemoryNode(BaseNode):
    """Sohbet hafızası node'u"""
    
    def __init__(self):
        super().__init__()
        self.name = "conversation_memory"
        self.label = "Conversation Memory"
        self.category = "memory"
        
        self.inputs = [
            NodeInput(name="session_id", type="string", default="default")
        ]
        
        self.outputs = [
            NodeOutput(name="memory", type="ConversationBufferMemory")
        ]
    
    # Global hafıza storage (production'da Redis kullan)
    _memory_store = {}
    
    async def execute(self, inputs: Dict[str, Any]) -> ConversationBufferMemory:
        """Session'a özel hafıza döndür"""
        session_id = inputs.get("session_id", "default")
        
        # Bu session için hafıza var mı?
        if session_id not in self._memory_store:
            self._memory_store[session_id] = ConversationBufferMemory()
        
        return self._memory_store[session_id]
```

### ADIM 13: Tool (Araç) Node'ları

```python
# backend/nodes/tool_nodes.py
from langchain.tools import DuckDuckGoSearchRun
from langchain.tools import Calculator
from .base import BaseNode, NodeOutput

class WebSearchNode(BaseNode):
    """Web arama tool'u"""
    
    def __init__(self):
        super().__init__()
        self.name = "web_search"
        self.label = "Web Search"
        self.category = "tools"
        
        self.outputs = [
            NodeOutput(name="tool", type="Tool")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> DuckDuckGoSearchRun:
        return DuckDuckGoSearchRun()

class CalculatorNode(BaseNode):
    """Hesap makinesi tool'u"""
    
    def __init__(self):
        super().__init__()
        self.name = "calculator"
        self.label = "Calculator"
        self.category = "tools"
        
        self.outputs = [
            NodeOutput(name="tool", type="Tool")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> Calculator:
        return Calculator()
```

### ADIM 14: Agent Node - Akıllı Ajan

```python
# backend/nodes/agent_nodes.py
from langchain.agents import create_react_agent, AgentExecutor
from .base import BaseNode, NodeInput, NodeOutput

class ReactAgentNode(BaseNode):
    """ReAct Agent - Düşünüp hareket eden ajan"""
    
    def __init__(self):
        super().__init__()
        self.name = "react_agent"
        self.label = "ReAct Agent"
        self.category = "agents"
        
        self.inputs = [
            NodeInput(name="llm", type="object", required=True),
            NodeInput(name="tools", type="list", required=True),
            NodeInput(name="prompt", type="object", required=True),
            NodeInput(name="memory", type="object", required=False)
        ]
        
        self.outputs = [
            NodeOutput(name="agent", type="AgentExecutor")
        ]
    
    async def execute(self, inputs: Dict[str, Any]) -> AgentExecutor:
        """Agent oluştur"""
        llm = inputs["llm"]
        tools = inputs["tools"]
        prompt = inputs["prompt"]
        memory = inputs.get("memory")
        
        # Agent oluştur
        agent = create_react_agent(
            llm=llm,
            tools=tools,
            prompt=prompt
        )
        
        # Executor oluştur
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            memory=memory,
            verbose=True  # Debug için
        )
        
        return agent_executor
```

### ADIM 15: Deployment ve Çalıştırma

```bash
# Backend'i başlat
cd backend
pip install -r requirements.txt
python main.py

# Frontend'i başlat (yeni terminal)
cd frontend
npm start
```

### requirements.txt
```
fastapi
uvicorn
langchain
langchain-openai
pydantic
python-multipart
websockets
```

## KULLANIM SENARYOSU

1. **Basit Chat Flow:**
   - ChatGPT Node ekle → API key gir
   - Prompt Template Node ekle → "Sen yardımsever bir asistansın. {input}"
   - LLM Chain Node ekle
   - Bağlantıları yap:
     - ChatGPT → LLM Chain (llm girişine)
     - Prompt → LLM Chain (prompt girişine)
   - Run Flow!

2. **Agent Flow (Akıllı Asistan):**
   - ChatGPT Node
   - Web Search Tool Node
   - Calculator Tool Node
   - Agent Prompt Node
   - ReAct Agent Node
   - Bağlantıları yap ve çalıştır!

## ÖNEMLİ NOKTALAR

1. **Her node bir Python class'ı** - `execute()` metodu ile çalışır
2. **Node'lar obje döndürür** - Bu objeler diğer node'lara input olur
3. **Flow executor sırayı belirler** - Topological sort ile
4. **Registry pattern** - Tüm node'lar merkezi bir yerde kayıtlı
5. **WebSocket** - Gerçek zamanlı chat için
6. **Type safety** - Pydantic ile input validation

Bu rehberi takip ederek, Flowise benzeri bir visual LLM orchestration tool'u yapabilirsin!