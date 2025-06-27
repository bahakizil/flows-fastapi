import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Settings, Eye, EyeOff } from 'lucide-react'

const PropertyPanel = ({ node, onUpdateNode }) => {
  const [localInputs, setLocalInputs] = useState(node.data.inputs || {})
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    setLocalInputs(node.data.inputs || {})
  }, [node])

  const handleInputChange = (key, value) => {
    const newInputs = { ...localInputs, [key]: value }
    setLocalInputs(newInputs)
    onUpdateNode(node.id, { inputs: newInputs })
  }

  const getNodeConfig = (nodeType) => {
    switch (nodeType) {
      case 'chatOpenAI':
        return {
          title: 'ChatOpenAI Configuration',
          color: 'blue',
          fields: [
            {
              key: 'openAIApiKey',
              label: 'OpenAI API Key',
              type: 'password',
              placeholder: 'sk-...',
              required: true
            },
            {
              key: 'modelName',
              label: 'Model Name',
              type: 'select',
              options: [
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' }
              ],
              default: 'gpt-3.5-turbo'
            },
            {
              key: 'temperature',
              label: 'Temperature',
              type: 'number',
              min: 0,
              max: 2,
              step: 0.1,
              default: 0.7,
              description: 'Controls randomness in responses (0-2)'
            }
          ]
        }
      case 'promptTemplate':
        return {
          title: 'Prompt Template Configuration',
          color: 'green',
          fields: [
            {
              key: 'template',
              label: 'Template',
              type: 'textarea',
              placeholder: 'Enter your prompt template here...\nUse {input} for user input',
              required: true,
              description: 'Use {input} to insert user input, {variable} for other variables'
            }
          ]
        }
      case 'llmChain':
        return {
          title: 'LLM Chain Configuration',
          color: 'purple',
          fields: [
            {
              key: 'chainName',
              label: 'Chain Name',
              type: 'text',
              placeholder: 'Optional chain name',
              description: 'Optional name for this chain'
            }
          ]
        }
      default:
        return {
          title: 'Node Configuration',
          color: 'gray',
          fields: []
        }
    }
  }

  const config = getNodeConfig(node.type)

  const renderField = (field) => {
    const value = localInputs[field.key] || field.default || ''

    switch (field.type) {
      case 'password':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              id={field.key}
              type={showApiKey ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm"
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm min-h-[100px]"
              rows={4}
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleInputChange(field.key, newValue)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value) || 0)}
              min={field.min}
              max={field.max}
              step={field.step}
              className="text-sm"
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm"
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{config.title}</span>
              <Badge variant="secondary" className={`bg-${config.color}-100 text-${config.color}-700`}>
                {node.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Node ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Node ID</Label>
              <Input
                value={node.id}
                disabled
                className="text-sm bg-gray-50"
              />
            </div>

            <Separator />

            {/* Dynamic Fields */}
            {config.fields.map(renderField)}

            {config.fields.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No configuration options available for this node type.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node Info */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Node Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{node.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Position:</span>
              <span className="font-medium">
                ({Math.round(node.position.x)}, {Math.round(node.position.y)})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PropertyPanel

