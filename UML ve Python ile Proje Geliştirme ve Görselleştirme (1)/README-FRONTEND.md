# Flowise FastAPI Frontend

React-based visual workflow builder for the Flowise FastAPI backend. Built with React Flow, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Visual Node-Based Editor**: Drag-and-drop interface for building AI workflows
- **Real-time API Integration**: Direct connection to Flowise FastAPI backend
- **Node Palette**: Browse and discover all available nodes by category
- **Workflow Execution**: Execute workflows directly from the interface
- **Type-Safe**: Built with TypeScript for robust development
- **Responsive Design**: Modern, mobile-friendly interface

## 🛠 Tech Stack

- **React 18** with TypeScript
- **React Flow** for visual workflow editing
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🎯 Usage

### Starting the Application

1. **Start the backend server** (in the `flowise-fastapi` directory):
   ```bash
   uvicorn main:app --reload
   ```

2. **Start the frontend** (in this directory):
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

### Building Workflows

1. **Browse Nodes**: Use the left sidebar to explore available nodes
2. **Drag & Drop**: Drag nodes from the palette to the canvas
3. **Connect Nodes**: Click and drag between node handles to create connections
4. **Execute**: Click the "Execute Workflow" button to run your workflow
5. **Save**: Export your workflow as JSON for later use

### Node Categories

- **Provider Nodes** (Blue): Create LangChain objects (LLMs, Tools, Prompts)
- **Processor Nodes** (Green): Combine multiple objects (Agents, Chains)
- **Terminator Nodes** (Purple): Process final outputs (Parsers, Formatters)

## 🏗 Project Structure

```
src/
├── components/           # React components
│   ├── NodePalette.tsx  # Left sidebar with available nodes
│   ├── FlowEditor.tsx   # Main workflow canvas
│   └── CustomNode.tsx   # Custom node component
├── services/            # API integration
│   └── api.ts          # Backend API calls
├── types/              # TypeScript definitions
│   └── index.ts        # Shared type definitions
├── App.tsx             # Main application component
└── index.css           # Global styles with Tailwind
```

## 🔌 API Integration

The frontend communicates with the backend through these endpoints:

- `GET /api/v1/nodes` - Fetch available nodes
- `POST /api/v1/workflows/execute` - Execute workflows

## 🧪 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📝 License

This project is licensed under the MIT License.

---

**Ready to build powerful AI workflows visually!** 🚀