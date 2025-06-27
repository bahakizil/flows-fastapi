#!/bin/bash

echo "🎨 Starting Flowise React Frontend..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8000"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the React development server
npm start 