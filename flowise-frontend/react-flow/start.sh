#!/bin/bash

echo "🚀 Starting Flowise React Frontend..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "🔗 Connecting to backend at: http://localhost:8000"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the React development server
npm start 