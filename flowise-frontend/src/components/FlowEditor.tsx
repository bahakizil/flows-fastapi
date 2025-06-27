import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode, { CustomNodeData } from './CustomNode';
import { NodeMetadata, WorkflowExecutionRequest } from '../types';
import { workflowApi } from '../services/api';
import { Play, Save, AlertCircle } from 'lucide-react';

const nodeTypes = {
  customNode: CustomNode,
};

interface FlowEditorProps {
  onNodeDrop: (nodeType: string, metadata: NodeMetadata) => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({ onNodeDrop }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));
        const { nodeType, metadata } = data;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node<CustomNodeData> = {
          id: `${nodeType}-${Date.now()}`,
          type: 'customNode',
          position,
          data: {
            metadata,
            inputs: {},
          },
        };

        setNodes((nds) => nds.concat(newNode));
        onNodeDrop(nodeType, metadata);
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    },
    [reactFlowInstance, setNodes, onNodeDrop]
  );

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      setExecutionError('Please add at least one node to execute the workflow');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      // Convert ReactFlow format to backend format
      const workflowNodes = nodes.map(node => ({
        id: node.id,
        type: node.data.metadata.name,
        data: {
          inputs: node.data.inputs || {},
        },
        position: node.position,
      }));

      const workflowEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source!,
        target: edge.target!,
        sourceHandle: edge.sourceHandle || 'output',
        targetHandle: edge.targetHandle || 'input',
      }));

      const executionRequest: WorkflowExecutionRequest = {
        workflow: {
          id: `workflow-${Date.now()}`,
          name: 'Test Workflow',
          nodes: workflowNodes,
          edges: workflowEdges,
        },
        input: {
          input: 'Hello, this is a test message!',
        },
      };

      console.log('Executing workflow:', executionRequest);
      const result = await workflowApi.executeWorkflow(executionRequest);
      setExecutionResult(result);
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      setExecutionError(error.response?.data?.detail || error.message || 'Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = () => {
    const workflow = {
      nodes,
      edges,
      viewport: reactFlowInstance?.getViewport(),
    };
    
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workflow-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <button
          onClick={executeWorkflow}
          disabled={isExecuting || nodes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isExecuting || nodes.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Play size={16} />
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </button>

        <button
          onClick={saveWorkflow}
          disabled={nodes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            nodes.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save size={16} />
          Save Workflow
        </button>

        <div className="text-sm text-gray-600">
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
      </div>

      {/* Results Panel */}
      {(executionResult || executionError) && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          {executionError ? (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Execution Error:</div>
                <div className="text-sm mt-1">{executionError}</div>
              </div>
            </div>
          ) : executionResult ? (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-800 mb-2">Execution Result:</div>
              <pre className="text-sm text-green-700 overflow-x-auto">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      )}

      {/* Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="top-right"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
const FlowEditorWithProvider: React.FC<FlowEditorProps> = (props) => (
  <ReactFlowProvider>
    <FlowEditor {...props} />
  </ReactFlowProvider>
);

export default FlowEditorWithProvider;