# Flowise Backend Mimarisi - Kapsamlı Implementasyon Rehberi

## 📋 Proje Özeti

Bu proje, Flowise'ın backend mimarisini analiz ederek Python ve ReactFlow ile nasıl benzer bir sistem oluşturulabileceğini göstermektedir. Proje şunları içerir:

- **UML ve Sistem Diyagramları**: Flowise'ın çalışma mantığını gösteren detaylı diyagramlar
- **Python Backend**: FastAPI tabanlı, Flowise benzeri node execution engine
- **ReactFlow Frontend**: Drag-and-drop node editor ile visual flow builder
- **Entegrasyon Örneği**: Çalışan bir demo uygulaması

## 🎯 Sistem Mimarisi

### Temel Bileşenler

1. **Node Sistemi**
   - INode interface: Tüm node'ların temel arayüzü
   - Node Registry: Node türlerini kayıt eden sistem
   - Type Checker: Node bağlantılarının uyumluluğunu kontrol eden sistem

2. **Workflow Engine**
   - Flow Parser: ReactFlow JSON'ını parse eden sistem
   - Topological Sorter: Node'ları execution sırasına göre sıralayan algoritma
   - Flow Executor: Node'ları sıralı şekilde çalıştıran motor

3. **Frontend Interface**
   - ReactFlow Canvas: Visual flow editor
   - Node Palette: Drag-and-drop node library
   - Property Panel: Node konfigürasyon paneli
   - Chat Panel: Real-time test interface

## 📊 Diyagramlar

### 1. UML Class Diagram
Sistem sınıfları ve aralarındaki ilişkileri gösterir:
- INode interface ve implementasyonları
- NodeRegistry ve WorkflowEngine sınıfları
- ChatSession ve State Management

### 2. Component Diagram
Sistem bileşenleri ve modül organizasyonu:
- Frontend Layer (ReactFlow, Node Palette, Property Panel)
- API Layer (REST API, WebSocket, Authentication)
- Core Engine (Workflow Engine, Node Pool, State Manager)
- External Services (OpenAI API, Database, Cache)

### 3. Architecture Diagram
Genel sistem mimarisi ve deployment yapısı:
- Load Balancer ve API Gateway
- Application Server ve Core Services
- Data Layer (PostgreSQL, Redis, Vector DB)
- Monitoring ve Logging

### 4. Sequence Diagrams
İşlem akışları ve node iletişimi:
- Node Execution Flow: Bir flow'un nasıl execute edildiği
- Node Communication: Node'lar arası veri transferi
- Session Management: Chat session yaşam döngüsü

### 5. Data Flow Diagram
Veri akışı ve transformasyonları:
- Input Layer'dan Processing Layer'a veri akışı
- Node execution sırasında veri transformasyonları
- Output Layer'a sonuç aktarımı

## 🐍 Python Backend Implementasyonu

### Temel Özellikler

```python
# Node Interface
class INode(ABC):
    @abstractmethod
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Any:
        pass

# Örnek Node Implementasyonu
class ChatOpenAINode(INode):
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Dict[str, Any]:
        # ChatOpenAI instance oluşturma ve konfigürasyon
        pass

# Workflow Engine
class FlowExecutor:
    async def execute_flow(self, flow: ChatFlow, input_text: str, session_id: str = None) -> Dict[str, Any]:
        # Topological sort ile execution order
        # Node'ları sıralı şekilde execute etme
        pass
```

### API Endpoints

- `GET /api/v1/nodes` - Mevcut node türlerini listele
- `POST /api/v1/chatflows` - Yeni flow oluştur
- `GET /api/v1/chatflows/{id}` - Flow detaylarını getir
- `POST /api/v1/prediction/{id}` - Flow'u execute et
- `POST /api/v1/sessions` - Yeni session oluştur

### Desteklenen Node Türleri

1. **ChatOpenAI Node**
   - OpenAI GPT modelleri için wrapper
   - Model seçimi, temperature ayarı
   - API key yönetimi

2. **Prompt Template Node**
   - Template formatlaması
   - Variable substitution
   - Dynamic prompt generation

3. **LLM Chain Node**
   - Model ve prompt'u birleştirme
   - Chain execution
   - Response generation

## ⚛️ ReactFlow Frontend Implementasyonu

### Temel Bileşenler

```jsx
// Ana Uygulama
function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onConnect={onConnect}
    />
  )
}

// Custom Node Bileşeni
const ChatOpenAINode = ({ data, isConnectable }) => {
  return (
    <Card className="node-card">
      <CardHeader>
        <CardTitle>ChatOpenAI</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Node içeriği */}
      </CardContent>
      <Handle type="source" position={Position.Right} />
    </Card>
  )
}
```

### Özellikler

1. **Visual Flow Editor**
   - Drag-and-drop node ekleme
   - Node'ları bağlama (edge creation)
   - Real-time flow validation

2. **Node Palette**
   - Kategorize edilmiş node library
   - Drag-and-drop functionality
   - Node açıklamaları ve örnekleri

3. **Property Panel**
   - Dynamic form generation
   - Node-specific configuration
   - Real-time validation

4. **Chat Panel**
   - Flow testing interface
   - Real-time execution
   - Execution order tracking

## 🔄 Entegrasyon ve Çalışma Mantığı

### 1. Flow Oluşturma
```javascript
// Frontend'de flow oluşturma
const flowData = {
  nodes: [
    { id: 'prompt_1', type: 'promptTemplate', data: {...} },
    { id: 'llm_1', type: 'chatOpenAI', data: {...} },
    { id: 'chain_1', type: 'llmChain', data: {...} }
  ],
  edges: [
    { source: 'prompt_1', target: 'chain_1', sourceHandle: 'promptTemplate', targetHandle: 'prompt' },
    { source: 'llm_1', target: 'chain_1', sourceHandle: 'chatOpenAI', targetHandle: 'model' }
  ]
}

// Backend'e gönderme
await fetch('/api/v1/chatflows', {
  method: 'POST',
  body: JSON.stringify(flowData)
})
```

### 2. Flow Execution
```python
# Backend'de flow execution
async def execute_flow(flow_id: str, input_text: str):
    # 1. Flow'u yükle
    flow = get_flow(flow_id)
    
    # 2. Topological sort ile execution order
    execution_order = TopologicalSorter.sort(flow.nodes, flow.edges)
    
    # 3. Node'ları sıralı şekilde execute et
    for node_id in execution_order:
        result = await execute_node(node_id, flow, input_text)
        store_result(node_id, result)
    
    # 4. Final result'ı dön
    return get_final_result()
```

### 3. Real-time Communication
```javascript
// Frontend'de real-time execution tracking
const executeFlow = async () => {
  const response = await fetch('/api/v1/prediction/flow_id', {
    method: 'POST',
    body: JSON.stringify({ question: userInput })
  })
  
  const result = await response.json()
  
  // Execution order'ı göster
  displayExecutionOrder(result.executionOrder)
  
  // Response'u chat panel'de göster
  addMessageToChat(result.text)
}
```

## 🚀 Kurulum ve Çalıştırma

### Backend Kurulumu
```bash
# Python backend
cd flowise_backend
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

### Frontend Kurulumu
```bash
# React frontend
cd flowise_frontend
pnpm install
pnpm run dev --host
```

### Erişim
- Backend API: http://localhost:5001
- Frontend UI: http://localhost:5173

## 📈 Performans ve Ölçeklenebilirlik

### Backend Optimizasyonları
1. **Async Processing**: Tüm node execution'lar async
2. **Caching**: Node results ve session data caching
3. **Connection Pooling**: Database connection optimization
4. **Load Balancing**: Multiple instance support

### Frontend Optimizasyonları
1. **React.memo**: Node component memoization
2. **Virtual Scrolling**: Large flow handling
3. **Debounced Updates**: Real-time property updates
4. **Code Splitting**: Lazy loading for node types

## 🔧 Genişletme Noktaları

### Yeni Node Türleri Ekleme
```python
# Backend'de yeni node
class CustomNode(INode):
    def __init__(self):
        self.label = "Custom Node"
        self.type = "customNode"
        # ... diğer konfigürasyonlar
    
    async def init(self, node_data: NodeData, input_text: str = "", options: Dict = {}) -> Any:
        # Custom logic implementation
        pass

# Registry'e ekleme
node_registry.register_node("customNode", CustomNode)
```

```jsx
// Frontend'de yeni node component
const CustomNode = ({ data, isConnectable }) => {
  return (
    <Card className="custom-node">
      {/* Custom node UI */}
    </Card>
  )
}

// Node types'a ekleme
const nodeTypes = {
  ...existingTypes,
  customNode: CustomNode
}
```

### Database Integration
```python
# PostgreSQL ile persistent storage
class FlowRepository:
    async def save_flow(self, flow: ChatFlow) -> str:
        # Database'e flow kaydetme
        pass
    
    async def load_flow(self, flow_id: str) -> ChatFlow:
        # Database'den flow yükleme
        pass
```

### Authentication & Authorization
```python
# JWT tabanlı authentication
@api_bp.route('/chatflows', methods=['POST'])
@jwt_required()
def create_chatflow():
    user_id = get_jwt_identity()
    # User-specific flow creation
    pass
```

## 📝 Sonuç

Bu implementasyon, Flowise'ın temel mimarisini Python ve ReactFlow kullanarak başarıyla yeniden oluşturmaktadır. Sistem şu özellikleri sağlar:

✅ **Visual Flow Builder**: Drag-and-drop interface ile flow oluşturma
✅ **Node System**: Modüler ve genişletilebilir node mimarisi  
✅ **Type Safety**: Node bağlantılarında tip kontrolü
✅ **Real-time Execution**: Anında flow testing ve debugging
✅ **Session Management**: Chat session'ları ve state persistence
✅ **Scalable Architecture**: Mikroservis mimarisi için hazır

Bu sistem, production ortamında kullanılmak üzere daha da geliştirilebilir ve özelleştirilebilir.

