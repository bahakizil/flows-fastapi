import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { FileText } from 'lucide-react'

const PromptTemplateNode = ({ data, isConnectable }) => {
  const template = data.inputs?.template || 'No template set'
  const truncatedTemplate = template.length > 50 
    ? template.substring(0, 50) + '...' 
    : template

  return (
    <Card className="w-64 shadow-lg border-2 border-green-200 bg-green-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <FileText className="h-4 w-4 text-green-600" />
          <span>Prompt Template</span>
          <Badge variant="secondary" className="text-xs">
            Prompt
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">Template:</span>
            <div className="mt-1 p-2 bg-white rounded border text-gray-700 font-mono">
              {truncatedTemplate}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="promptTemplate"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </Card>
  )
}

export default memo(PromptTemplateNode)

