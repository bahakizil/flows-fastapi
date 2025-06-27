import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Play, Save, Download, Upload, MessageSquare, Settings, Zap } from 'lucide-react'

import ChatOpenAINode from './components/nodes/ChatOpenAINode'
import PromptTemplateNode from './components/nodes/PromptTemplateNode'
import LLMChainNode from './components/nodes/LLMChainNode'
import NodePalette from './components/NodePalette'
import PropertyPanel from './components/PropertyPanel'
import ChatPanel from './components/ChatPanel'

import './App.css'

const nodeTypes = {
  chatOpenAI: ChatOpenAINode,
  promptTemplate: PromptTemplateNode,
  llmChain: LLMChainNode,
}

const initialNodes = [
  {
    id: 'promptTemplate_0',
    type: 'promptTemplate',
    position: { x: 100, y: 100 },
    data: {
      label: 'Prompt Template',
      inputs: {
        template: 'Sen yardımcı bir AI asistanısın. Kullanıcı sorusu: {input}'
      }
    },
  },
  {
    id: 'chatOpenAI_0',
    type: 'chatOpenAI',
    position: { x: 100, y: 300 },
    data: {
      label: 'ChatOpenAI',
      inputs: {
        openAIApiKey: '',
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7
      }
    },
  },
  {
    id: 'llmChain_0',
    type: 'llmChain',
    position: { x: 400, y: 200 },
    data: {
      label: 'LLM Chain',
      inputs: {}
    },
  },
]

const initialEdges = [
  {
    id: 'edge_1',
    source: 'promptTemplate_0',
    target: 'llmChain_0',
    sourceHandle: 'promptTemplate',
    targetHandle: 'prompt',
  },
  {
    id: 'edge_2',
    source: 'chatOpenAI_0',
    target: 'llmChain_0',
    sourceHandle: 'chatOpenAI',
    targetHandle: 'model',
  },
]

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [flowName, setFlowName] = useState('Simple Chat Flow')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          inputs: getDefaultInputs(type)
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const getDefaultInputs = (nodeType) => {
    switch (nodeType) {
      case 'chatOpenAI':
        return {
          openAIApiKey: '',
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7
        }
      case 'promptTemplate':
        return {
          template: 'Sen yardımcı bir AI asistanısın. {input}'
        }
      case 'llmChain':
        return {}
      default:
        return {}
    }
  }

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    )
  }, [setNodes])

  const executeFlow = async () => {
    setIsExecuting(true)
    setExecutionResult(null)
    
    try {
      const flowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }))
      }

      // Create flow
      const createResponse = await fetch('http://localhost:5001/api/v1/chatflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'test_flow',
          name: flowName,
          ...flowData
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create flow')
      }

      const createResult = await createResponse.json()
      console.log('Flow created:', createResult)

      // Execute flow
      const executeResponse = await fetch('http://localhost:5001/api/v1/prediction/test_flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Merhaba, nasılsın?'
        }),
      })

      if (!executeResponse.ok) {
        throw new Error('Failed to execute flow')
      }

      const result = await executeResponse.json()
      setExecutionResult(result)
      console.log('Execution result:', result)

    } catch (error) {
      console.error('Execution error:', error)
      setExecutionResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const saveFlow = () => {
    const flowData = {
      name: flowName,
      nodes,
      edges
    }
    
    const dataStr = JSON.stringify(flowData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${flowName.replace(/\s+/g, '_')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Flowise Clone</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="w-64"
            placeholder="Flow name"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={executeFlow}
            disabled={isExecuting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
          <Button onClick={saveFlow} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={() => setShowChat(!showChat)}
            variant="outline"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 bg-white border-r border-gray-200">
          <NodePalette />
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            
            {/* Execution Result Panel */}
            {executionResult && (
              <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg max-w-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Execution Result</h3>
                    <Badge variant={executionResult.success ? "default" : "destructive"}>
                      {executionResult.success ? "Success" : "Error"}
                    </Badge>
                  </div>
                  {executionResult.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Response:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {executionResult.data?.text || 'No response'}
                      </p>
                      {executionResult.data?.executionOrder && (
                        <div>
                          <p className="text-sm text-gray-600">Execution Order:</p>
                          <div className="flex flex-wrap gap-1">
                            {executionResult.data.executionOrder.map((nodeId, index) => (
                              <Badge key={nodeId} variant="outline" className="text-xs">
                                {index + 1}. {nodeId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">{executionResult.error}</p>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Property Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200">
            <PropertyPanel
              node={selectedNode}
              onUpdateNode={updateNodeData}
            />
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200">
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  )
}

export default App

