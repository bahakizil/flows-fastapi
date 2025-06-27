import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  RefreshCw, 
  Bot, 
  Wrench, 
  Brain, 
  Database, 
  FileText, 
  MessageSquare,
  Zap,
  Settings,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { NodeMetadata } from '../services/api';

interface NodePaletteProps {
  availableNodes: NodeMetadata[];
  onRefresh: () => void;
}

interface CategoryInfo {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const categoryConfig: Record<string, CategoryInfo> = {
  llms: {
    icon: <Bot className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Language Models'
  },
  tools: {
    icon: <Wrench className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'External Tools'
  },
  agents: {
    icon: <Brain className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'AI Agents'
  },
  memory: {
    icon: <Database className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Memory Systems'
  },
  document_loaders: {
    icon: <FileText className="w-4 h-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'Document Loaders'
  },
  prompts: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    description: 'Prompt Templates'
  },
  output_parsers: {
    icon: <Zap className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    description: 'Output Parsers'
  },
  retrievers: {
    icon: <Search className="w-4 h-4" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
    description: 'Information Retrievers'
  },
  other: {
    icon: <Settings className="w-4 h-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    description: 'Other Components'
  }
};

const NodePalette: React.FC<NodePaletteProps> = ({ availableNodes, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group nodes by category
  const categorizedNodes = useMemo(() => {
    const filtered = availableNodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = filtered.reduce((acc, node) => {
      const category = node.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(node);
      return acc;
    }, {} as Record<string, NodeMetadata[]>);

    // Sort categories and nodes
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.label.localeCompare(b.label));
    });

    return grouped;
  }, [availableNodes, searchTerm]);

  const filteredCategories = selectedCategory 
    ? { [selectedCategory]: categorizedNodes[selectedCategory] || [] }
    : categorizedNodes;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const getCategoryStats = () => {
    const stats = Object.entries(categorizedNodes).map(([category, nodes]) => ({
      category,
      count: nodes.length,
      ...categoryConfig[category]
    }));
    return stats.sort((a, b) => b.count - a.count);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Node Palette</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {getCategoryStats().map(({ category, count, color, bgColor }) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={`
                  text-xs p-2 rounded border text-left transition-all
                  ${selectedCategory === category 
                    ? `${bgColor} border-current` 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`font-medium ${selectedCategory === category ? color : 'text-gray-700'}`}>
                  {categoryConfig[category]?.description || category}
                </div>
                <div className="text-gray-500">
                  {count} node{count !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="mt-4" />
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(categorizedNodes).reduce((sum, nodes) => sum + nodes.length, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Nodes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(categorizedNodes).length}
            </div>
            <div className="text-xs text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {availableNodes.length}
            </div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No nodes found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(filteredCategories).map(([category, nodes]) => {
              const categoryInfo = categoryConfig[category] || categoryConfig.other;
              const isCollapsed = collapsedCategories.has(category);

              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={categoryInfo.color}>
                        {categoryInfo.icon}
                      </span>
                      <span className="font-medium text-gray-900">
                        {categoryInfo.description}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {nodes.length}
                      </Badge>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Category Nodes */}
                  {!isCollapsed && (
                    <div className="space-y-2 ml-2">
                      {nodes.map((node) => (
                        <Card
                          key={node.name}
                          className={`
                            cursor-grab hover:shadow-md transition-all duration-200 
                            ${categoryInfo.bgColor}
                          `}
                          draggable
                          onDragStart={(e) => handleDragStart(e, node.name)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-sm truncate">
                                  {node.label}
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {node.description || 'No description available'}
                                </p>
                                
                                {/* Input/Output counts */}
                                <div className="flex items-center space-x-3 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-xs text-gray-500">
                                      {node.inputs?.length || 0} inputs
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-xs text-gray-500">
                                      {node.outputs?.length || 0} outputs
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className={`flex-shrink-0 ml-2 ${categoryInfo.color}`}>
                                {categoryInfo.icon}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Drag nodes onto the canvas to add them to your workflow
        </p>
      </div>
    </div>
  );
};

export default NodePalette;