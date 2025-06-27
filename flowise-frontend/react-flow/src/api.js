// API service for communicating with FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

class FlowyAPI {
  async getAvailableNodes() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/nodes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowData, input) {
    try {
      const payload = {
        workflow: {
          id: `workflow_${Date.now()}`,
          name: "React Flow Workflow",
          nodes: workflowData.nodes.map(node => ({
            id: node.id,
            type: node.data.nodeType || node.type,
            data: {
              inputs: node.data.inputs || {}
            }
          })),
          edges: workflowData.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || "output",
            targetHandle: edge.targetHandle || "input"
          }))
        },
        input: { input: input }
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }
}

export default new FlowyAPI(); 