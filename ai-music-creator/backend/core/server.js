require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Import NSynth dataset downloader
const { NSynthDownloader } = require('../integrations/nsynth-downloader');

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Static file serving
app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('generated', {
  setHeaders: (res, path) => {
    if (path.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
  }
}));
app.use('/cache', express.static('cache'));

// Create required directories
['uploads', 'generated', 'cache'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Initialize NSynth dataset downloader
const nsynthDownloader = new NSynthDownloader();

// Basic API endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'AI Music Backend Server',
    features: ['NSynth isolated notes', 'File uploads', 'WebSocket support'],
    uptime: process.uptime()
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };

    console.log(`📁 File uploaded: ${req.file.originalname}`);
    res.json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// File download endpoint
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'generated', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// List uploaded files
app.get('/api/files/uploads', (req, res) => {
  try {
    const files = fs.readdirSync('uploads')
      .filter(file => !file.startsWith('.'))
      .map(file => ({
        filename: file,
        size: fs.statSync(path.join('uploads', file)).size,
        modified: fs.statSync(path.join('uploads', file)).mtime,
        url: `/uploads/${file}`
      }));
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List generated files
app.get('/api/files/generated', (req, res) => {
  try {
    const files = fs.readdirSync('generated')
      .filter(file => !file.startsWith('.'))
      .map(file => ({
        filename: file,
        size: fs.statSync(path.join('generated', file)).size,
        modified: fs.statSync(path.join('generated', file)).mtime,
        url: `/generated/${file}`
      }));
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NSynth API endpoints
app.get('/api/nsynth/status', (req, res) => {
  try {
    const instruments = Object.keys(nsynthDownloader.instrumentFolders).map(instrument => {
      const notes = nsynthDownloader.getInstrumentNotes(instrument);
      return {
        instrument,
        folder: `${instrument}Nsynth`,
        noteCount: notes.length
      };
    });

    res.json({ 
      status: 'ready',
      message: 'NSynth integration active',
      dataDirectory: nsynthDownloader.baseDataDir,
      instruments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nsynth/download/:dataset', async (req, res) => {
  const { dataset } = req.params;
  
  if (!['train', 'valid', 'test'].includes(dataset)) {
    return res.status(400).json({ error: 'Invalid dataset type. Use: train, valid, or test' });
  }
  
  try {
    console.log(`🎵 Starting NSynth ${dataset} dataset download...`);
    res.json({ 
      message: `Starting NSynth ${dataset} dataset download...`, 
      status: 'downloading',
      note: 'This will download in the background. Check logs for progress.'
    });
    
    // Download in background
    nsynthDownloader.downloadAndOrganizeDataset(dataset)
      .then(() => {
        console.log(`✅ NSynth ${dataset} dataset download completed`);
        io.emit('nsynth-download-complete', { dataset, status: 'completed' });
      })
      .catch(error => {
        console.error(`❌ NSynth ${dataset} dataset download failed:`, error);
        io.emit('nsynth-download-error', { dataset, error: error.message });
      });
      
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nsynth/instruments', (req, res) => {
  try {
    const instruments = Object.keys(nsynthDownloader.instrumentFolders).map(instrument => {
      const notes = nsynthDownloader.getInstrumentNotes(instrument);
      return {
        instrument,
        folder: `${instrument}Nsynth`,
        noteCount: notes.length,
        pitchRange: notes.length > 0 ? {
          min: Math.min(...notes.map(n => n.pitch)),
          max: Math.max(...notes.map(n => n.pitch))
        } : null
      };
    });
    
    res.json({ instruments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nsynth/instrument/:instrument/notes', (req, res) => {
  try {
    const { instrument } = req.params;
    const notes = nsynthDownloader.getInstrumentNotes(instrument);
    
    if (notes.length === 0) {
      return res.status(404).json({ error: `No notes found for instrument: ${instrument}` });
    }
    
    res.json({ 
      instrument, 
      notes: notes.map(note => ({
        pitch: note.pitch,
        velocity: note.velocity,
        filename: note.filename,
        url: `/api/nsynth/note/${instrument}/${note.pitch}/${note.velocity}`
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nsynth/note/:instrument/:pitch/:velocity?', (req, res) => {
  try {
    const { instrument, pitch, velocity } = req.params;
    const pitchNum = parseInt(pitch);
    const velocityNum = velocity ? parseInt(velocity) : null;
    
    const note = nsynthDownloader.findNote(instrument, pitchNum, velocityNum);
    
    if (!note) {
      return res.status(404).json({ 
        error: `Note not found for ${instrument}, pitch ${pitchNum}${velocityNum ? `, velocity ${velocityNum}` : ''}` 
      });
    }
    
    // Stream the audio file
    res.sendFile(note.path);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.emit('welcome', { 
    message: 'Connected to AI Music Backend',
    features: ['NSynth integration', 'File uploads', 'Real-time updates']
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
  
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/status',
      'POST /api/upload',
      'GET /api/download/:filename',
      'GET /api/files/uploads',
      'GET /api/files/generated',
      'GET /api/nsynth/status',
      'POST /api/nsynth/download/:dataset',
      'GET /api/nsynth/instruments',
      'GET /api/nsynth/instrument/:instrument/notes',
      'GET /api/nsynth/note/:instrument/:pitch/:velocity?'
    ]
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🎵 AI Music Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🎼 Generated directory: ${path.resolve('generated')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  console.log(`🎹 NSynth dataset integration ready - isolated instrument notes available`);
  console.log(`🚀 Features: File uploads, NSynth isolated notes, WebSocket support`);
  console.log(`📊 Server is clean and minimal - ready for AI model testing!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});