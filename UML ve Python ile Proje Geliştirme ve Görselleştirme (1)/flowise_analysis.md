# Flowise Backend Mimarisi - Sistem Analizi ve Diyagram Planı

## Sistem Bileşenleri Analizi

### 1. Temel Bileşenler
- **INode Interface**: Tüm node'ların implement ettiği temel arayüz
- **Node Classes**: Her node türü için ayrı TypeScript sınıfları
- **NodesPool**: Node'ları kayıt eden ve yöneten sistem
- **WorkflowEngine**: Flow'ları execute eden motor
- **ChatFlowExecutor**: Node'ları sıralı şekilde çalıştıran executor
- **State Management**: Session ve memory yönetimi

### 2. Veri Akışı
- ReactFlow JSON → Node Graph → Topological Sort → Sequential Execution
- Node'lar arası input/output bağlantıları
- LangChain component wrapping
- Memory ve state persistence

### 3. Oluşturulacak Diyagramlar

#### A. UML Diyagramları
1. **Class Diagram**: INode interface ve implementasyonları
2. **Component Diagram**: Sistem bileşenleri ve aralarındaki ilişkiler
3. **Package Diagram**: Modül organizasyonu

#### B. Sequential Diyagramlar
1. **Node Execution Flow**: Bir flow'un nasıl execute edildiği
2. **Node Communication**: Node'lar arası veri transferi
3. **Session Management**: Chat session yaşam döngüsü

#### C. Sistem Diyagramları
1. **Architecture Overview**: Genel sistem mimarisi
2. **Data Flow Diagram**: Veri akışı ve transformasyonları
3. **Deployment Diagram**: Python backend + ReactFlow frontend

### 4. Python Implementasyon Planı
- FastAPI backend
- Pydantic models
- Async node execution
- LangChain integration
- WebSocket support

### 5. ReactFlow Frontend Planı
- Node palette
- Canvas area
- Property panels
- Real-time execution
- WebSocket integration

