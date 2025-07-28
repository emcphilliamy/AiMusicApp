#!/bin/bash

echo "🚀 Starting AI Music Creator..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Backend running on http://localhost:3001"
echo "✅ Frontend running on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
