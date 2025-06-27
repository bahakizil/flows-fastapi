import React, { useState, useCallback, useRef } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Bot, 
  Info, 
  X, 
  Play, 
  Settings, 
  Save, 
  Trash2,
  Plus,
  MessageSquare,
  Brain,
  Wrench,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Navbar from "./Navbar";

// Agent Konfigürasyon Modal Component
function AgentConfigModal({ isOpen, onClose, nodeData, onSave }) {
  const [config, setConfig] = useState({
    name: nodeData?.name || "Tool Agent",
    tools: nodeData?.tools || [],
    memory: nodeData?.memory || { type: "buffer", size: 100 },
    model: nodeData?.model || { provider: "openai", model: "gpt-4" },
    prompt: nodeData?.prompt || "Sen yardımcı bir AI asistanısın.",
    moderation: nodeData?.moderation || { enabled: false },
    ...nodeData
  });

  const [availableTools] = useState([
    { id: "calculator", name: "Calculator", description: "Matematik hesaplamaları" },
    { id: "websearch", name: "Web Search", description: "İnternet araması" },
    { id: "textanalyzer", name: "Text Analyzer", description: "Metin analizi" },
    { id: "fileprocessor", name: "File Processor", description: "Dosya işleme" },
    { id: "database", name: "Database", description: "Veritabanı sorguları" },
    { id: "email", name: "Email", description: "Email gönderme" }
  ]);

  const handleToolToggle = (toolId) => {
    setConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 w-[60vw]">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-[60vw] max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Agent Konfigürasyonu
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Agent Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Adı
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Agent adını girin"
            />
          </div>

          {/* Araçlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Wrench className="w-4 h-4 inline mr-2" />
              Araçlar
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleToolToggle(tool.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    config.tools.includes(tool.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{tool.name}</h4>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                    </div>
                    {config.tools.includes(tool.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hafıza Ayarları */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Brain className="w-4 h-4 inline mr-2" />
              Hafıza Ayarları
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hafıza Tipi</label>
                <select
                  value={config.memory.type}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    memory: { ...prev.memory, type: e.target.value }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="buffer">Buffer Memory</option>
                  <option value="summary">Summary Memory</option>
                  <option value="vector">Vector Memory</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hafıza Boyutu</label>
                <input
                  type="number"
                  value={config.memory.size}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    memory: { ...prev.memory, size: parseInt(e.target.value) }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Model Ayarları */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Model Ayarları
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sağlayıcı</label>
                <select
                  value={config.model.provider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    model: { ...prev.model, provider: e.target.value }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="local">Local Model</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Model</label>
                <select
                  value={config.model.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    model: { ...prev.model, model: e.target.value }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {config.model.provider === 'openai' && (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {config.model.provider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    </>
                  )}
                  {config.model.provider === 'google' && (
                    <>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-ultra">Gemini Ultra</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Prompt Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Template
            </label>
            <textarea
              value={config.prompt}
              onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Agent'ın davranış şablonunu girin..."
            />
          </div>

          {/* Moderasyon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Shield className="w-4 h-4 inline mr-2" />
              Moderasyon
            </label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.moderation.enabled}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  moderation: { ...prev.moderation, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                Girdi moderasyonunu etkinleştir
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom Edge Component
function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer className="text-green-500">
        <button
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag bg-red-500 nopan rounded-full w-6 h-6 border-2 border-white p-1 hover:bg-red-600 text-white text-xs flex justify-center items-center shadow-lg"
          onClick={() => {
            setEdges((es) => es.filter((e) => e.id !== id));
          }}
        >
          <X className="w-3 h-3" />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

// Tool Agent Node Component
function ToolAgentNode({ data, id }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const handleDoubleClick = () => {
    setIsModalOpen(true);
  };

  const handleConfigSave = (newConfig) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...newConfig } }
          : node
      )
    );
  };

  const getStatusColor = () => {
    if (data?.tools?.length > 0 && data?.model?.provider) {
      return "border-green-400 bg-green-100 hover:bg-green-200";
    }
    return "border-orange-400 bg-orange-100 hover:bg-orange-200";
  };

  const getStatusIcon = () => {
    if (data?.tools?.length > 0 && data?.model?.provider) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-600" />;
  };

  return (
    <>
      <div 
        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 text-gray-700 font-medium cursor-pointer transition-all ${getStatusColor()}`}
        onDoubleClick={handleDoubleClick}
        title="Çift tıklayarak konfigüre edin"
      >
        <div className="bg-blue-500 p-3 rounded-lg">
          <Bot className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{data?.name || "Tool Agent"}</p>
            {getStatusIcon()}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {data?.tools?.length > 0 ? (
              `${data.tools.length} araç aktif`
            ) : (
              "Konfigürasyon gerekli"
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <Settings className="w-4 h-4" />
        </div>

        <Handle 
          type="target" 
          position={Position.Left} 
          id="input"
          className="w-16 !bg-teal-500"
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="output"
          className="w-3 h-3 bg-blue-500"
        />
      </div>

      <AgentConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeData={data}
        onSave={handleConfigSave}
      />
    </>
  );
}

// Start Node Component
function StartNode({ data }) {
  return (
    <div className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-green-400 bg-green-100 text-gray-700 font-medium hover:bg-green-200">
      <div className="bg-green-400 p-3 rounded-lg">
        <Play className="w-6 h-6 text-white" />
      </div>
      <p>Start</p>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}

// Node tipleri tanımları
const NODE_TYPE_LIST = [
  {
    id: "1",
    type: "toolAgent",
    label: "Tool Agent",
    data: {
      name: "Tool Agent",
      tools: [],
      memory: { type: "buffer", size: 100 },
      model: { provider: "openai", model: "gpt-4" },
      prompt: "Sen yardımcı bir AI asistanısın.",
      moderation: { enabled: false }
    },
  },
  {
    id: "2",
    type: "start",
    label: "Start",
    data: {}
  },
];

const nodeTypes = {
  toolAgent: ToolAgentNode,
  start: StartNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Draggable Node Component
function DraggableNode({ nodeType }) {
  const onDragStart = (event) => {
    event.stopPropagation();
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(nodeType)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="text-black p-3 cursor-grab border-b-2 border-gray-200 hover:bg-gray-50 transition-all hover:scale-105 select-none rounded-lg"
    >
      <div className="text-sm font-medium flex items-center gap-2">
        {nodeType.type === 'toolAgent' ? (
          <Bot className="w-4 h-4 text-blue-600" />
        ) : (
          <Play className="w-4 h-4 text-green-600" />
        )}
        {nodeType.label}
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  return (
    <div className="w-64 bg-gray-50 p-4 border-r border-gray-200">
      <h3 className="font-bold mb-4 text-gray-700 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Agents
      </h3>
      <div className="space-y-3">
        {NODE_TYPE_LIST.map((nodeType) => (
          <DraggableNode key={nodeType.id} nodeType={nodeType} />
        ))}
      </div>
      
    </div>
  );
}

// Canvas Component
function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodeId, setNodeId] = useState(1);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, type: "custom" }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeTypeData = event.dataTransfer.getData("application/reactflow");

      if (!nodeTypeData) {
        return;
      }

      const nodeType = JSON.parse(nodeTypeData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${nodeType.type}-${nodeId}`,
        type: nodeType.type,
        position,
        data: {
          ...nodeType.data,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);
    },
    [screenToFlowPosition, setNodes, nodeId]
  );

  return (
    <div className="flex-1 h-full">
      <div
        ref={reactFlowWrapper}
        className="w-full h-full"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls position="top-right" />
          <Background color="#e5e7eb" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}



// Ana App Component
export default function App() {
  return (
    <ReactFlowProvider>
      <div className="w-full h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <FlowCanvas />
        </div>
      </div>
    </ReactFlowProvider>
  );
}