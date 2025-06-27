import React, { useEffect, useState } from 'react';
import { NodeMetadata } from '../types';
import { nodeApi } from '../services/api';
import { Bot, Wrench, Package, PlayCircle } from 'lucide-react';

interface NodePaletteProps {
  onNodeDrag: (nodeType: string, metadata: NodeMetadata) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDrag }) => {
  const [nodes, setNodes] = useState<NodeMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const nodeData = await nodeApi.getNodes();
        setNodes(nodeData);
      } catch (err) {
        setError('Failed to fetch nodes');
        console.error('Error fetching nodes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, []);

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'provider':
        return <Package size={16} />;
      case 'processor':
        return <Bot size={16} />;
      case 'terminator':
        return <PlayCircle size={16} />;
      default:
        return <Wrench size={16} />;
    }
  };

  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'provider':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'processor':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'terminator':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const groupedNodes = nodes.reduce((acc, node) => {
    if (!acc[node.node_type]) {
      acc[node.node_type] = [];
    }
    acc[node.node_type].push(node);
    return acc;
  }, {} as Record<string, NodeMetadata[]>);

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Node Palette</h2>
      
      {Object.entries(groupedNodes).map(([nodeType, nodeList]) => (
        <div key={nodeType} className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2 capitalize flex items-center gap-2">
            {getNodeIcon(nodeType)}
            {nodeType}s
          </h3>
          
          <div className="space-y-2">
            {nodeList.map((node) => (
              <div
                key={node.name}
                className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors ${getNodeColor(nodeType)}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    nodeType: node.name,
                    metadata: node
                  }));
                  onNodeDrag(node.name, node);
                }}
              >
                <div className="font-medium text-sm text-gray-800">{node.name}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {node.description}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {node.inputs.length} input(s)
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NodePalette;