import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Link } from 'lucide-react'

const LLMChainNode = ({ data, isConnectable }) => {
  return (
    <Card className="w-64 shadow-lg border-2 border-purple-200 bg-purple-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Link className="h-4 w-4 text-purple-600" />
          <span>LLM Chain</span>
          <Badge variant="secondary" className="text-xs">
            Chain
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="text-gray-600">
            Combines language model with prompt template to generate responses
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              Model Input
            </Badge>
            <Badge variant="outline" className="text-xs">
              Prompt Input
            </Badge>
          </div>
        </div>
      </CardContent>
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="model"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ top: '40%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="prompt"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '60%' }}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="llmChain"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </Card>
  )
}

export default memo(LLMChainNode)

