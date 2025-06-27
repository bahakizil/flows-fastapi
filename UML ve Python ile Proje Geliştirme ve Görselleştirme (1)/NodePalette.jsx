import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Bot, FileText, Link, Palette } from 'lucide-react'

const nodeCategories = [
  {
    title: 'Chat Models',
    icon: Bot,
    nodes: [
      {
        type: 'chatOpenAI',
        label: 'ChatOpenAI',
        description: 'OpenAI GPT chat model',
        color: 'blue'
      }
    ]
  },
  {
    title: 'Prompts',
    icon: FileText,
    nodes: [
      {
        type: 'promptTemplate',
        label: 'Prompt Template',
        description: 'Template for formatting prompts',
        color: 'green'
      }
    ]
  },
  {
    title: 'Chains',
    icon: Link,
    nodes: [
      {
        type: 'llmChain',
        label: 'LLM Chain',
        description: 'Chain LLM with prompt',
        color: 'purple'
      }
    ]
  }
]

const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Node Palette</h2>
        </div>
        
        <div className="space-y-4">
          {nodeCategories.map((category) => (
            <div key={category.title}>
              <div className="flex items-center space-x-2 mb-2">
                <category.icon className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">{category.title}</h3>
              </div>
              
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <Card
                    key={node.type}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-${node.color}-200 bg-${node.color}-50`}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {node.label}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs bg-${node.color}-100 text-${node.color}-700`}
                            >
                              {category.title.slice(0, -1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {category !== nodeCategories[nodeCategories.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Drag nodes from the palette to the canvas to build your flow
          </p>
        </div>
      </div>
    </div>
  )
}

export default NodePalette

