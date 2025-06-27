# 🚀 Flowise Frontend - Enhanced Visual Workflow Builder

A modern, responsive React TypeScript frontend for building and executing AI workflows with visual drag-and-drop interface.

## 🌟 Features

- **Visual Workflow Editor**: Drag-and-drop interface with ReactFlow
- **Real-time Execution**: Execute workflows with instant feedback
- **Streaming Support**: Real-time streaming responses from AI models
- **Node Palette**: Categorized, searchable library of workflow components
- **Session Management**: Persistent workflow sessions with backend
- **Validation**: Real-time workflow validation before execution
- **Modern UI**: Clean, responsive design with Tailwind CSS and Radix UI
- **TypeScript**: Full type safety and excellent developer experience

## 🏗️ Architecture

```
flowise-frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (buttons, cards, etc.)
│   │   ├── FlowEditor.tsx   # Main workflow editor component
│   │   ├── NodePalette.tsx  # Searchable node library
│   │   └── CustomNode.tsx   # Custom ReactFlow node component
│   ├── services/
│   │   └── api.ts          # Backend API integration
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Running Flowise FastAPI backend on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The frontend will be available at `http://localhost:3000`

## 🔧 Available Workflow Nodes

### 🤖 Language Models
- **OpenAI Chat**: GPT-3.5, GPT-4 models
- **Google Gemini**: Gemini Pro models

### 🛠️ Tools
- **Google Search**: Web search functionality
- **Wikipedia Tool**: Wikipedia article search
- **Tavily Search**: Advanced search API

### 🧠 Agents
- **ReAct Agent**: Reasoning and acting agent with tool access

### 💾 Memory
- **Conversation Memory**: Chat history management

### 📄 Document Processing
- **PDF Loader**: Extract text from PDF documents
- **Web Loader**: Load content from web pages
- **Chroma Retriever**: Vector similarity search

### 📝 Input/Output
- **Prompt Template**: Dynamic prompt generation
- **String Output Parser**: Simple text output
- **Pydantic Output Parser**: Structured data output

## 🎨 UI Components

The frontend uses a modern component library built on:

- **Radix UI**: Accessible, unstyled components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **ReactFlow**: Interactive node-based editor

### Key UI Features

- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Works on desktop and tablet
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages

## 🔌 Backend Integration

The frontend integrates with the FastAPI backend through a comprehensive API service:

### API Features

- **Automatic Retries**: Resilient network requests
- **Request/Response Logging**: Detailed debugging information
- **Type Safety**: Full TypeScript interfaces
- **Error Handling**: Comprehensive error messages
- **Streaming Support**: Real-time data streaming

### API Endpoints Used

```typescript
// Node management
GET /api/v1/nodes                    // List available nodes
POST /api/v1/workflows/validate      // Validate workflow

// Workflow execution
POST /api/v1/workflows/execute       // Execute workflow
POST /api/v1/workflows/execute/stream // Stream execution

// Session management
POST /api/v1/workflows/sessions      // Create session
GET /api/v1/workflows/sessions/{id}  // Get session
POST /api/v1/workflows/chat         // Chat with workflow

// Health monitoring
GET /api/v1/workflows/health        // Backend health check
```

## 🎯 Usage Guide

### Creating a Workflow

1. **Open the Node Palette**: Browse available nodes by category
2. **Search Nodes**: Use the search bar to find specific components
3. **Drag & Drop**: Drag nodes from the palette onto the canvas
4. **Connect Nodes**: Click and drag between node handles to create connections
5. **Configure Inputs**: Select nodes to configure their inputs in the details panel

### Executing Workflows

1. **Add Input**: Enter your message in the input panel
2. **Validate**: Click "Validate" to check for errors
3. **Execute**: Click "Execute" for standard execution or "Stream" for real-time output
4. **View Results**: Check the results panel for output, execution order, and timing

### Managing Workflows

- **Save**: Export workflow as JSON file
- **Load**: Import workflow from JSON file
- **Clear**: Reset the canvas
- **Duplicate**: Copy nodes with the duplicate button

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8000

# Optional: Enable debug logging
REACT_APP_DEBUG=true
```

### Tailwind Configuration

The frontend uses a custom Tailwind configuration with design tokens:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        // ... more design tokens
      }
    }
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
npm install -g serve
serve -s build -p 3000
```

### Docker Deployment
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Integration with Backend

### Session Management

The frontend automatically creates and manages sessions:

```typescript
// Session creation
const session = await createSession();
setSessionId(session.session_id);

// Workflow execution with session
const result = await executeWorkflow(workflowData, input, sessionId);
```

### Real-time Updates

Support for streaming execution:

```typescript
await executeWorkflowStream(
  workflowData,
  input,
  sessionId,
  (data) => {
    // Handle streaming data
    console.log('Streaming update:', data);
  }
);
```

### Error Handling

Comprehensive error handling with user-friendly messages:

```typescript
try {
  await executeWorkflow(workflowData, input);
} catch (error) {
  // Display user-friendly error message
  setError(error.message);
}
```

## 📊 Performance

- **Bundle Size**: Optimized with code splitting
- **Rendering**: Virtualized node palette for large datasets
- **Memory**: Efficient ReactFlow rendering
- **Network**: Request deduplication and caching

## 🔍 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on `http://localhost:8000`
   - Check CORS configuration
   - Verify firewall settings

2. **Nodes Not Loading**
   - Check browser console for errors
   - Verify backend `/api/v1/nodes` endpoint
   - Refresh the node palette

3. **Execution Failures**
   - Validate workflow before execution
   - Check node configurations
   - Review backend logs

### Debug Mode

Enable debug logging:
```bash
REACT_APP_DEBUG=true npm start
```

## 🎛️ Advanced Features

### Custom Node Types

Add new node types by extending the base node:

```typescript
// Define new node type
const CustomNodeType = ({ data, id }) => {
  return (
    <div className="custom-node">
      {/* Custom node implementation */}
    </div>
  );
};

// Register node type
const nodeTypes = {
  custom: CustomNode,
  customNodeType: CustomNodeType,
};
```

### Workflow Templates

Save and load workflow templates:

```typescript
const saveTemplate = (workflow) => {
  localStorage.setItem('workflow-template', JSON.stringify(workflow));
};

const loadTemplate = () => {
  return JSON.parse(localStorage.getItem('workflow-template') || '{}');
};
```

## 📈 Monitoring

The frontend includes built-in monitoring:

- **Health Checks**: Automatic backend connectivity monitoring
- **Performance Metrics**: Execution timing and success rates
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: Node usage statistics

## 🔮 Future Enhancements

- **Collaborative Editing**: Multi-user workflow editing
- **Version Control**: Workflow versioning and history
- **Custom Themes**: Additional color schemes
- **Plugin System**: Extensible node system
- **Mobile Support**: Responsive mobile interface

## 📚 Resources

- [ReactFlow Documentation](https://reactflow.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
