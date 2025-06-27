import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Button } from '@/components/ui/button.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { MessageSquare, Send, User, Bot, Loader2 } from 'lucide-react'

const ChatPanel = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Chat panel ready. Execute your flow to start chatting!',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Execute flow with user message
      const response = await fetch('http://localhost:5001/api/v1/prediction/test_flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const result = await response.json()
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.success ? result.data.text : `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString(),
        executionOrder: result.data?.executionOrder
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'system',
        content: 'Chat cleared. Execute your flow to start chatting!',
        timestamp: new Date().toLocaleTimeString()
      }
    ])
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'bot':
        return <Bot className="h-4 w-4" />
      case 'system':
        return <MessageSquare className="h-4 w-4" />
      case 'error':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMessageStyle = (type) => {
    switch (type) {
      case 'user':
        return 'bg-blue-50 border-blue-200'
      case 'bot':
        return 'bg-green-50 border-green-200'
      case 'system':
        return 'bg-gray-50 border-gray-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          </div>
          <Button
            onClick={clearChat}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border ${getMessageStyle(message.type)}`}
            >
              <div className="flex items-start space-x-2">
                <div className={`mt-0.5 ${
                  message.type === 'user' ? 'text-blue-600' :
                  message.type === 'bot' ? 'text-green-600' :
                  message.type === 'error' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {message.type === 'user' ? 'You' :
                       message.type === 'bot' ? 'AI' :
                       message.type === 'error' ? 'Error' :
                       'System'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.executionOrder && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Execution Order:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.executionOrder.map((nodeId, index) => (
                          <Badge key={nodeId} variant="outline" className="text-xs">
                            {index + 1}. {nodeId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

export default ChatPanel

