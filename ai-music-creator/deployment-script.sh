#!/bin/bash

# AI Music Creator - Quick Setup Script
# Run this script to set up your development environment

echo "🎵 Setting up AI Music Creator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ffmpeg
        else
            echo "❌ Homebrew not found. Please install FFmpeg manually from https://ffmpeg.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update && sudo apt install -y ffmpeg
    else
        echo "❌ Please install FFmpeg manually from https://ffmpeg.org/"
        exit 1
    fi
fi

# Create project structure
echo "📁 Creating project structure..."
mkdir -p ai-music-creator/{backend,frontend}
cd ai-music-creator

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Create package.json
cat > package.json << EOL
{
  "name": "ai-music-creator-backend",
  "version": "1.0.0",
  "description": "Backend server for AI Music Creator app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["ai", "music", "audio", "generation"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "node-fetch": "^3.3.2",
    "fluent-ffmpeg": "^2.1.2",
    "music-tempo": "^0.3.1",
    "pitch-detector": "^2.0.0",
    "wavefile": "^11.0.0",
    "meyda": "^5.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOL

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Create uploads directory
mkdir -p uploads

# Create .env file
cat > .env << EOL
# AI API Keys (optional - add your keys here)
HUGGINGFACE_API_KEY=
REPLICATE_API_TOKEN=
OPENAI_API_KEY=

# Server Configuration
PORT=3001
NODE_ENV=development
EOL

echo "✅ Backend setup complete!"

# Setup frontend
echo "🔧 Setting up frontend..."
cd ../frontend

# Create React app
npx create-react-app . --template typescript

# Install additional dependencies
npm install lucide-react axios wavesurfer.js tone react-router-dom

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind
cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# Update index.css
cat > src/index.css << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

echo "✅ Frontend setup complete!"

# Create start script
cd ..
cat > start.sh << EOL
#!/bin/bash

echo "🚀 Starting AI Music Creator..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=\$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=\$!

echo "✅ Backend running on http://localhost:3001"
echo "✅ Frontend running on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "kill \$BACKEND_PID \$FRONTEND_PID" EXIT
wait
EOL

chmod +x start.sh

# Create helpful README
cat > README.md << EOL
# AI Music Creator

## Quick Start

1. **First time setup** (if you haven't run the setup script):
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

2. **Start the application**:
   \`\`\`bash
   ./start.sh
   \`\`\`

3. **Open your browser** to http://localhost:3000

## Manual Start

If you prefer to start servers manually:

\`\`\`bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
\`\`\`

## Adding AI Features

1. Sign up for free API keys:
   - [Hugging Face](https://huggingface.co/settings/tokens) (free)
   - [Replicate](https://replicate.com/account/api-tokens) (pay-per-use)

2. Add your keys to \`backend/.env\`:
   \`\`\`
   HUGGINGFACE_API_KEY=your_token_here
   REPLICATE_API_TOKEN=your_token_here
   \`\`\`

3. Restart the backend server

## Features

- 🎵 Generate music from text descriptions
- 🎤 Record and process hummed melodies  
- 📁 Upload and edit audio files
- 🎛️ Mix multiple tracks with effects
- 💾 Save and export projects
- 🎨 Modern, intuitive interface

## Next Steps

- Check out the full setup instructions in the artifacts
- Explore the backend API endpoints
- Customize the UI components
- Add more audio effects and features
- Deploy to the cloud when ready

Happy music making! 🎶
EOL

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📁 Your project is ready in: $(pwd)"
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "📖 Check README.md for more information"
echo ""
echo "🔑 Don't forget to add your AI API keys to backend/.env"
echo ""
echo "Happy music making! 🎶"