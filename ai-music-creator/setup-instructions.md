# AI Music Creator - Setup Instructions

## Overview
This is a complete AI music generation app similar to Suno that allows users to:
- Generate music from text descriptions
- Record and process hummed melodies
- Upload and edit audio files
- Mix multiple tracks
- Apply audio effects
- Export finished projects

## Project Structure
```
ai-music-creator/
├── backend/
│   ├── server.js
│   ├── aiService.js
│   ├── audioUtils.js
│   ├── package.json
│   └── uploads/ (created automatically)
├── frontend/
│   ├── src/
│   │   ├── App.js (the React component I created)
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Prerequisites

### Required Software
1. **Node.js** (v14+) - Download from [nodejs.org](https://nodejs.org/)
2. **FFmpeg** - For audio processing
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
3. **Git** - For version control
4. **Code Editor** - VS Code recommended

### Optional API Keys (for AI generation)chmod +x setup.sh
- **Hugging Face API Key** - Free tier available at [huggingface.co](https://huggingface.co/settings/tokens)
- **Replicate API Token** - Pay-per-use at [replicate.com](https://replicate.com/account/api-tokens)

## Installation Steps

### 1. Create Project Structure
```bash
mkdir ai-music-creator
cd ai-music-creator
mkdir backend frontend
```

### 2. Backend Setup
```bash
cd backend

# Create package.json (copy from the backend package.json I provided)
npm init -y

# Install dependencies
npm install express multer cors node-fetch fluent-ffmpeg music-tempo pitch-detector wavefile meyda
npm install -D nodemon

# Create the server files
# Copy server.js, aiService.js, and audioUtils.js into this directory

# Create uploads directory
mkdir uploads

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend

# Create React app
npx create-react-app .

# Install additional dependencies
npm install lucide-react axios tailwindcss autoprefixer postcss wavesurfer.js tone react-router-dom

# Setup Tailwind CSS
npx tailwindcss init -p
```

### 4. Configure Tailwind CSS
Create `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Replace App.js
Replace the contents of `src/App.js` with the React component I created above.

### 6. Environment Variables
Create `.env` file in backend directory:
```
HUGGINGFACE_API_KEY=your_huggingface_token_here
REPLICATE_API_TOKEN=your_replicate_token_here
OPENAI_API_KEY=your_openai_key_here
PORT=3001
```

## Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Free AI Music Generation Options

Since you mentioned not wanting to spend money, here are free alternatives:

### 1. Hugging Face (Free Tier)
- **MusicGen Small**: Free inference API
- **Limitations**: 30-second clips, rate limits
- **Setup**: Just need free Hugging Face account

### 2. Local AI Models
- **Riffusion**: Run locally with Python
- **MusicGen**: Can run locally with sufficient GPU
- **AudioCraft**: Meta's open-source toolkit

### 3. Open Source Alternatives
- **Magenta** (Google): TensorFlow-based music generation
- **OpenAI Jukebox**: Open source but requires significant compute
- **MuseNet**: Available through OpenAI API (free tier)

## Platform Recommendations

### For Mobile Development (Free Options)
1. **React Native** - Use your existing React knowledge
2. **Flutter** - Google's cross-platform framework
3. **Ionic** - Web-based mobile apps
4. **PhoneGap/Cordova** - Web to mobile wrapper

### For Desktop Applications
1. **Electron** - Wrap your web app as desktop app
2. **Tauri** - Rust-based alternative to Electron (smaller size)
3. **Progressive Web App (PWA)** - Web app that works offline

## Deployment Options (Free)

### Frontend
1. **Vercel** - Free hosting for React apps
2. **Netlify** - Free tier with CI/CD
3. **GitHub Pages** - Free static site hosting
4. **Firebase Hosting** - Google's free tier

### Backend
1. **Railway** - Free tier for Node.js apps
2. **Render** - Free tier with limitations
3. **Heroku** - Free tier (limited hours)
4. **Fly.io** - Free tier available

### Database (Free Options)
1. **MongoDB Atlas** - Free tier (512MB)
2. **Firebase Firestore** - Free tier
3. **Supabase** - Open source Firebase alternative
4. **PlanetScale** - Free MySQL hosting

## Advanced Features to Add

### Audio Processing
```javascript
// Add to your backend
const tone = require('tone');
const wavefile = require('wavefile');

// Pitch shifting
async function pitchShift(inputPath, semitones, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-filter:a', `asetrate=44100*2^(${semitones}/12),aresample=44100`,
      '-y', outputPath
    ]);
    
    ffmpeg.on('close', (code) => {
      code === 0 ? resolve({ success: true }) : reject(new Error(`Pitch shift failed: ${code}`));
    });
  });
}

// Time stretching
async function timeStretch(inputPath, factor, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-filter:a', `atempo=${factor}`,
      '-y', outputPath
    ]);
    
    ffmpeg.on('close', (code) => {
      code === 0 ? resolve({ success: true }) : reject(new Error(`Time stretch failed: ${code}`));
    });
  });
}
```

### Real-time Audio Processing
```javascript
// Frontend - Add to your React component
import * as Tone from 'tone';

const useAudioEffects = () => {
  const [reverb, setReverb] = useState(null);
  const [delay, setDelay] = useState(null);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    // Initialize Tone.js effects
    const reverbEffect = new Tone.Reverb(2).toDestination();
    const delayEffect = new Tone.PingPongDelay("4n", 0.2).toDestination();
    const filterEffect = new Tone.Filter(200, "lowpass").toDestination();
    
    setReverb(reverbEffect);
    setDelay(delayEffect);
    setFilter(filterEffect);
    
    return () => {
      reverbEffect.dispose();
      delayEffect.dispose();
      filterEffect.dispose();
    };
  }, []);

  return { reverb, delay, filter };
};
```

### Music Theory Integration
```javascript
// Backend - Add chord progression generator
class ChordProgressionGenerator {
  constructor() {
    this.chordProgressions = {
      pop: [
        ['C', 'Am', 'F', 'G'],
        ['Am', 'F', 'C', 'G'],
        ['F', 'G', 'Am', 'Am'],
        ['C', 'G', 'Am', 'F']
      ],
      rock: [
        ['A', 'D', 'A', 'E'],
        ['E', 'A', 'D', 'A'],
        ['G', 'D', 'Em', 'C']
      ],
      jazz: [
        ['Cmaj7', 'Am7', 'Dm7', 'G7'],
        ['Am7', 'D7', 'Gmaj7', 'Cmaj7'],
        ['Fmaj7', 'Bm7b5', 'E7', 'Am7']
      ]
    };
  }

  generateProgression(key, genre, length = 4) {
    const progressions = this.chordProgressions[genre] || this.chordProgressions.pop;
    const baseProgression = progressions[Math.floor(Math.random() * progressions.length)];
    
    // Transpose to the requested key
    const transposed = this.transposeProgression(baseProgression, key);
    
    return transposed.slice(0, length);
  }

  transposeProgression(progression, targetKey) {
    // Implementation for chord transposition
    return progression; // Simplified for example
  }
}
```

## Database Schema

### Using MongoDB
```javascript
// models/Project.js
const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  id: String,
  name: String,
  url: String,
  type: { type: String, enum: ['recording', 'upload', 'generated'] },
  duration: Number,
  volume: { type: Number, default: 1.0 },
  pan: { type: Number, default: 0 },
  effects: [{
    type: String,
    parameters: Object
  }],
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: String,
  userId: String, // For user authentication
  tracks: [trackSchema],
  settings: {
    tempo: { type: Number, default: 120 },
    key: { type: String, default: 'C' },
    timeSignature: { type: String, default: '4/4' },
    genre: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
```

### Using SQLite (Lighter Option)
```javascript
// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'music.db'));
    this.initialize();
  }

  initialize() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          settings TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          name TEXT NOT NULL,
          url TEXT,
          type TEXT,
          duration REAL,
          volume REAL DEFAULT 1.0,
          effects TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )
      `);
    });
  }

  createProject(name, settings) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare("INSERT INTO projects (name, settings) VALUES (?, ?)");
      stmt.run(name, JSON.stringify(settings), function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, settings });
      });
      stmt.finalize();
    });
  }
}

module.exports = Database;
```

## Testing Strategy

### Backend Tests
```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  test('POST /api/upload should accept audio files', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('audio', './test-files/sample.wav')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.file).toBeDefined();
  });

  test('POST /api/generate should create music', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        prompt: 'upbeat pop song',
        genre: 'pop',
        tempo: 120,
        key: 'C'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Tests
```javascript
// src/App.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders music creator interface', () => {
  render(<App />);
  expect(screen.getByText('AI Music Creator')).toBeInTheDocument();
});

test('handles file upload', () => {
  render(<App />);
  const uploadInput = screen.getByLabelText(/upload audio/i);
  const file = new File(['audio content'], 'test.wav', { type: 'audio/wav' });
  
  fireEvent.change(uploadInput, { target: { files: [file] } });
  // Add assertions for file handling
});
```

## Security Considerations

### File Upload Security
```javascript
// Add to server.js
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files allowed'), false);
  }
};

// Scan uploaded files for malware (if needed)
const scanFile = async (filePath) => {
  // Integration with antivirus scanning
  return { clean: true };
};
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // limit generation requests
});

app.use('/api/', apiLimiter);
app.use('/api/generate', generateLimiter);
```

## Performance Optimization

### Audio Streaming
```javascript
// Add streaming support for large audio files
app.get('/api/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
    const chunksize = (end-start)+1;
    
    const file = fs.createReadStream(filePath, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/wav',
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/wav',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});
```

### Caching
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache generated audio
app.post('/api/generate', async (req, res) => {
  const cacheKey = `${req.body.prompt}-${req.body.genre}-${req.body.tempo}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  // Generate new audio...
  const result = await generateMusic(req.body);
  cache.set(cacheKey, result);
  res.json(result);
});
```

## Deployment Instructions

### Using Docker
```dockerfile
# Dockerfile
FROM node:16

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Build frontend
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy backend code
COPY backend ./backend

EXPOSE 3001

CMD ["node", "backend/server.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/backend/uploads
    environment:
      - NODE_ENV=production
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
  
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Next Steps

1. **Start with the basic setup** - Get the frontend and backend running locally
2. **Add AI integration** - Sign up for Hugging Face and integrate MusicGen
3. **Implement audio processing** - Add FFmpeg-based audio manipulation
4. **Build mobile app** - Use React Native or convert to PWA
5. **Deploy to cloud** - Use free tiers of Vercel/Railway
6. **Add user authentication** - Implement login/signup functionality
7. **Build music database** - Add sample library and user-generated content
8. **Optimize performance** - Add caching, streaming, and CDN integration

## Troubleshooting

### Common Issues
- **FFmpeg not found**: Make sure FFmpeg is installed and in your PATH
- **Audio playback issues**: Check browser audio permissions
- **Large file uploads**: Increase multer file size limits
- **Memory issues**: Implement streaming for large audio files
- **API rate limits**: Implement proper rate limiting and caching

### Getting Help
- Check the browser console for frontend errors
- Check server logs for backend issues
- Test API endpoints with Postman or curl
- Use browser dev tools to debug audio issues

This should give you a complete foundation to build your AI music app! The key is to start simple and gradually add features.