// API Types
export interface NodeMetadata {
  name: string;
  description: string;
  node_type: 'provider' | 'processor' | 'terminator';
  inputs: NodeInput[];
  outputs?: any[];
}

export interface NodeInput {
  name: string;
  type: string;
  description: string;
  required: boolean;
  is_connection: boolean;
  default?: any;
}

// Workflow Types
export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    inputs?: Record<string, any>;
    metadata?: NodeMetadata;
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowExecutionRequest {
  workflow: Workflow;
  input: Record<string, any>;
  workflow_id?: string;
}

export interface WorkflowExecutionResponse {
  output: Record<string, any>;
  workflow_id: string;
}