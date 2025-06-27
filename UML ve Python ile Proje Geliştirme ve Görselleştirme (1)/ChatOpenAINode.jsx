import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Bot } from 'lucide-react'

const ChatOpenAINode = ({ data, isConnectable }) => {
  return (
    <Card className="w-64 shadow-lg border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Bot className="h-4 w-4 text-blue-600" />
          <span>ChatOpenAI</span>
          <Badge variant="secondary" className="text-xs">
            LLM
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">Model:</span> {data.inputs?.modelName || 'gpt-3.5-turbo'}
          </div>
          <div>
            <span className="font-medium">Temperature:</span> {data.inputs?.temperature || 0.7}
          </div>
          <div>
            <span className="font-medium">API Key:</span> {
              data.inputs?.openAIApiKey 
                ? `${data.inputs.openAIApiKey.substring(0, 8)}...` 
                : 'Not set'
            }
          </div>
        </div>
      </CardContent>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="chatOpenAI"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  )
}

export default memo(ChatOpenAINode)

