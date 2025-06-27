#!/bin/bash

echo "🚀 Starting Flowise FastAPI Backend..."
echo "📍 Backend will be available at: http://localhost:8000"
echo "📋 API Documentation: http://localhost:8000/docs"
echo ""

# Start the FastAPI server with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 