import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface NodeInput {
  name: string;
  type: string;
  label?: string;
  description?: string;
  required: boolean;
  default?: any;
  is_connection?: boolean;
  options?: string[];
}

export interface NodeOutput {
  name: string;
  type: string;
  label?: string;
}

export interface NodeMetadata {
  name: string;
  label: string;
  description: string;
  node_type: string;
  category: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    inputs: Record<string, any>;
    outputs?: any;
    label?: string;
    nodeType?: string;
    category?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  execution_order?: string[];
  session_id?: string;
  execution_time?: number;
}

export interface ValidationResponse {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface SessionInfo {
  id: string;
  created_at: string;
  messages: Array<{
    timestamp: string;
    human: string;
    ai: string;
  }>;
  context: Record<string, any>;
  last_workflow?: string;
}

// API Functions
export const getAvailableNodes = async (): Promise<{ success: boolean; data: NodeMetadata[] }> => {
  try {
    const response = await api.get<NodeMetadata[]>('/api/v1/nodes');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to fetch available nodes:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch available nodes');
  }
};

export const executeWorkflow = async (
  workflowData: WorkflowData, 
  input: string = 'Hello',
  sessionId?: string
): Promise<ExecutionResponse> => {
  try {
    const payload = {
      workflow: {
        id: `workflow_${Date.now()}`,
        name: 'Frontend Workflow',
        nodes: workflowData.nodes,
        edges: workflowData.edges,
      },
      input: input,
      session_id: sessionId,
      stream: false
    };

    console.log('🔄 Executing workflow with payload:', payload);
    
    const response = await api.post<ExecutionResponse>('/api/v1/workflows/execute', payload);
    
    return {
      success: true,
      result: response.data.result,
      execution_order: response.data.execution_order,
      session_id: response.data.session_id,
      execution_time: response.data.execution_time
    };
  } catch (error: any) {
    console.error('Workflow execution failed:', error);
    const errorMessage = error.response?.data?.detail?.error || 
                        error.response?.data?.detail || 
                        error.response?.data?.message || 
                        'Workflow execution failed';
    
    throw new Error(errorMessage);
  }
};

export const executeWorkflowStream = async (
  workflowData: WorkflowData,
  input: string = 'Hello',
  sessionId?: string,
  onMessage?: (data: any) => void
): Promise<void> => {
  try {
    const payload = {
      workflow: {
        id: `workflow_${Date.now()}`,
        name: 'Frontend Workflow',
        nodes: workflowData.nodes,
        edges: workflowData.edges,
      },
      input: input,
      session_id: sessionId,
      stream: true
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/workflows/execute/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onMessage?.(data);
          } catch (e) {
            console.error('Failed to parse streaming data:', e);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Streaming execution failed:', error);
    throw error;
  }
};

export const validateWorkflow = async (workflowData: WorkflowData): Promise<ValidationResponse> => {
  try {
    const payload = {
      id: `workflow_${Date.now()}`,
      name: 'Validation Workflow',
      nodes: workflowData.nodes,
      edges: workflowData.edges,
    };

    const response = await api.post<ValidationResponse>('/api/v1/workflows/validate', payload);
    return response.data;
  } catch (error: any) {
    console.error('Workflow validation failed:', error);
    throw new Error(error.response?.data?.detail || 'Workflow validation failed');
  }
};

export const createSession = async (): Promise<{ session_id: string }> => {
  try {
    const response = await api.post<{ session_id: string }>('/api/v1/workflows/sessions');
    return response.data;
  } catch (error: any) {
    console.error('Failed to create session:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

export const getSession = async (sessionId: string): Promise<SessionInfo> => {
  try {
    const response = await api.get<SessionInfo>(`/api/v1/workflows/sessions/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to get session:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get session');
  }
};

export const chatWithWorkflow = async (
  message: string,
  flowId: string,
  sessionId?: string
): Promise<{ response: string; session_id: string }> => {
  try {
    const payload = {
      message,
      flow_id: flowId,
      session_id: sessionId
    };

    const response = await api.post<{ response: string; session_id: string }>('/api/v1/workflows/chat', payload);
    return response.data;
  } catch (error: any) {
    console.error('Chat failed:', error);
    throw new Error(error.response?.data?.detail || 'Chat failed');
  }
};

export const checkHealthStatus = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const response = await api.get<{ status: string; timestamp: string }>('/api/v1/workflows/health');
    return response.data;
  } catch (error: any) {
    console.error('Health check failed:', error);
    throw new Error('Backend is not responding');
  }
};

// WebSocket for real-time updates
export class WorkflowWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: ((data: any) => void) | null = null;
  private onError: ((error: Event) => void) | null = null;
  private onClose: (() => void) | null = null;

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void, onClose?: () => void) {
    const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws/chat';
    
    this.onMessage = onMessage;
    this.onError = onError || null;
    this.onClose = onClose || null;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError?.(error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.onClose?.();
    };
    
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default api;