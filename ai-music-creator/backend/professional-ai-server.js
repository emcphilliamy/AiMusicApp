require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Import only necessary modules for Professional Instrument AI
const { IsolatedAudioGenerator } = require('./generate-isolated-audio');
const { PromptAnalyzer } = require('./prompt-analyzer');

// Try to import multi-AI classes
let ModelManager;
try {
  const multiAIClasses = require('./multi-ai-classes.js');
  ModelManager = multiAIClasses.ModelManager;
  console.log('✅ Professional Instrument AI classes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Professional Instrument AI classes:', error.message);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/generated', express.static(path.join(__dirname, 'generated'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.wav')) {
      res.set('Content-Type', 'audio/wav');
    }
  }
}));

// Initialize Professional Instrument AI systems
const modelManager = new ModelManager();
const promptAnalyzer = new PromptAnalyzer();
let isolatedGenerator;

// Load the Professional Instrument AI model
async function initializeProfessionalAI() {
  try {
    console.log('🧠 Loading Professional Instrument AI...');
    
    // Load the trained model
    await modelManager.loadModels();
    const model = modelManager.getModel('instrument_focused_1753999330514');
    
    if (!model) {
      console.error('❌ Professional Instrument AI model not found!');
      process.exit(1);
    }
    
    modelManager.switchToModel('instrument_focused_1753999330514');
    console.log(`✅ Professional Instrument AI loaded: ${model.name}`);
    console.log(`📊 Training samples: ${model.trainingData.samples.length}`);
    console.log(`🎼 Genres: ${Object.keys(model.stats.genres).join(', ')}`);
    
    // Initialize isolated audio generator
    isolatedGenerator = new IsolatedAudioGenerator(model);
    console.log('🎼 Isolated audio generation system ready');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Professional Instrument AI:', error);
    process.exit(1);
  }
}

// Main generation endpoint - uses Professional Instrument AI only
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, genre, tempo, key } = req.body;
    
    console.log(`🎵 Generating music with Professional Instrument AI: "${prompt}"`);
    
    // Check if this should be isolated generation
    const isIsolated = isolatedGenerator.shouldUseIsolatedGeneration(prompt);
    
    if (isIsolated) {
      console.log('🎯 Using isolated generation');
      const result = await isolatedGenerator.generateIsolatedAudio({
        prompt,
        genre: genre || 'pop',
        tempo: tempo || 120,
        key: key || 'C'
      });
      
      res.json({
        success: true,
        ...result,
        generationType: 'isolated'
      });
    } else {
      console.log('🎼 Using full arrangement generation');
      
      // Use the Professional Instrument AI model for full generation
      const context = {
        prompt: prompt || 'upbeat instrumental',
        genre: genre || 'pop', 
        tempo: tempo || 120,
        key: key || 'C'
      };
      
      // Generate using the trained model
      const result = await modelManager.generateMusic(context);
      
      res.json({
        success: true,
        ...result,
        generationType: 'full'
      });
    }
    
  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Model status endpoint
app.get('/api/models', (req, res) => {
  const currentModel = modelManager.getCurrentModel();
  res.json({
    success: true,
    currentModel: {
      id: currentModel.id,
      name: currentModel.name,
      type: currentModel.type,
      stats: currentModel.stats,
      sampleCount: currentModel.trainingData.samples.length
    }
  });
});

// Training endpoint for Professional Instrument AI
app.post('/api/models/:modelId/train', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { genre, trackCount } = req.body;
    
    if (!genre) {
      return res.status(400).json({
        success: false,
        error: 'Genre is required for training'
      });
    }
    
    console.log(`🎓 Starting training for Professional Instrument AI: ${genre} (${trackCount || 20} tracks)`);
    
    // Start training in background
    const trainingPromise = modelManager.trainModel(modelId, genre, trackCount || 20);
    
    res.json({
      success: true,
      message: `Training started for Professional Instrument AI on ${genre} genre`,
      modelId,
      genre,
      trackCount: trackCount || 20
    });
    
    // Handle training completion in background
    trainingPromise.then(result => {
      console.log(`✅ Professional Instrument AI training completed:`, result);
      io.emit('model_training_complete', {
        modelId,
        success: true,
        result
      });
    }).catch(error => {
      console.error(`❌ Professional Instrument AI training failed:`, error);
      io.emit('model_training_complete', {
        modelId, 
        success: false,
        error: error.message
      });
    });
    
  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const model = modelManager.getCurrentModel();
  res.json({
    success: true,
    status: 'Professional Instrument AI Ready',
    model: model.name,
    samples: model.trainingData.samples.length,
    genres: Object.keys(model.stats.genres)
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🎵 Professional Instrument AI Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🎼 Generated music directory: ${path.resolve('generated')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  
  // Initialize the Professional Instrument AI
  await initializeProfessionalAI();
  
  console.log(`🚀 Professional Instrument AI server ready - reggae system disabled`);
  console.log(`✅ Using only trained Professional Instrument AI for all music generation`);
});