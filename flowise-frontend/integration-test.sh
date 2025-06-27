#!/bin/bash

echo "🧪 Testing Flowise Integration..."
echo "================================"

# Test Backend
echo "1. Testing Backend (Port 8000)..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is running correctly"
    echo "   📋 API Docs: http://localhost:8000/docs"
else
    echo "❌ Backend is not responding (HTTP $BACKEND_STATUS)"
fi

# Test Backend API Endpoints
echo ""
echo "2. Testing Backend API Endpoints..."
NODES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/nodes)
if [ "$NODES_STATUS" = "200" ]; then
    echo "✅ Nodes API endpoint working"
    NODES_COUNT=$(curl -s http://localhost:8000/api/v1/nodes | jq '. | length')
    echo "   📊 Found $NODES_COUNT available nodes"
else
    echo "❌ Nodes API endpoint not working (HTTP $NODES_STATUS)"
fi

# Test Frontend
echo ""
echo "3. Testing Frontend (Port 3000)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running correctly"
    echo "   🌐 Frontend URL: http://localhost:3000"
else
    echo "❌ Frontend is not responding (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "🎉 Integration Test Complete!"
echo "📝 Summary:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs" 