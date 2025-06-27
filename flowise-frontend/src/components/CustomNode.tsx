import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeMetadata } from '../types';
import { Bot, Package, PlayCircle, Settings } from 'lucide-react';

export interface CustomNodeData {
  metadata: NodeMetadata;
  inputs?: Record<string, any>;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const { metadata } = data;

  const getNodeIcon = () => {
    switch (metadata.node_type) {
      case 'provider':
        return <Package size={16} className="text-blue-600" />;
      case 'processor':
        return <Bot size={16} className="text-green-600" />;
      case 'terminator':
        return <PlayCircle size={16} className="text-purple-600" />;
      default:
        return <Settings size={16} className="text-gray-600" />;
    }
  };

  const getNodeColor = () => {
    switch (metadata.node_type) {
      case 'provider':
        return selected ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white hover:bg-blue-50';
      case 'processor':
        return selected ? 'border-green-500 bg-green-50' : 'border-green-300 bg-white hover:bg-green-50';
      case 'terminator':
        return selected ? 'border-purple-500 bg-purple-50' : 'border-purple-300 bg-white hover:bg-purple-50';
      default:
        return selected ? 'border-gray-500 bg-gray-50' : 'border-gray-300 bg-white hover:bg-gray-50';
    }
  };

  const connectionInputs = metadata.inputs.filter(input => input.is_connection);
  const userInputs = metadata.inputs.filter(input => !input.is_connection);

  return (
    <div className={`min-w-48 border-2 rounded-lg shadow-sm transition-all ${getNodeColor()}`}>
      {/* Connection Inputs (Left handles) */}
      {connectionInputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          style={{
            top: 40 + (index * 20),
            background: '#6b7280',
            width: 8,
            height: 8,
          }}
        />
      ))}

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {getNodeIcon()}
          <span className="font-medium text-sm text-gray-800">{metadata.name}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
          {metadata.description}
        </div>

        {/* User Inputs */}
        {userInputs.length > 0 && (
          <div className="space-y-1">
            {userInputs.slice(0, 3).map((input) => ( // Show max 3 inputs
              <div key={input.name} className="text-xs">
                <span className="text-gray-500">{input.name}:</span>
                <span className="text-gray-700 ml-1">{input.type}</span>
                {input.required && <span className="text-red-400 ml-1">*</span>}
              </div>
            ))}
            {userInputs.length > 3 && (
              <div className="text-xs text-gray-400">
                +{userInputs.length - 3} more...
              </div>
            )}
          </div>
        )}

        {/* Node Type Badge */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            metadata.node_type === 'provider' ? 'bg-blue-100 text-blue-700' :
            metadata.node_type === 'processor' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {metadata.node_type}
          </span>
        </div>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#6b7280',
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
};

export default CustomNode;