import axios from 'axios';
import { NodeMetadata, WorkflowExecutionRequest, WorkflowExecutionResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const nodeApi = {
  // Get all available nodes
  getNodes: async (): Promise<NodeMetadata[]> => {
    const response = await api.get('/api/v1/nodes');
    return response.data;
  },

  // Get specific node by name
  getNode: async (nodeName: string): Promise<NodeMetadata> => {
    const response = await api.get(`/api/v1/nodes/${nodeName}`);
    return response.data;
  },
};

export const workflowApi = {
  // Execute a workflow
  executeWorkflow: async (request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> => {
    const response = await api.post('/api/v1/workflows/execute', request);
    return response.data;
  },
};

export default api;