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
  getStraightPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { Bot, Info } from "lucide-react";

// Custom Edge Component
function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag bg-amber-50 nopan rounded border-2 p-1 hover:bg-red-500 hover:text-white text-xs"
          onClick={() => {
            setEdges((es) => es.filter((e) => e.id !== id));
          }}
        >
          delete
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

// ToolAgentNode Component
function ToolAgentNode({ data }) {
  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-6 min-w-[300px] shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-8 h-8 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-800">Tool Agent</h2>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-700">Inputs</h3>
      </div>

      <div className="space-y-4">
        {data?.inputs?.map((input, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400 relative"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`input-${index}`}
              className="w-3 h-3 bg-blue-400"
              style={{ left: -6 }}
            />
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                {input.name}
                {input.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
            {input.hasInfo && <Info className="w-4 h-4 text-gray-500" />}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button className="px-6 py-2 bg-blue-100 text-blue-600 rounded-lg border border-blue-300 hover:bg-blue-200 transition-colors">
          Additional Parameters
        </button>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Output</h3>
        <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg relative">
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-3 h-3 bg-blue-400"
            style={{ right: -6 }}
          />
          <span className="font-medium text-gray-700">AgentExecutor</span>
        </div>
      </div>
    </div>
  );
}

// Node tipleri tanımları - component dışında
const NODE_TYPE_LIST = [
  {
    id: "1",
    type: "toolAgent",
    label: "Tool Agent",
    color: "bg-blue-500",
    data: {
      inputs: [
        { name: "Tools", required: true, hasInfo: false },
        { name: "Memory", required: true, hasInfo: false },
        { name: "Tool Calling Chat Model", required: true, hasInfo: true },
        { name: "Chat Prompt Template", required: false, hasInfo: true },
        { name: "Input Moderation", required: false, hasInfo: true },
      ],
    },
  },
  {
    id: "2",
    type: "toolAgent",
    label: "Tool Agent 2",
    color: "bg-red-500",
    data: {
      inputs: [
        { name: "Basic Input", required: true, hasInfo: false },
        { name: "Optional Input", required: false, hasInfo: true },
      ],
    },
  },
];

// nodeTypes ve edgeTypes objesini component dışında tanımla
const nodeTypes = {
  toolAgent: ToolAgentNode,
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
      className={`
        ${nodeType.color} 
        text-white p-3 rounded-lg cursor-grab shadow-lg
        transition-transform hover:scale-105 select-none
      `}
    >
      <div className="text-sm font-medium">{nodeType.label}</div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  return (
    <div className="w-64 bg-gray-100 p-4 border-r border-gray-300">
      <h3 className="font-bold mb-4 text-gray-700">Node Türleri</h3>
      <div className="space-y-3">
        {NODE_TYPE_LIST.map((nodeType) => (
          <DraggableNode key={nodeType.id} nodeType={nodeType} />
        ))}
      </div>
      <div className="mt-6 text-sm text-gray-600">
        <p>💡 İpucu:</p>
        <p>Node'ları sürükleyip canvas'a bırakın!</p>
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
    (params) => setEdges((eds) => addEdge({ ...params, type: "custom" }, eds)),
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

      // Mouse pozisyonunu ReactFlow koordinatlarına çevir
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
          label: `${nodeType.label} ${nodeId}`,
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
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

// Ana App Component
export default function App() {
  return (
    <ReactFlowProvider>
      <div className="w-full h-screen flex">
        <Sidebar />
        <FlowCanvas />
      </div>
    </ReactFlowProvider>
  );
}
