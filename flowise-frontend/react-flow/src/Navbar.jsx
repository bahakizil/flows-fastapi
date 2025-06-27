import { ArrowLeft, Save, Settings, MessageSquare, X, Send } from "lucide-react";
import React, { useState } from "react";

// Chat Modal Component
const ChatModal = ({ isOpen, onClose, onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await onSendMessage(message);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: `Error: ${error.message}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Chat with Workflow</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center">
              Start a conversation with your workflow
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 max-w-xs px-3 py-2 rounded-lg">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onChatMessage }) => {
  const [title, setTitle] = useState("isimsiz dosya");
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <header className="w-full h-16 bg-[#F5F5F5] shadow-lg shadow-[#616161]">
        <nav className="flex justify-between items-center p-4 bg-[#FFFFFF] text-[#616161] m-auto">
          <div>
            <ArrowLeft className="text-black cursor-pointer w-10 h-10 p-2 rounded-4xl hover:bg-[#6a6969] transition duration-500" />
          </div>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dosya Adı"
              autoFocus
              required
              className="text-3xl border-b-2 border-[#616161] w-full text-center focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-4 gap-2">
            <div>
              <MessageSquare 
                onClick={() => setIsChatOpen(true)}
                className="text-black hover:text-white cursor-pointer w-10 h-10 p-2 rounded-4xl hover:bg-[#6a6969] transition duration-500" 
              />
            </div>
            <div>
              <Save className="text-black hover:text-white cursor-pointer w-10 h-10 p-2 rounded-4xl hover:bg-[#6a6969] transition duration-500" />
            </div>
            <div className="text-xs text-[#616161]">
              <Settings className="text-black hover:text-white cursor-pointer w-10 h-10 p-2 rounded-4xl hover:bg-[#6a6969] transition duration-500" />
            </div>
          </div>
        </nav>
      </header>

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={onChatMessage}
      />
    </>
  );
};

export default Navbar;
