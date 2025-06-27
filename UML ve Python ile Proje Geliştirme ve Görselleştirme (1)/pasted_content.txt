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