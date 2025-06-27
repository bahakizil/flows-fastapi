import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Components
import NodePalette from './NodePalette';
import CustomNode from './CustomNode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  MessageSquare, 
  Settings, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-react';

// Services
import { 
  executeWorkflow, 
  executeWorkflowStream,
  getAvailableNodes, 
  validateWorkflow,
  createSession,
  checkHealthStatus,
  WorkflowWebSocket,
  NodeMetadata,
  ExecutionResponse,
  ValidationResponse
} from '../services/api';

// Types
interface NodeData {
  label: string;
  nodeType: string;
  inputs: Record<string, any>;
  outputs: any[];
  category: string;
  description?: string;
}

interface FlowData {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface ExecutionState {
  isExecuting: boolean;
  isStreaming: boolean;
  result: any;
  error: string | null;
  executionOrder: string[];
  sessionId: string | null;
  executionTime: number | null;
}

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date | null;
  error: string | null;
}

const nodeTypes = {
  custom: CustomNode,
};

const FlowEditor: React.FC = () => {
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [inputText, setInputText] = useState('Hello, how can you help me?');
  
  // Execution state
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    isStreaming: false,
    result: null,
    error: null,
    executionOrder: [],
    sessionId: null,
    executionTime: null
  });

  // UI state
  const [availableNodes, setAvailableNodes] = useState<NodeMetadata[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    lastCheck: null,
    error: null
  });
  const [streamingOutput, setStreamingOutput] = useState<string>('');

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const wsRef = useRef<WorkflowWebSocket | null>(null);

  // Load available nodes and check health on mount
  useEffect(() => {
    loadAvailableNodes();
    checkBackendHealth();
    
    // Create session
    createNewSession();
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkBackendHealth, 30000);
    
    return () => {
      clearInterval(healthInterval);
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  const loadAvailableNodes = async () => {
    try {
      const response = await getAvailableNodes();
      setAvailableNodes(response.data || []);
      console.log('📦 Loaded available nodes:', response.data?.length);
    } catch (error) {
      console.error('Failed to load available nodes:', error);
      setExecutionState(prev => ({ ...prev, error: 'Failed to load available nodes' }));
    }
  };

  const checkBackendHealth = async () => {
    try {
      await checkHealthStatus();
      setHealthStatus({
        isHealthy: true,
        lastCheck: new Date(),
        error: null
      });
    } catch (error: any) {
      setHealthStatus({
        isHealthy: false,
        lastCheck: new Date(),
        error: error.message
      });
    }
  };

  const createNewSession = async () => {
    try {
      const session = await createSession();
      setExecutionState(prev => ({ ...prev, sessionId: session.session_id }));
      console.log('🆔 Created new session:', session.session_id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Event handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      // Find node configuration
      const nodeConfig = availableNodes.find(n => n.name === type);
      if (!nodeConfig) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<NodeData> = {
        id: `${type}_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeConfig.label || nodeConfig.name,
          nodeType: type,
          inputs: getDefaultInputs(nodeConfig),
          outputs: nodeConfig.outputs || [],
          category: nodeConfig.category || 'unknown',
          description: nodeConfig.description
        },
      };

      setNodes((nds) => nds.concat(newNode));
      console.log('➕ Added node:', newNode);
    },
    [reactFlowInstance, availableNodes, setNodes]
  );

  const getDefaultInputs = (nodeConfig: NodeMetadata): Record<string, any> => {
    const defaults: Record<string, any> = {};
    
    if (nodeConfig.inputs) {
      nodeConfig.inputs.forEach((input) => {
        if (input.default !== undefined) {
          defaults[input.name] = input.default;
        }
      });
    }

    return defaults;
  };

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const validateFlow = async () => {
    if (nodes.length === 0) {
      setValidationResult({
        success: false,
        errors: ['No nodes in the flow to validate']
      });
      return;
    }

    try {
      const flowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          data: {
            inputs: node.data.inputs,
            outputs: node.data.outputs
          },
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || 'output',
          targetHandle: edge.targetHandle || 'input'
        }))
      };

      const result = await validateWorkflow(flowData);
      setValidationResult(result);
      console.log('✅ Validation result:', result);
    } catch (error: any) {
      setValidationResult({
        success: false,
        errors: [error.message]
      });
    }
  };

  const executeFlow = async (streaming = false) => {
    if (nodes.length === 0) {
      setExecutionState(prev => ({ ...prev, error: 'No nodes in the flow to execute' }));
      return;
    }

    setExecutionState(prev => ({
      ...prev,
      isExecuting: true,
      isStreaming: streaming,
      result: null,
      error: null,
      executionOrder: [],
      executionTime: null
    }));

    setStreamingOutput('');

    try {
      // Prepare flow data for backend
      const flowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          data: {
            inputs: node.data.inputs,
            outputs: node.data.outputs
          },
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || 'output',
          targetHandle: edge.targetHandle || 'input'
        }))
      };

      console.log('🚀 Executing workflow:', { flowData, inputText, streaming });

      if (streaming) {
        await executeWorkflowStream(
          flowData, 
          inputText,
          executionState.sessionId || undefined,
          (data) => {
            console.log('📡 Streaming data:', data);
            setStreamingOutput(prev => prev + JSON.stringify(data, null, 2) + '\n');
          }
        );
        
        setExecutionState(prev => ({
          ...prev,
          isExecuting: false,
          isStreaming: false,
          result: 'Streaming completed'
        }));
      } else {
        const result = await executeWorkflow(
          flowData, 
          inputText,
          executionState.sessionId || undefined
        );
        
        setExecutionState(prev => ({
          ...prev,
          isExecuting: false,
          result: result.result,
          executionOrder: result.execution_order || [],
          sessionId: result.session_id || prev.sessionId,
          executionTime: result.execution_time || null
        }));
      }

      console.log('✅ Workflow execution completed');
      
    } catch (error: any) {
      console.error('❌ Workflow execution failed:', error);
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        isStreaming: false,
        error: error.message
      }));
    }
  };

  const clearFlow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setExecutionState({
      isExecuting: false,
      isStreaming: false,
      result: null,
      error: null,
      executionOrder: [],
      sessionId: null,
      executionTime: null
    });
    setValidationResult(null);
    setStreamingOutput('');
    createNewSession();
    console.log('🗑️ Flow cleared');
  };

  const saveFlow = () => {
    const flowData = {
      name: flowName,
      nodes,
      edges,
      metadata: {
        created: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${flowName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('💾 Flow saved:', exportFileDefaultName);
  };

  const loadFlow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target?.result as string);
        setFlowName(flowData.name || 'Loaded Flow');
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        setSelectedNode(null);
        console.log('📁 Flow loaded:', flowData.name);
      } catch (error) {
        console.error('Failed to load flow:', error);
        setExecutionState(prev => ({ ...prev, error: 'Failed to load flow file' }));
      }
    };
    reader.readAsText(file);
  };

  const duplicateNode = (node: Node<NodeData>) => {
    const newNode: Node<NodeData> = {
      ...node,
      id: `${node.data.nodeType}_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      }
    };
    setNodes((nds) => nds.concat(newNode));
    console.log('📋 Node duplicated:', newNode.id);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    console.log('🗑️ Node deleted:', nodeId);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="max-w-xs"
            placeholder="Flow name"
          />
          <Badge variant={healthStatus.isHealthy ? 'default' : 'destructive'}>
            {healthStatus.isHealthy ? '🟢 Backend Connected' : '🔴 Backend Disconnected'}
          </Badge>
          {executionState.sessionId && (
            <Badge variant="outline">
              Session: {executionState.sessionId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNodePalette(!showNodePalette)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showNodePalette ? 'Hide' : 'Show'} Palette
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={validateFlow}
            disabled={nodes.length === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeFlow(false)}
            disabled={executionState.isExecuting || nodes.length === 0}
          >
            {executionState.isExecuting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Execute
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeFlow(true)}
            disabled={executionState.isExecuting || nodes.length === 0}
          >
            {executionState.isStreaming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Stream
          </Button>
          
          <Button variant="outline" size="sm" onClick={saveFlow}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          
          <input
            type="file"
            accept=".json"
            onChange={loadFlow}
            style={{ display: 'none' }}
            id="load-flow"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('load-flow')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Load
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearFlow}
            disabled={executionState.isExecuting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        {showNodePalette && (
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
            <NodePalette 
              availableNodes={availableNodes} 
              onRefresh={loadAvailableNodes}
            />
          </div>
        )}

        {/* Main Flow Area */}
        <div className="flex-1 relative">
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap />
                             <Background />
              
              {/* Input Panel */}
              <Panel position="top-left" className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Input Message:</label>
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter your message..."
                    className="w-64"
                  />
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Results Panel */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Execution Results</h3>
            
            {/* Validation Results */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    {validationResult.success ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                    )}
                    Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">Errors:</p>
                      {validationResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">{error}</p>
                      ))}
                    </div>
                  )}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-600">Warnings:</p>
                      {validationResult.warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-yellow-600">{warning}</p>
                      ))}
                    </div>
                  )}
                  {validationResult.success && !validationResult.errors?.length && !validationResult.warnings?.length && (
                    <p className="text-sm text-green-600">Flow is valid!</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Execution Error */}
            {executionState.error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{executionState.error}</AlertDescription>
              </Alert>
            )}

            {/* Execution Result */}
            {executionState.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Result
                    {executionState.executionTime && (
                      <Badge variant="outline" className="ml-2">
                        {executionState.executionTime.toFixed(2)}s
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-40">
                    {typeof executionState.result === 'string' 
                      ? executionState.result 
                      : JSON.stringify(executionState.result, null, 2)
                    }
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Execution Order */}
            {executionState.executionOrder.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Execution Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {executionState.executionOrder.map((nodeId, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-2">
                          {index + 1}
                        </span>
                        {nodeId}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Streaming Output */}
            {executionState.isStreaming && streamingOutput && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Live Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-60">
                    {streamingOutput}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Selected Node Details */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Node Details
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateNode(selectedNode)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNode(selectedNode.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>ID:</strong> {selectedNode.id}</p>
                    <p className="text-sm"><strong>Type:</strong> {selectedNode.data.nodeType}</p>
                    <p className="text-sm"><strong>Category:</strong> {selectedNode.data.category}</p>
                    {selectedNode.data.description && (
                      <p className="text-sm"><strong>Description:</strong> {selectedNode.data.description}</p>
                    )}
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Inputs:</p>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
                        {JSON.stringify(selectedNode.data.inputs, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;