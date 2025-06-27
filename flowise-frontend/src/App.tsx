import React, { useState } from 'react';
import NodePalette from './components/NodePalette';
import FlowEditor from './components/FlowEditor';
import { NodeMetadata } from './types';
import { Workflow, Settings, Github } from 'lucide-react';

function App() {
  const [draggedNode, setDraggedNode] = useState<{nodeType: string, metadata: NodeMetadata} | null>(null);

  const handleNodeDrag = (nodeType: string, metadata: NodeMetadata) => {
    setDraggedNode({ nodeType, metadata });
  };

  const handleNodeDrop = (nodeType: string, metadata: NodeMetadata) => {
    console.log('Node dropped:', nodeType, metadata);
    setDraggedNode(null);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Flowise FastAPI</h1>
              <p className="text-sm text-gray-600">Visual AI Workflow Builder</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Backend Connected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={20} />
              </button>
              <a 
                href="https://github.com/bahakizil/fastapi-reactflow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <NodePalette onNodeDrag={handleNodeDrag} />
        
        {/* Flow Editor */}
        <FlowEditor onNodeDrop={handleNodeDrop} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Drag nodes from the palette to create your AI workflow
          </div>
          <div>
            Built with React Flow & FastAPI
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
