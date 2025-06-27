import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowEditor from './components/FlowEditor';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { 
  Zap, 
  Github, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { checkHealthStatus } from './services/api';

interface AppState {
  backendStatus: 'unknown' | 'connected' | 'error';
  backendError: string | null;
  showWelcome: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    backendStatus: 'unknown',
    backendError: null,
    showWelcome: true
  });

  useEffect(() => {
    checkBackendConnection();
    
    // Hide welcome after 10 seconds
    const timer = setTimeout(() => {
      setAppState(prev => ({ ...prev, showWelcome: false }));
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  const checkBackendConnection = async () => {
    try {
      await checkHealthStatus();
      setAppState(prev => ({
        ...prev,
        backendStatus: 'connected',
        backendError: null
      }));
    } catch (error: any) {
      setAppState(prev => ({
        ...prev,
        backendStatus: 'error',
        backendError: error.message
      }));
    }
  };

  const WelcomeModal = () => {
    if (!appState.showWelcome) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span>Welcome to Flowise Clone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backend Status */}
            <div className="flex items-center justify-center space-x-2">
              {appState.backendStatus === 'connected' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Backend Connected</span>
                </>
              ) : appState.backendStatus === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Backend Disconnected</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-blue-700 font-medium">Checking Backend...</span>
                </>
              )}
            </div>

            {appState.backendError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Backend Error:</strong> {appState.backendError}
                  <br />
                  <span className="text-sm text-gray-600 mt-1 block">
                    Make sure the FastAPI backend is running on http://localhost:8000
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">✨ Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visual workflow editor</li>
                  <li>• Drag & drop node palette</li>
                  <li>• Real-time execution</li>
                  <li>• Streaming responses</li>
                  <li>• Session management</li>
                  <li>• Workflow validation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">🔧 Available Nodes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OpenAI & Gemini LLMs</li>
                  <li>• Search tools & Wikipedia</li>
                  <li>• Document loaders</li>
                  <li>• Memory systems</li>
                  <li>• ReAct agents</li>
                  <li>• Output parsers</li>
                </ul>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 Quick Start</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Drag nodes from the palette onto the canvas</li>
                <li>2. Connect nodes by dragging from output to input handles</li>
                <li>3. Configure node inputs in the details panel</li>
                <li>4. Enter your input message and click Execute</li>
              </ol>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('http://localhost:8000/docs', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  API Docs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://github.com/flowise/flowise', '_blank')}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Original Flowise
                </Button>
              </div>
              <Button
                onClick={() => setAppState(prev => ({ ...prev, showWelcome: false }))}
              >
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="App">
      <ReactFlowProvider>
        <div className="h-screen w-full bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Flowise Clone</h1>
                  <p className="text-sm text-gray-500">Visual AI Workflow Builder</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={appState.backendStatus === 'connected' ? 'default' : 'destructive'}
                  className="flex items-center space-x-1"
                >
                  {appState.backendStatus === 'connected' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  <span>
                    {appState.backendStatus === 'connected' ? 'Backend Online' : 'Backend Offline'}
                  </span>
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAppState(prev => ({ ...prev, showWelcome: true }))}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="h-[calc(100vh-4rem)]">
            {appState.backendStatus === 'error' ? (
              <div className="flex items-center justify-center h-full">
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Backend Connection Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Unable to connect to the FastAPI backend. Please ensure:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Backend is running on http://localhost:8000</li>
                      <li>• No firewall is blocking the connection</li>
                      <li>• CORS is properly configured</li>
                    </ul>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      cd flowise-fastapi<br />
                      uvicorn main:app --reload
                    </div>
                    <Button onClick={checkBackendConnection} className="w-full">
                      Retry Connection
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <FlowEditor />
            )}
          </main>
        </div>
      </ReactFlowProvider>
      
      <WelcomeModal />
    </div>
  );
}

export default App;
