# Flowise Teknik Analiz Raporu ve Python FastAPI İmplementasyon Rehberi

## 1. Flowise Mimarisi Genel Bakış

### 1.1 Temel Yapı
Flowise, **monorepo** yapısında 3 ana modülden oluşuyor:

- **Server (Backend)**: Node.js/Express tabanlı API sunucusu
- **UI (Frontend)**: React tabanlı görsel editör
- **Components**: LangChain entegrasyonları ve node implementasyonları

### 1.2 Teknoloji Stack'i
- **Backend**: TypeScript, Node.js, Express.js
- **Database**: TypeORM ile SQLite/PostgreSQL/MySQL desteği
- **Gerçek Zamanlı İletişim**: Socket.IO
- **Frontend**: React, Redux
- **LLM Framework**: LangChain.js
- **Queue Sistemi**: BullMQ (opsiyonel)

## 2. Backend Mimarisi Detayları

### 2.1 Temel Bileşenler

#### NodesPool
- Tüm kullanılabilir node tiplerini yöneten singleton class
- Node'ları dinamik olarak yükler ve kategorize eder
- Her node'un metadata'sını (inputs, outputs, credentials) saklar

#### ChatFlow Entity
- Workflow'ları veritabanında saklar
- JSON formatında flow graph'ı içerir
- Node'lar arası bağlantıları tanımlar

#### CachePool
- LangChain cache implementasyonlarını yönetir
- Memory, Redis, Momento cache desteği

#### AbortControllerPool
- Uzun süren işlemleri iptal etme mekanizması
- Her chat session için ayrı controller

### 2.2 Node Execution Mekanizması

#### Node Interface (INode)
```typescript
interface INode {
    label: string
    name: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs?: INodeParams[]
    outputs?: INodeOutputsValue[]
    init?(nodeData: INodeData): Promise<any>
}
```

#### Execution Flow
1. **Graph Parsing**: Chatflow JSON'ı parse edilir
2. **Topological Sort**: Node'lar bağımlılıklarına göre sıralanır
3. **Sequential Execution**: Her node sırayla execute edilir
4. **Data Passing**: Output'lar input olarak sonraki node'a geçirilir

### 2.3 API Endpoints

#### Temel Endpoint'ler
- `POST /api/v1/prediction/:id` - Chat prediction
- `GET /api/v1/chatflows` - Tüm flow'ları listele
- `POST /api/v1/chatflows` - Yeni flow oluştur
- `PUT /api/v1/chatflows/:id` - Flow güncelle
- `DELETE /api/v1/chatflows/:id` - Flow sil

#### Streaming Support
- Server-Sent Events (SSE) kullanır
- Socket.IO ile gerçek zamanlı iletişim
- Token-by-token streaming response

## 3. Node Sistemi Detayları

### 3.1 Node Kategorileri
- **Agents**: ReAct, OpenAI Function, Conversational agents
- **Chains**: LLMChain, ConversationChain, QAChain
- **Chat Models**: OpenAI, Anthropic, Ollama, vb.
- **Tools**: Calculator, SearchAPI, Custom functions
- **Memory**: BufferMemory, ConversationSummaryMemory
- **Vector Stores**: Pinecone, Chroma, Qdrant
- **Document Loaders**: PDF, CSV, Web scraper
- **Text Splitters**: RecursiveCharacterTextSplitter

### 3.2 Node İletişimi
- **Data Flow**: Her node'un output'u bir sonraki node'un input'u olur
- **Type Safety**: baseClasses ile tip uyumluluğu kontrol edilir
- **Credential Management**: Hassas bilgiler encrypted olarak saklanır

## 4. Workflow Orchestration

### 4.1 AgentFlow V2 Mimarisi
- **Explicit Control Flow**: Görsel bağlantılar execution path'i belirler
- **Flow State**: `$flow.state` ile workflow boyunca veri paylaşımı
- **Conditional Logic**: If/Else node'ları ile dallanma
- **Loop Support**: Iteratif işlemler için loop node'ları
- **Sub-flow Execution**: Nested workflow desteği

### 4.2 Execution Context
```javascript
$flow = {
    sessionId: string,
    chatId: string,
    chatflowId: string,
    input: string,
    state: object
}
```

## 5. Python FastAPI ile İmplementasyon Önerileri

### 5.1 Temel Mimari

```python
# Core Architecture
project/
├── backend/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── chatflows.py
│   │   │   ├── predictions.py
│   │   │   └── nodes.py
│   │   └── websocket.py
│   ├── core/
│   │   ├── nodes/
│   │   │   ├── base.py
│   │   │   ├── agents/
│   │   │   ├── chains/
│   │   │   └── tools/
│   │   ├── execution/
│   │   │   ├── graph_executor.py
│   │   │   └── node_runner.py
│   │   └── flow_state.py
│   ├── models/
│   │   ├── chatflow.py
│   │   └── node.py
│   └── services/
│       ├── node_registry.py
│       └── cache_manager.py
└── frontend/
    └── react-flow-app/
```

### 5.2 Base Node Implementasyonu

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class NodeInput(BaseModel):
    name: str
    type: str
    required: bool = True
    default: Optional[Any] = None

class NodeOutput(BaseModel):
    name: str
    type: str

class BaseNode(ABC):
    def __init__(self):
        self.label: str = ""
        self.name: str = ""
        self.type: str = ""
        self.category: str = ""
        self.inputs: List[NodeInput] = []
        self.outputs: List[NodeOutput] = []
    
    @abstractmethod
    async def execute(self, inputs: Dict[str, Any], flow_state: Dict[str, Any]) -> Any:
        """Execute node logic"""
        pass
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> bool:
        """Validate required inputs are present"""
        for input_def in self.inputs:
            if input_def.required and input_def.name not in inputs:
                return False
        return True
```

### 5.3 Node Registry Sistemi

```python
from typing import Dict, Type
import importlib
import os

class NodeRegistry:
    def __init__(self):
        self.nodes: Dict[str, Type[BaseNode]] = {}
        self.categories: Dict[str, List[str]] = {}
    
    def discover_nodes(self, nodes_dir: str):
        """Dinamik olarak node'ları keşfet ve kaydet"""
        for category in os.listdir(nodes_dir):
            category_path = os.path.join(nodes_dir, category)
            if os.path.isdir(category_path):
                self.categories[category] = []
                
                for file in os.listdir(category_path):
                    if file.endswith('.py') and not file.startswith('_'):
                        module_name = file[:-3]
                        module = importlib.import_module(
                            f'core.nodes.{category}.{module_name}'
                        )
                        
                        # BaseNode'dan türeyen sınıfları bul
                        for attr_name in dir(module):
                            attr = getattr(module, attr_name)
                            if (isinstance(attr, type) and 
                                issubclass(attr, BaseNode) and 
                                attr != BaseNode):
                                node = attr()
                                self.nodes[node.name] = attr
                                self.categories[category].append(node.name)
    
    def get_node_class(self, node_name: str) -> Type[BaseNode]:
        return self.nodes.get(node_name)
```

### 5.4 Graph Executor

```python
from typing import Dict, List, Any
import asyncio
from collections import defaultdict, deque

class GraphExecutor:
    def __init__(self, node_registry: NodeRegistry):
        self.node_registry = node_registry
    
    async def execute_flow(self, flow_data: Dict, initial_input: str) -> Any:
        """Flow'u execute et"""
        # Flow state'i initialize et
        flow_state = {
            "sessionId": flow_data.get("sessionId"),
            "chatId": flow_data.get("chatId"),
            "input": initial_input,
            "state": {}
        }
        
        # Graph'ı parse et
        nodes = flow_data["nodes"]
        edges = flow_data["edges"]
        
        # Topological sort
        execution_order = self._topological_sort(nodes, edges)
        
        # Node outputs'ları sakla
        node_outputs = {}
        
        # Sırayla execute et
        for node_id in execution_order:
            node_data = next(n for n in nodes if n["id"] == node_id)
            node_class = self.node_registry.get_node_class(node_data["type"])
            
            if not node_class:
                raise ValueError(f"Unknown node type: {node_data['type']}")
            
            # Node instance oluştur
            node = node_class()
            
            # Input'ları hazırla
            node_inputs = self._prepare_inputs(
                node_id, node_data, edges, node_outputs
            )
            
            # Execute
            output = await node.execute(node_inputs, flow_state)
            node_outputs[node_id] = output
        
        # Son node'un output'unu dön
        return node_outputs.get(execution_order[-1])
    
    def _topological_sort(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Kahn's algorithm ile topological sort"""
        # Adjacency list ve in-degree hesapla
        graph = defaultdict(list)
        in_degree = defaultdict(int)
        node_ids = [n["id"] for n in nodes]
        
        for node_id in node_ids:
            in_degree[node_id] = 0
        
        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            graph[source].append(target)
            in_degree[target] += 1
        
        # In-degree 0 olan node'ları queue'ya ekle
        queue = deque([n for n in node_ids if in_degree[n] == 0])
        result = []
        
        while queue:
            node = queue.popleft()
            result.append(node)
            
            # Komşuların in-degree'lerini azalt
            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        if len(result) != len(node_ids):
            raise ValueError("Graph has cycles!")
        
        return result
    
    def _prepare_inputs(self, node_id: str, node_data: Dict, 
                       edges: List[Dict], node_outputs: Dict) -> Dict[str, Any]:
        """Node için input'ları hazırla"""
        inputs = {}
        
        # Edge'lerden gelen input'lar
        incoming_edges = [e for e in edges if e["target"] == node_id]
        for edge in incoming_edges:
            source_output = node_outputs.get(edge["source"])
            if source_output is not None:
                # Hangi output'tan hangi input'a bağlı olduğunu belirle
                target_handle = edge.get("targetHandle", "input")
                inputs[target_handle] = source_output
        
        # Node data'dan gelen static input'lar
        inputs.update(node_data.get("data", {}).get("inputs", {}))
        
        return inputs
```

### 5.5 WebSocket/SSE Streaming

```python
from fastapi import FastAPI, WebSocket
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

@app.websocket("/ws/{flow_id}")
async def websocket_endpoint(websocket: WebSocket, flow_id: str):
    await websocket.accept()
    
    try:
        while True:
            # Client'tan mesaj al
            data = await websocket.receive_json()
            
            # Flow'u execute et (streaming ile)
            async for chunk in execute_flow_streaming(flow_id, data["message"]):
                await websocket.send_json({
                    "type": "token",
                    "data": chunk
                })
            
            # Final response
            await websocket.send_json({
                "type": "end",
                "data": "completed"
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "data": str(e)
        })

@app.post("/api/v1/prediction/{flow_id}/stream")
async def prediction_stream(flow_id: str, message: str):
    async def generate():
        async for chunk in execute_flow_streaming(flow_id, message):
            yield f"data: {json.dumps({'token': chunk})}\n\n"
        yield f"data: {json.dumps({'type': 'end'})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5.6 LangChain Entegrasyonu

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

class ReactAgentNode(BaseNode):
    def __init__(self):
        super().__init__()
        self.label = "ReAct Agent"
        self.name = "reactAgent"
        self.type = "agent"
        self.category = "agents"
        self.inputs = [
            NodeInput(name="llm", type="ChatModel"),
            NodeInput(name="tools", type="Tool[]"),
            NodeInput(name="memory", type="Memory", required=False),
            NodeInput(name="prompt", type="str")
        ]
        self.outputs = [
            NodeOutput(name="output", type="str")
        ]
    
    async def execute(self, inputs: Dict[str, Any], flow_state: Dict[str, Any]) -> str:
        llm = inputs["llm"]
        tools = inputs["tools"]
        memory = inputs.get("memory")
        prompt = inputs["prompt"]
        
        # Agent oluştur
        agent = create_react_agent(
            llm=llm,
            tools=tools,
            prompt=prompt
        )
        
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            memory=memory,
            verbose=True
        )
        
        # Execute
        result = await agent_executor.ainvoke({
            "input": flow_state["input"]
        })
        
        return result["output"]
```

### 5.7 Frontend Entegrasyonu (React Flow)

```python
# API endpoint for frontend
@app.get("/api/v1/nodes")
async def get_available_nodes():
    """Frontend için kullanılabilir node'ları döndür"""
    registry = get_node_registry()
    nodes_data = []
    
    for category, node_names in registry.categories.items():
        for node_name in node_names:
            node_class = registry.get_node_class(node_name)
            node = node_class()
            
            nodes_data.append({
                "name": node.name,
                "label": node.label,
                "type": node.type,
                "category": category,
                "inputs": [inp.dict() for inp in node.inputs],
                "outputs": [out.dict() for out in node.outputs]
            })
    
    return {"nodes": nodes_data}

@app.post("/api/v1/chatflows")
async def save_chatflow(flow_data: Dict):
    """Flow'u kaydet"""
    # Validate flow
    validate_flow_structure(flow_data)
    
    # Save to database
    flow_id = save_flow_to_db(flow_data)
    
    return {"id": flow_id}
```

## 6. Önemli Implementasyon Detayları

### 6.1 Type Safety
- Python'da Pydantic kullanarak strict type validation
- Node input/output type compatibility kontrolü
- Runtime type checking

### 6.2 Error Handling
- Her node execution'ı try-catch ile wrap'le
- Detailed error messages ile debugging kolaylığı
- Graceful degradation

### 6.3 Performance Optimizasyonları
- Async/await ile concurrent execution
- Connection pooling
- Response caching
- Lazy loading of node modules

### 6.4 Security
- API key authentication
- Rate limiting
- Input sanitization
- Credential encryption

### 6.5 Monitoring & Logging
- Prometheus metrics
- Structured logging
- Execution tracing
- Performance profiling

## 7. Deployment Considerations

### 7.1 Containerization
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.2 Scaling
- Horizontal scaling with load balancer
- Redis for shared state
- Queue system for long-running tasks
- WebSocket sticky sessions

## Sonuç

Flowise'ın güçlü yanları:
- Modüler ve genişletilebilir mimari
- LangChain'in tüm gücünü görsel interface ile kullanma
- Gerçek zamanlı streaming desteği
- Zengin node ekosistemi

Python FastAPI ile benzer bir sistem yapmak için:
1. Solid bir node abstraction layer oluştur
2. Graph execution engine'i düzgün implemente et
3. Type safety ve error handling'e önem ver
4. WebSocket/SSE ile streaming desteği ekle
5. Frontend için React Flow veya benzeri bir library kullan

Bu architecture'ı takip ederek, Flowise'a benzer ama Python ekosisteminin avantajlarını kullanan bir visual LLM orchestration tool geliştirebilirsiniz.

# Flowise Backend Mimarisi - Detaylı Teknik Analiz

## 1. Node Sistemi Nasıl Çalışıyor?

### 1.1 INode Interface (Temel Node Yapısı)

```typescript
interface INode {
    label: string              // UI'da görünen isim
    name: string              // Unique identifier
    version: number           // Node versiyonu
    type: string             // Node tipi (llm, tool, chain vb.)
    icon: string             // Icon path
    category: string         // Kategori (agents, chains, tools vb.)
    description?: string     // Açıklama
    baseClasses: string[]    // Bu node'un implement ettiği sınıflar
    credential?: INodeParams  // Credential gerekliyse
    inputs?: INodeParams[]   // Node'un aldığı inputlar
    outputs?: INodeOutputsValue[] // Node'un output'ları
    
    // Node'u initialize eden method
    init?(nodeData: INodeData, input: string, options: ICommonObject): Promise<any>
}
```

### 1.2 Node Class Implementasyonu

Her node aslında bir **TypeScript class**'ı. Örnek bir node implementasyonu:

```typescript
class ChatOpenAI_ChatModels implements INode {
    label = 'ChatOpenAI'
    name = 'chatOpenAI'
    version = 1.0
    type = 'ChatOpenAI'
    icon = 'openai.svg'
    category = 'Chat Models'
    baseClasses = [this.type, 'BaseChatModel', 'BaseLanguageModel']
    
    inputs = [
        {
            label: 'OpenAI Api Key',
            name: 'openAIApiKey',
            type: 'password'
        },
        {
            label: 'Model Name',
            name: 'modelName',
            type: 'options',
            options: [
                { label: 'gpt-4', name: 'gpt-4' },
                { label: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' }
            ],
            default: 'gpt-3.5-turbo'
        },
        {
            label: 'Temperature',
            name: 'temperature',
            type: 'number',
            default: 0.7,
            optional: true
        }
    ]
    
    outputs = [
        {
            label: 'ChatOpenAI',
            name: 'chatOpenAI',
            baseClasses: ['ChatOpenAI', 'BaseChatModel']
        }
    ]
    
    async init(nodeData: INodeData): Promise<any> {
        const temperature = nodeData.inputs?.temperature
        const modelName = nodeData.inputs?.modelName
        const apiKey = nodeData.inputs?.openAIApiKey
        
        // LangChain ChatOpenAI instance'ı oluştur
        const model = new ChatOpenAI({
            temperature: parseFloat(temperature),
            modelName,
            openAIApiKey: apiKey
        })
        
        return model  // Bu obje diğer node'lara input olarak geçecek
    }
}
```

## 2. Node'lar Nasıl İletişim Kuruyor?

### 2.1 Data Flow Mekanizması

```typescript
// Chatflow JSON yapısı
{
    "nodes": [
        {
            "id": "chatOpenAI_0",
            "type": "chatOpenAI",
            "data": {
                "inputs": {
                    "modelName": "gpt-3.5-turbo",
                    "temperature": 0.7
                }
            }
        },
        {
            "id": "promptTemplate_0", 
            "type": "promptTemplate",
            "data": {
                "inputs": {
                    "template": "You are a helpful assistant. {input}"
                }
            }
        },
        {
            "id": "llmChain_0",
            "type": "llmChain",
            "data": {
                "inputs": {}
            }
        }
    ],
    "edges": [
        {
            "source": "chatOpenAI_0",
            "sourceHandle": "chatOpenAI",
            "target": "llmChain_0",
            "targetHandle": "model"
        },
        {
            "source": "promptTemplate_0",
            "sourceHandle": "promptTemplate",
            "target": "llmChain_0", 
            "targetHandle": "prompt"
        }
    ]
}
```

### 2.2 Execution Flow

```typescript
class ChatFlowExecutor {
    private nodeInstances: Map<string, any> = new Map()
    
    async executeFlow(flowData: any, input: string) {
        // 1. Topological sort ile execution order bul
        const executionOrder = this.topologicalSort(flowData.nodes, flowData.edges)
        
        // 2. Her node'u sırayla execute et
        for (const nodeId of executionOrder) {
            const node = flowData.nodes.find(n => n.id === nodeId)
            const NodeClass = this.getNodeClass(node.type)
            
            // 3. Node instance oluştur
            const nodeInstance = new NodeClass()
            
            // 4. Input'ları hazırla (bağlı node'lardan)
            const nodeInputs = this.prepareNodeInputs(nodeId, flowData.edges)
            
            // 5. Node'u initialize et
            const nodeData: INodeData = {
                inputs: { ...node.data.inputs, ...nodeInputs },
                outputs: { output: node.data.outputs?.output }
            }
            
            // 6. Node'u çalıştır ve sonucu sakla
            const result = await nodeInstance.init(nodeData, input)
            this.nodeInstances.set(nodeId, result)
        }
        
        // 7. Son node'un output'unu dön
        return this.nodeInstances.get(executionOrder[executionOrder.length - 1])
    }
    
    private prepareNodeInputs(nodeId: string, edges: any[]): any {
        const inputs = {}
        
        // Bu node'a gelen edge'leri bul
        const incomingEdges = edges.filter(e => e.target === nodeId)
        
        for (const edge of incomingEdges) {
            // Source node'un output'unu al
            const sourceOutput = this.nodeInstances.get(edge.source)
            
            // Target handle'a göre input'a ata
            inputs[edge.targetHandle] = sourceOutput
        }
        
        return inputs
    }
}
```

## 3. Node Türleri ve Kategorileri

### 3.1 Ana Node Kategorileri

```typescript
const NODE_CATEGORIES = {
    AGENTS: 'agents',           // Akıllı ajanlar
    CHAINS: 'chains',          // LangChain chains
    CHAT_MODELS: 'chatmodels', // Chat modelleri (GPT, Claude vb.)
    LLMS: 'llms',              // Text completion modelleri
    EMBEDDINGS: 'embeddings',   // Embedding modelleri
    MEMORY: 'memory',          // Hafıza sistemleri
    TOOLS: 'tools',            // Araçlar (search, calculator vb.)
    VECTOR_STORES: 'vectorstores', // Vektör veritabanları
    DOCUMENT_LOADERS: 'documentloaders', // Döküman yükleyiciler
    TEXT_SPLITTERS: 'textsplitters',     // Metin bölücüler
    OUTPUT_PARSERS: 'outputparsers',     // Output parser'lar
    RETRIEVERS: 'retrievers',            // Bilgi getirme sistemleri
    UTILITIES: 'utilities'               // Yardımcı araçlar
}
```

### 3.2 Örnek Node Türleri

```typescript
// 1. Agent Node
class ReactAgentNode implements INode {
    category = 'agents'
    baseClasses = ['Agent', 'BaseAgent']
    
    inputs = [
        { name: 'llm', type: 'BaseLanguageModel' },
        { name: 'tools', type: 'Tool', list: true },
        { name: 'memory', type: 'BaseMemory', optional: true }
    ]
    
    async init(nodeData: INodeData) {
        const llm = nodeData.inputs?.llm
        const tools = nodeData.inputs?.tools || []
        const memory = nodeData.inputs?.memory
        
        // ReAct agent oluştur
        const agent = await createReactAgent({
            llm,
            tools,
            memory
        })
        
        return agent
    }
}

// 2. Tool Node
class CalculatorTool implements INode {
    category = 'tools'
    baseClasses = ['Tool', 'CalculatorTool']
    
    async init() {
        return new Calculator() // LangChain Calculator tool
    }
}

// 3. Memory Node  
class BufferMemory implements INode {
    category = 'memory'
    baseClasses = ['BaseMemory', 'BufferMemory']
    
    inputs = [
        { name: 'sessionId', type: 'string', optional: true },
        { name: 'memoryKey', type: 'string', default: 'chat_history' }
    ]
    
    async init(nodeData: INodeData) {
        return new BufferMemory({
            returnMessages: true,
            memoryKey: nodeData.inputs?.memoryKey,
            sessionId: nodeData.inputs?.sessionId
        })
    }
}
```

## 4. Node Registry ve Discovery

### 4.1 Node Pool Sistemi

```typescript
class NodesPool {
    private componentNodes: IComponentNodes = {}
    
    async initialize() {
        // packages/components/nodes klasöründeki tüm node'ları yükle
        const nodesDir = path.join(__dirname, '..', 'nodes')
        const nodeCategories = await fs.readdir(nodesDir)
        
        for (const category of nodeCategories) {
            const categoryPath = path.join(nodesDir, category)
            const nodeFiles = await fs.readdir(categoryPath)
            
            for (const file of nodeFiles) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    // Node'u dinamik olarak import et
                    const modulePath = path.join(categoryPath, file)
                    const nodeModule = await import(modulePath)
                    
                    // Default export'u al
                    const NodeClass = nodeModule.default || nodeModule[Object.keys(nodeModule)[0]]
                    
                    // Node instance oluştur
                    const nodeInstance = new NodeClass()
                    
                    // Node'u kaydet
                    this.componentNodes[nodeInstance.name] = {
                        instance: nodeInstance,
                        path: modulePath
                    }
                }
            }
        }
    }
    
    getNodeInstance(nodeName: string): INode {
        return this.componentNodes[nodeName]?.instance
    }
}
```

## 5. Workflow Engine Detayları

### 5.1 BuildFlow Process

```typescript
class WorkflowEngine {
    private reactFlowNodes: any[] = []
    private reactFlowEdges: any[] = []
    private graph = new DirectedGraph()
    
    async buildFlow(chatflowId: string) {
        // 1. Chatflow'u veritabanından al
        const chatflow = await getChatflow(chatflowId)
        const flowData = JSON.parse(chatflow.flowData)
        
        this.reactFlowNodes = flowData.nodes
        this.reactFlowEdges = flowData.edges
        
        // 2. Directed graph oluştur
        for (const node of this.reactFlowNodes) {
            this.graph.addNode(node.id)
        }
        
        for (const edge of this.reactFlowEdges) {
            this.graph.addEdge(edge.source, edge.target)
        }
        
        // 3. End node'ları bul (output edge'i olmayan)
        const endNodeIds = this.graph.nodes().filter(nodeId => 
            this.graph.outDegree(nodeId) === 0
        )
        
        // 4. Her end node için geriye doğru traverse et
        for (const endNodeId of endNodeIds) {
            await this.constructGraphFromEndNode(endNodeId)
        }
        
        return this.finalResult
    }
    
    private async constructGraphFromEndNode(nodeId: string) {
        const flowNode = this.reactFlowNodes.find(n => n.id === nodeId)
        const nodeType = flowNode.data.type
        const nodeData = flowNode.data
        
        // Node instance'ı al
        const nodeInstance = this.nodesPool.getNodeInstance(nodeType)
        
        // Input'ları hazırla
        const inputNodes = this.getInputNodes(nodeId)
        const nodeInputs = {}
        
        for (const inputNode of inputNodes) {
            // Recursive olarak input node'ları da build et
            const inputResult = await this.constructGraphFromEndNode(inputNode.id)
            nodeInputs[inputNode.handleId] = inputResult
        }
        
        // Node'u execute et
        const result = await nodeInstance.init({
            inputs: { ...nodeData.inputs, ...nodeInputs },
            outputs: nodeData.outputs
        })
        
        return result
    }
}
```

## 6. LangChain Entegrasyonu

### 6.1 LangChain Component Wrapper

```typescript
// Her Flowise node aslında bir LangChain component'ini wrap ediyor
class LLMChainNode implements INode {
    async init(nodeData: INodeData) {
        const llm = nodeData.inputs?.model  // BaseLLM instance
        const prompt = nodeData.inputs?.prompt  // PromptTemplate instance
        const memory = nodeData.inputs?.memory  // Optional BaseMemory
        
        // LangChain LLMChain oluştur
        const chain = new LLMChain({
            llm,
            prompt,
            memory,
            verbose: true
        })
        
        // Chain'i dön - bu başka bir node'un input'u olabilir
        return chain
    }
}
```

### 6.2 Type Safety ve BaseClasses

```typescript
// baseClasses sistemi ile type compatibility kontrolü
function isValidConnection(sourceNode: INode, targetNode: INode, targetInput: INodeParams): boolean {
    const sourceBaseClasses = sourceNode.outputs[0].baseClasses
    const requiredClass = targetInput.type
    
    // Source node'un output'u, target node'un beklediği tipte mi?
    return sourceBaseClasses.includes(requiredClass)
}

// Örnek:
// ChatOpenAI output: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel']
// LLMChain input: type: 'BaseLanguageModel'
// ✅ Valid connection - ChatOpenAI is a BaseLanguageModel
```

## 7. State Management ve Session Handling

### 7.1 Flow State

```typescript
interface IFlowState {
    sessionId: string
    chatId: string
    input: string
    state: Record<string, any>  // Custom state variables
}

// AgentFlow V2'de state management
class StateNode implements INode {
    async init(nodeData: INodeData, _, options: ICommonObject) {
        const flowState = options.flowState as IFlowState
        
        // State'e yazma
        if (nodeData.inputs?.setValue) {
            flowState.state[nodeData.inputs.key] = nodeData.inputs.value
        }
        
        // State'den okuma
        if (nodeData.inputs?.getValue) {
            return flowState.state[nodeData.inputs.key]
        }
    }
}
```

### 7.2 Memory ve Session Management

```typescript
class ChatSessionManager {
    private sessions = new Map<string, ChatSession>()
    
    getSession(sessionId: string): ChatSession {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                memory: new BufferMemory(),
                state: {},
                history: []
            })
        }
        return this.sessions.get(sessionId)!
    }
    
    async processMessage(sessionId: string, message: string, chatflowId: string) {
        const session = this.getSession(sessionId)
        
        // Flow'u session context'i ile execute et
        const result = await this.workflowEngine.execute(chatflowId, {
            input: message,
            sessionId,
            memory: session.memory,
            state: session.state
        })
        
        // History'e ekle
        session.history.push({
            human: message,
            ai: result
        })
        
        return result
    }
}
```

## 8. Python FastAPI Karşılıkları

### 8.1 Base Node Implementasyonu (Python)

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class NodeParam(BaseModel):
    label: str
    name: str
    type: str
    required: bool = True
    default: Optional[Any] = None
    options: Optional[List[Dict]] = None
    list: bool = False  # Array input mı?

class NodeOutput(BaseModel):
    label: str
    name: str
    baseClasses: List[str]

class INode(ABC):
    """Flowise INode interface'inin Python karşılığı"""
    
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
    async def init(self, node_data: Dict[str, Any], input_text: str = "", options: Dict = {}) -> Any:
        """Node'u initialize et ve çalıştır"""
        pass

# Örnek Node Implementasyonu
class ChatOpenAINode(INode):
    def __init__(self):
        super().__init__()
        self.label = "ChatOpenAI"
        self.name = "chatOpenAI"
        self.type = "ChatOpenAI"
        self.category = "chatmodels"
        self.baseClasses = ["ChatOpenAI", "BaseChatModel", "BaseLanguageModel"]
        
        self.inputs = [
            NodeParam(
                label="OpenAI Api Key",
                name="openAIApiKey",
                type="password"
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
                required=False
            )
        ]
        
        self.outputs = [
            NodeOutput(
                label="ChatOpenAI",
                name="chatOpenAI",
                baseClasses=self.baseClasses
            )
        ]
    
    async def init(self, node_data: Dict[str, Any], input_text: str = "", options: Dict = {}) -> Any:
        from langchain_openai import ChatOpenAI
        
        inputs = node_data.get("inputs", {})
        
        model = ChatOpenAI(
            model=inputs.get("modelName", "gpt-3.5-turbo"),
            temperature=float(inputs.get("temperature", 0.7)),
            api_key=inputs.get("openAIApiKey")
        )
        
        return model
```

### 8.2 Node Registry (Python)

```python
import importlib
import os
from pathlib import Path
from typing import Dict, Type

class NodeRegistry:
    def __init__(self):
        self.nodes: Dict[str, Type[INode]] = {}
        self.categories: Dict[str, List[str]] = {}
    
    async def discover_nodes(self, nodes_dir: str = "nodes"):
        """Node'ları otomatik keşfet"""
        nodes_path = Path(nodes_dir)
        
        for category_dir in nodes_path.iterdir():
            if category_dir.is_dir():
                category_name = category_dir.name
                self.categories[category_name] = []
                
                for node_file in category_dir.glob("*.py"):
                    if node_file.name.startswith("_"):
                        continue
                    
                    # Module'ü import et
                    module_path = f"{nodes_dir}.{category_name}.{node_file.stem}"
                    module = importlib.import_module(module_path)
                    
                    # INode'dan türeyen class'ları bul
                    for attr_name in dir(module):
                        attr = getattr(module, attr_name)
                        if (isinstance(attr, type) and 
                            issubclass(attr, INode) and 
                            attr != INode):
                            
                            # Node instance oluştur
                            node_instance = attr()
                            self.nodes[node_instance.name] = attr
                            self.categories[category_name].append(node_instance.name)
    
    def create_node(self, node_name: str) -> INode:
        """Node instance oluştur"""
        node_class = self.nodes.get(node_name)
        if not node_class:
            raise ValueError(f"Unknown node: {node_name}")
        return node_class()
```

## Özet

Flowise'ın backend mimarisi şu temel prensiplere dayanıyor:

1. **Her node bir class** - INode interface'ini implement eder
2. **Node'lar LangChain component'lerini wrap eder** - Görsel interface sağlar
3. **Graph-based execution** - Topological sort ile sıralı çalıştırma
4. **Type safety** - baseClasses ile tip uyumluluğu kontrolü
5. **Dynamic discovery** - Node'lar runtime'da keşfedilir
6. **State management** - Session ve memory yönetimi

Python'da benzer bir sistem yapmak için:
- Abstract base class ile node interface
- Type hints ve Pydantic ile type safety
- AsyncIO ile performanslı execution
- LangChain Python SDK entegrasyonu
- FastAPI ile RESTful API + WebSocket support