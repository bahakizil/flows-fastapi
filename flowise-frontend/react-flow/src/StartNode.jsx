import React from "react";
import { Handle, Position } from "reactflow";
import {  Play } from "lucide-react";
import "reactflow/dist/style.css"
export default function StartNode() {
  return (
    <div className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-green-400 bg-green-100 text-gray-700 font-medium hover:bg-green-200">
     <div className="bg-green-400 p-3 rounded-lg">
        <Play className="w-6 h-6 text-white" />
     </div>
     <p>Start</p>
     <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
