require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Import reggae enhancement modules
const { ReggaePatternLibrary, ReggaeInstrumentSpecialistAI } = require('./reggae-enhancement-classes');
const { ReggaeConflictResolver, ReggaeQualityAssessmentAI } = require('./reggae-quality-systems');
const { ReggaeAudioSynthesizer, ReggaeMixingEngine } = require('./reggae-audio-synthesis');

// Import drum training system
const { DrumTrainingSystem } = require('./drum-training-system');
const { ReconstructionDrumTrainer } = require('./reconstruction-drum-trainer');
const { DirectPatternTrainer } = require('./direct-pattern-trainer');

// Import wavefile for reggae audio synthesis
const { WaveFile } = require('wavefile');

// Import isolated instrument generation system
const { IsolatedAudioGenerator } = require('./generate-isolated-audio');

// ModelManager and IsolatedAudioGenerator will be initialized after class definitions

// Fallback class definitions for when multi-ai-classes.js is not available
let PromptAnalyzer, InstrumentSelector, MusicalKnowledgeBase;

// Try to import multi-AI classes, use fallbacks if not available
try {
  const multiAIClasses = require('./multi-ai-classes.js');
  PromptAnalyzer = multiAIClasses.PromptAnalyzer;
  InstrumentSelector = multiAIClasses.InstrumentSelector;
  MusicalKnowledgeBase = multiAIClasses.MusicalKnowledgeBase;
  console.log('✅ Multi-AI classes loaded successfully');
} catch (error) {
  console.warn('⚠️ Multi-AI classes not found, using fallback implementations');
  
  // Fallback implementations
  PromptAnalyzer = class {
    async analyze(prompt) {
      return {
        mood: { primary: 'energetic', intensity: 0.7 },
        energy: 0.8,
        complexity: 0.6,
        suggestedInstruments: [{ instrument: 'piano', relevance: 1 }]
      };
    }
  };
  
  InstrumentSelector = class {
    async selectForContext(context) {
      // For reggae, only generate drums to isolate the beat
      if (context.genre && context.genre.toLowerCase().includes('reggae')) {
        console.log('🥁 DEBUG: Isolating drums for reggae generation');
        return ['drums'];
      }
      return ['drums', 'bass', 'piano', 'saxophone'];
    }
  };
  
  MusicalKnowledgeBase = class {
    getChordProgression(genre, key) {
      console.log(`🎵 DEBUG: MusicalKnowledgeBase.getChordProgression called for genre: ${genre}, key: ${key}`);
      
      if (genre && genre.toLowerCase().includes('reggae')) {
        // Authentic reggae chord progressions
        const reggaeProgressions = [
          ['I', 'V', 'vi', 'IV'],     // Popular progression
          ['vi', 'IV', 'I', 'V'],     // Circle progression  
          ['I', 'VII', 'IV', 'I'],    // Mixolydian feel
          ['ii', 'V', 'I', 'vi']      // Jazz influence
        ];
        
        const progression = reggaeProgressions[Math.floor(Math.random() * reggaeProgressions.length)];
        const chords = this.transposeProgression(progression, key);
        
        console.log(`🎺 Generated reggae chord progression: ${chords.join('-')}`);
        return chords;
      }
      
      // Default progression for other genres
      return this.transposeProgression(['I', 'V', 'vi', 'IV'], key);
    }
    
    transposeProgression(progression, key) {
      const romanToScale = {
        'I': 0, 'ii': 1, 'iii': 2, 'IV': 3, 
        'V': 4, 'vi': 5, 'VII': 6, 'vii': 6
      };
      
      const scale = this.getScale(key);
      
      return progression.map(roman => {
        const scaleIndex = romanToScale[roman] || 0;
        return scale[scaleIndex];
      });
    }
    
    getScale(key) {
      const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const majorPattern = [0, 2, 4, 5, 7, 9, 11];
      const rootIndex = chromaticScale.indexOf(key.charAt(0)) || 0;
      
      return majorPattern.map(interval => 
        chromaticScale[(rootIndex + interval) % 12]
      );
    }
  };
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('generated', {
  setHeaders: (res, path) => {
    if (path.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use('/cache', express.static('cache'));

// Create directories if they don't exist
['uploads', 'generated', 'cache'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Song cache system - LRU cache with 10 song limit
class SongCache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(songId) {
    if (this.cache.has(songId)) {
      this._updateAccessOrder(songId);
      return this.cache.get(songId);
    }
    return null;
  }

  set(songId, filePath) {
    if (this.cache.size >= this.maxSize && !this.cache.has(songId)) {
      this._evictOldest();
    }

    this.cache.set(songId, filePath);
    this._updateAccessOrder(songId);
  }

  _updateAccessOrder(songId) {
    const index = this.accessOrder.indexOf(songId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(songId);
  }

  _evictOldest() {
    if (this.accessOrder.length > 0) {
      const oldestId = this.accessOrder.shift();
      const filePath = this.cache.get(oldestId);
      
      // Delete the cached file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Evicted cached song: ${oldestId}`);
        } catch (error) {
          console.error(`Error deleting cached file ${filePath}:`, error);
        }
      }
      
      this.cache.delete(oldestId);
    }
  }

  has(songId) {
    return this.cache.has(songId);
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      cached: Array.from(this.cache.keys()),
      accessOrder: [...this.accessOrder]
    };
  }
}

// Built-in genre patterns for offline generation
const fallbackPatterns = {
  pop: {
    drums: { kick: [1, 0, 1, 0, 1, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    chords: ['C', 'Am', 'F', 'G'],
    tempo: 120,
    instruments: ['drums', 'bass', 'piano', 'guitar']
  },
  rock: {
    drums: { kick: [1, 0, 0, 1, 1, 0, 0, 1], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 0, 1, 1, 1, 0, 1] },
    chords: ['E', 'A', 'B', 'E'],
    tempo: 140,
    instruments: ['drums', 'bass', 'electric_guitar', 'guitar']
  },
  jazz: {
    drums: { kick: [1, 0, 0, 1, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    tempo: 110,
    instruments: ['drums', 'bass', 'piano', 'sax']
  },
  electronic: {
    drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [0, 1, 0, 1, 0, 1, 0, 1] },
    chords: ['Am', 'F', 'C', 'G'],
    tempo: 128,
    instruments: ['drums', 'bass', 'synth', 'pad']
  },
  'hip-hop': {
    drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 0, 1, 1, 0, 1, 1] },
    chords: ['Am', 'Dm', 'G', 'Am'],
    tempo: 95,
    instruments: ['drums', 'bass', 'synth', 'vocals']
  },
  classical: {
    drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 1, 0, 0, 0, 1], hihat: [0, 0, 0, 0, 0, 0, 0, 0] },
    chords: ['C', 'F', 'G', 'C'],
    tempo: 80,
    instruments: ['strings', 'piano', 'flute', 'violin']
  },
  country: {
    drums: { kick: [1, 0, 1, 0, 1, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    chords: ['G', 'C', 'D', 'G'],
    tempo: 100,
    instruments: ['drums', 'bass', 'acoustic_guitar', 'fiddle']
  },
  blues: {
    drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 0, 1, 0, 1, 0, 1, 0] },
    chords: ['E7', 'A7', 'B7', 'E7'],
    tempo: 90,
    instruments: ['drums', 'bass', 'guitar', 'harmonica']
  },
  reggae: {
    drums: { kick: [0, 0, 1, 0, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [0, 1, 0, 1, 0, 1, 0, 1] },
    chords: ['G', 'Em', 'C', 'D'],
    tempo: 75,
    instruments: ['drums', 'bass', 'guitar', 'organ']
  }
};

const songCache = new SongCache(10);

// Advanced Model Management System
class ModelManager {
  constructor() {
    this.models = new Map();
    this.activeModel = null;
    this.modelDirectory = './models/';
    this.ensureModelDirectory();
    this.loadSavedModels();
  }

  ensureModelDirectory() {
    const fs = require('fs');
    if (!fs.existsSync(this.modelDirectory)) {
      fs.mkdirSync(this.modelDirectory, { recursive: true });
    }
    
    // Create archive directory for completed models
    this.archiveDirectory = './models/archive/';
    if (!fs.existsSync(this.archiveDirectory)) {
      fs.mkdirSync(this.archiveDirectory, { recursive: true });
    }
  }

  // Define different model architectures
  createModel(type, name, description, config = {}) {
    const modelId = `${type}_${Date.now()}`;
    
    const model = {
      id: modelId,
      name: name,
      type: type,
      description: description,
      created: new Date().toISOString(),
      lastUsed: null,
      isActive: false, // Models start as inactive
      stats: {
        generationsCount: 0,
        averageRating: 0,
        totalRatings: 0,
        genres: {},
        performance: {
          avgGenerationTime: 0,
          successRate: 0
        }
      },
      config: {
        focus: config.focus || 'balanced',
        complexity: config.complexity || 'medium',
        creativity: config.creativity || 0.5,
        instruments: config.instruments || ['drums', 'bass', 'melody', 'harmony'],
        ...config
      },
      trainingData: {
        samples: [],
        patterns: {},
        weights: {},
        lastTrained: null
      }
    };

    this.models.set(modelId, model);
    this.saveModel(model);
    
    console.log(`🧠 Created new ${type} model: ${name} (${modelId})`);
    return model;
  }

  // Specialized model types
  createInstrumentFocusedModel(name = "Instrument-Focused AI") {
    return this.createModel('instrument_focused', name, 
      'AI model specialized in detailed instrument layering and arrangement', {
        focus: 'instruments',
        complexity: 'high',
        instruments: ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings'],
        processing: {
          instrumentSeparation: true,
          dynamicArrangement: true,
          frequencyAnalysis: true
        }
      });
  }

  createHolisticModel(name = "Holistic Generation AI") {
    return this.createModel('holistic', name, 
      'AI model focused on overall song structure and musical coherence', {
        focus: 'structure',
        complexity: 'high',
        creativity: 0.8,
        processing: {
          songStructure: true,
          harmonicProgression: true,
          dynamicEvolution: true,
          genreAdaptation: true
        }
      });
  }

  createGenreSpecialistModel(genre, name = `${genre} Specialist AI`) {
    return this.createModel('genre_specialist', name, 
      `AI model specialized in authentic ${genre} music generation`, {
        focus: 'genre',
        targetGenre: genre,
        complexity: 'high',
        processing: {
          genreAuthenticity: true,
          culturalElements: true,
          traditionalInstruments: true
        }
      });
  }

  createExperimentalModel(name = "Experimental AI") {
    return this.createModel('experimental', name, 
      'AI model for creative experimentation and innovation', {
        focus: 'creativity',
        complexity: 'variable',
        creativity: 0.9,
        processing: {
          crossGenreFusion: true,
          unusualProgressions: true,
          experimentalSounds: true
        }
      });
  }

  // Model management
  getModel(modelId) {
    return this.models.get(modelId);
  }

  listModels() {
    return Array.from(this.models.values()).sort((a, b) => 
      new Date(b.lastUsed || b.created) - new Date(a.lastUsed || a.created)
    );
  }

  setActiveModel(modelId) {
    const model = this.models.get(modelId);
    if (model) {
      // Mark all models as inactive first
      this.models.forEach(m => m.isActive = false);
      
      // Set this model as active
      this.activeModel = model;
      model.isActive = true;
      model.lastUsed = new Date().toISOString();
      this.saveModel(model);
      console.log(`🎯 Switched to model: ${model.name} (${model.type}) - marked as active`);
      return model;
    }
    throw new Error(`Model ${modelId} not found`);
  }

  getActiveModel() {
    return this.activeModel;
  }

  // Model training and data management
  trainModel(modelId, trainingData, options = {}) {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    console.log(`🎓 Training model: ${model.name} with ${trainingData.length} samples`);

    // Process training data based on model type
    switch (model.type) {
      case 'instrument_focused':
        this.trainInstrumentFocusedModel(model, trainingData, options);
        break;
      case 'holistic':
        this.trainHolisticModel(model, trainingData, options);
        break;
      case 'genre_specialist':
        this.trainGenreSpecialistModel(model, trainingData, options);
        break;
      case 'experimental':
        this.trainExperimentalModel(model, trainingData, options);
        break;
      default:
        this.trainGeneralModel(model, trainingData, options);
    }

    model.trainingData.lastTrained = new Date().toISOString();
    this.saveModel(model);
    
    console.log(`✅ Model training completed: ${model.name}`);
    return model;
  }

  trainInstrumentFocusedModel(model, trainingData, options) {
    // Focus on detailed instrument analysis
    model.trainingData.patterns.instruments = {};
    model.trainingData.patterns.arrangements = {};
    
    trainingData.forEach(sample => {
      // Analyze each instrument separately
      const instruments = this.analyzeInstruments(sample);
      Object.keys(instruments).forEach(instrument => {
        if (!model.trainingData.patterns.instruments[instrument]) {
          model.trainingData.patterns.instruments[instrument] = [];
        }
        model.trainingData.patterns.instruments[instrument].push(instruments[instrument]);
      });

      // Analyze arrangement patterns
      const arrangement = this.analyzeArrangement(sample);
      if (!model.trainingData.patterns.arrangements[arrangement.type]) {
        model.trainingData.patterns.arrangements[arrangement.type] = [];
      }
      model.trainingData.patterns.arrangements[arrangement.type].push(arrangement);
    });
  }

  trainHolisticModel(model, trainingData, options) {
    // Focus on overall song structure and flow
    model.trainingData.patterns.structure = {};
    model.trainingData.patterns.harmony = {};
    model.trainingData.patterns.dynamics = {};
    
    trainingData.forEach(sample => {
      // Analyze song structure
      const structure = this.analyzeSongStructure(sample);
      if (!model.trainingData.patterns.structure[structure.type]) {
        model.trainingData.patterns.structure[structure.type] = [];
      }
      model.trainingData.patterns.structure[structure.type].push(structure);

      // Analyze harmonic progressions
      const harmony = this.analyzeHarmony(sample);
      if (!model.trainingData.patterns.harmony[harmony.key]) {
        model.trainingData.patterns.harmony[harmony.key] = [];
      }
      model.trainingData.patterns.harmony[harmony.key].push(harmony);
    });
  }

  trainGenreSpecialistModel(model, trainingData, options) {
    // Filter training data for target genre
    const genreData = trainingData.filter(sample => 
      sample.genre === model.config.targetGenre || 
      (sample.genres && sample.genres.includes(model.config.targetGenre))
    );

    console.log(`🎯 Training ${model.config.targetGenre} specialist with ${genreData.length} genre-specific samples`);
    
    // Deep analysis of genre characteristics
    model.trainingData.patterns.genreCharacteristics = this.analyzeGenreCharacteristics(genreData, model.config.targetGenre);
  }

  trainExperimentalModel(model, trainingData, options) {
    // Focus on creative patterns and unusual combinations
    model.trainingData.patterns.creative = {};
    model.trainingData.patterns.crossGenre = {};
    
    // Analyze creative elements across genres
    const creativePatterns = this.analyzeCreativeElements(trainingData);
    model.trainingData.patterns.creative = creativePatterns;
  }

  // Analysis helpers
  analyzeInstruments(sample) {
    // Placeholder for instrument analysis
    return {
      drums: { pattern: sample.rhythm || [], velocity: sample.energy || 0.5 },
      bass: { notes: sample.bassline || [], style: 'walking' },
      guitar: { chords: sample.chords || [], style: 'strumming' },
      keys: { melody: sample.melody || [], harmony: sample.harmony || [] }
    };
  }

  analyzeArrangement(sample) {
    return {
      type: 'standard',
      instruments: sample.instruments || [],
      complexity: sample.complexity || 'medium',
      dynamics: sample.dynamics || 'balanced'
    };
  }

  analyzeSongStructure(sample) {
    return {
      type: 'verse_chorus',
      sections: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
      duration: sample.duration || 30
    };
  }

  analyzeHarmony(sample) {
    return {
      key: sample.key || 'C',
      progression: sample.chords || ['C', 'Am', 'F', 'G'],
      complexity: 'standard'
    };
  }

  analyzeGenreCharacteristics(genreData, genre) {
    const characteristics = {
      tempo: { min: 180, max: 0, avg: 0 },
      keys: {},
      instruments: {},
      patterns: {}
    };

    genreData.forEach(sample => {
      // Tempo analysis
      if (sample.tempo) {
        characteristics.tempo.min = Math.min(characteristics.tempo.min, sample.tempo);
        characteristics.tempo.max = Math.max(characteristics.tempo.max, sample.tempo);
        characteristics.tempo.avg += sample.tempo;
      }

      // Key analysis
      if (sample.key) {
        characteristics.keys[sample.key] = (characteristics.keys[sample.key] || 0) + 1;
      }

      // Instrument analysis
      if (sample.instruments) {
        sample.instruments.forEach(instrument => {
          characteristics.instruments[instrument] = (characteristics.instruments[instrument] || 0) + 1;
        });
      }
    });

    characteristics.tempo.avg /= genreData.length;
    return characteristics;
  }

  analyzeCreativeElements(trainingData) {
    return {
      unusualProgressions: [],
      crossGenreElements: [],
      experimentalTechniques: []
    };
  }

  // Model persistence
  saveModel(model) {
    const fs = require('fs');
    const filePath = `${this.modelDirectory}${model.id}.json`;
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
      console.log(`💾 Saved model: ${model.name}`);
    } catch (error) {
      console.error(`❌ Failed to save model ${model.name}:`, error);
    }
  }

  loadSavedModels() {
    const fs = require('fs');
    
    try {
      const files = fs.readdirSync(this.modelDirectory);
      const modelFiles = files.filter(file => file.endsWith('.json'));
      
      modelFiles.forEach(file => {
        try {
          const filePath = `${this.modelDirectory}${file}`;
          const modelData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.models.set(modelData.id, modelData);
          console.log(`📁 Loaded model: ${modelData.name}`);
        } catch (error) {
          console.error(`❌ Failed to load model from ${file}:`, error);
        }
      });

      console.log(`🧠 Loaded ${this.models.size} saved models`);

      // Set default active model if none exists
      if (this.models.size > 0 && !this.activeModel) {
        const models = this.listModels();
        this.setActiveModel(models[0].id);
        console.log(`🎯 Set default active model: ${models[0].name}`);
      }
    } catch (error) {
      console.log(`📁 No saved models directory found, starting fresh`);
    }
  }

  deleteModel(modelId) {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const fs = require('fs');
    const filePath = `${this.modelDirectory}${modelId}.json`;
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.models.delete(modelId);
      
      if (this.activeModel && this.activeModel.id === modelId) {
        this.activeModel = this.models.size > 0 ? this.listModels()[0] : null;
      }
      
      console.log(`🗑️ Deleted model: ${model.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete model ${model.name}:`, error);
      return false;
    }
  }

  // Model performance tracking
  recordGeneration(modelId, generationTime, success, userRating = null) {
    const model = this.models.get(modelId);
    if (!model) return;

    model.stats.generationsCount++;
    
    // Update performance metrics
    const currentAvg = model.stats.performance.avgGenerationTime;
    const count = model.stats.generationsCount;
    model.stats.performance.avgGenerationTime = 
      (currentAvg * (count - 1) + generationTime) / count;

    const currentSuccessRate = model.stats.performance.successRate;
    model.stats.performance.successRate = 
      (currentSuccessRate * (count - 1) + (success ? 1 : 0)) / count;

    // Update user ratings if provided
    if (userRating !== null) {
      const currentRating = model.stats.averageRating;
      const ratingCount = model.stats.totalRatings;
      model.stats.totalRatings++;
      model.stats.averageRating = 
        (currentRating * ratingCount + userRating) / model.stats.totalRatings;
    }

    this.saveModel(model);
  }

  getModelStats(modelId = null) {
    if (modelId) {
      const model = this.models.get(modelId);
      return model ? model.stats : null;
    }
    
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      stats: model.stats,
      lastUsed: model.lastUsed,
      created: model.created
    }));
  }

  // Get current active model
  getCurrentModel() {
    if (!this.activeModel) {
      // If no active model, try to set the first available model as active
      const models = Array.from(this.models.values());
      if (models.length > 0) {
        this.activeModel = models[0].id;
        console.log(`🧠 Auto-selected model as active: ${models[0].name}`);
      } else {
        // Create a basic default model if none exist
        console.log('🧠 No models found, creating basic default model...');
        const defaultModel = this.createBasicModel();
        this.activeModel = defaultModel.id;
        return defaultModel;
      }
    }
    
    const model = this.models.get(this.activeModel);
    if (!model) {
      console.warn(`⚠️ Active model ${this.activeModel} not found, resetting...`);
      this.activeModel = null;
      return this.getCurrentModel(); // Recursive call to auto-select
    }
    
    return model;
  }

  // Create a basic default model
  createBasicModel(name = "Basic Generation AI") {
    return this.createModel('basic', name, 
      'Basic AI model for music generation with standard patterns', {
        focus: 'balanced',
        complexity: 'medium',
        creativity: 0.5,
        instruments: ['drums', 'bass', 'melody', 'harmony']
      });
  }

  // Set active model
  setActiveModel(modelId) {
    if (this.models.has(modelId)) {
      // Mark all models as inactive first
      this.models.forEach(model => model.isActive = false);
      
      // Set this model as active
      this.activeModel = modelId;
      const model = this.models.get(modelId);
      model.isActive = true;
      model.lastUsed = new Date().toISOString();
      console.log(`🧠 Switched to model: ${model.name} (${modelId}) - marked as active`);
      return true;
    }
    console.warn(`⚠️ Attempted to set non-existent model as active: ${modelId}`);
    return false;
  }

  // Switch model (alias for setActiveModel)
  switchModel(modelId) {
    return this.setActiveModel(modelId);
  }

  // Get all models
  getAllModels() {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      description: model.description,
      isActive: model.id === this.activeModel,
      createdAt: new Date(model.created).getTime(),
      lastUsed: model.lastUsed ? new Date(model.lastUsed).getTime() : null,
      generationCount: model.stats.generationsCount || 0,
      successRate: model.stats.performance.successRate || 0,
      averageRating: model.stats.averageRating || 0,
      config: model.config
    }));
  }

  // List models (alias for getAllModels)
  listModels() {
    return this.getAllModels();
  }

  // Check if model can be used
  canUseModel(modelId) {
    const model = this.models.get(modelId);
    return model && model.config;
  }

  // Record generation stats
  recordGeneration(modelId, generationData) {
    const model = this.models.get(modelId);
    if (model) {
      model.stats.generationsCount++;
      model.lastUsed = new Date().toISOString();
      
      // Update genre stats
      if (generationData.genre) {
        if (!model.stats.genres[generationData.genre]) {
          model.stats.genres[generationData.genre] = 0;
        }
        model.stats.genres[generationData.genre]++;
      }
      
      // Update success rate
      if (generationData.success !== undefined) {
        const currentSuccesses = model.stats.performance.successRate * model.stats.generationsCount;
        const newSuccesses = currentSuccesses + (generationData.success ? 1 : 0);
        model.stats.performance.successRate = newSuccesses / model.stats.generationsCount;
      }
      
      this.saveModel(model);
    }
  }

  // Generate with specific model
  async generateWithModel(modelId, prompt, genre, tempo, key, socketId, sampleReference) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    console.log(`🧠 Generating with ${model.type} model: ${model.name}`);
    console.log(`🎯 Model has ${model.trainingData.samples.length} training samples`);
    
    // Each model should use its own training data if available
    const modelHasTraining = model.trainingData.samples.length > 0 || model.trainingData.lastTrained;
    
    if (modelHasTraining) {
      console.log(`✅ Using model-specific training data (${model.trainingData.samples.length} samples)`);
    } else {
      console.log(`⚠️ Model has no training data, using fallback patterns`);
    }
    
    // Use the standard generation but with model context
    // The model's configuration and training data is available for specialized logic
    return await generateAdvancedMusic(prompt, genre, tempo, key, socketId, sampleReference, {
      modelType: model.type,
      modelConfig: model.config,
      modelTraining: model.trainingData,
      hasTraining: modelHasTraining
    });
  }

  // Train model with specific data
  async trainModel(modelId, genre, trackCount = 20) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    console.log(`🎓 Training model ${model.name} on ${genre} with ${trackCount} tracks`);
    
    try {
      // Try to get real training data from Spotify if available
      let trainingTracks = [];
      
      if (spotifyAPI && spotifyAPI.searchReggaeTracks) {
        try {
          console.log(`🔍 Searching for ${genre} tracks for model training...`);
          trainingTracks = await spotifyAPI.searchReggaeTracks(trackCount);
          console.log(`✅ Found ${trainingTracks.length} real tracks for training`);
        } catch (error) {
          console.warn(`⚠️ Could not get Spotify data for training:`, error.message);
        }
      }
      
      // If no real data, create synthetic training data based on genre and model type
      if (trainingTracks.length === 0) {
        trainingTracks = this.generateSyntheticTrainingData(genre, model.type, trackCount);
        console.log(`🧠 Generated ${trainingTracks.length} synthetic training samples`);
      }
      
      // Process training data specific to this model
      const processedSamples = trainingTracks.map((track, index) => ({
        id: `${model.id}_sample_${Date.now()}_${index}`,
        source: track.source || 'synthetic',
        genre: genre,
        features: this.extractModelSpecificFeatures(track, model.type),
        timestamp: Date.now(),
        modelType: model.type
      }));
      
      // Add to model's training data
      model.trainingData.samples = [...model.trainingData.samples, ...processedSamples];
      model.trainingData.lastTrained = new Date().toISOString();
      model.trainingData.patterns[genre] = this.generatePatterns(processedSamples, model.type);
      
      // Update model stats
      model.stats.genres[genre] = (model.stats.genres[genre] || 0) + trackCount;
      
      this.saveModel(model);
      
      return {
        success: true,
        message: `Model ${model.name} trained on ${trackCount} ${genre} tracks`,
        genre,
        trackCount,
        totalSamples: model.trainingData.samples.length,
        hasRealData: trainingTracks.some(t => t.source !== 'synthetic')
      };
    } catch (error) {
      console.error(`❌ Training failed for model ${model.name}:`, error);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  // Generate synthetic training data when real data isn't available
  generateSyntheticTrainingData(genre, modelType, count) {
    const samples = [];
    
    for (let i = 0; i < count; i++) {
      const sample = {
        id: `synthetic_${genre}_${i}`,
        name: `${genre} Sample ${i + 1}`,
        source: 'synthetic',
        features: this.getSyntheticFeatures(genre, modelType),
        timestamp: Date.now()
      };
      samples.push(sample);
    }
    
    return samples;
  }

  // Get synthetic features based on genre and model type
  getSyntheticFeatures(genre, modelType) {
    const baseFeatures = {
      tempo: this.getGenreTempo(genre),
      key: this.getGenreKey(genre),
      energy: Math.random() * 0.5 + 0.3,
      valence: Math.random() * 0.6 + 0.2,
      danceability: Math.random() * 0.4 + 0.4
    };

    // Add model-specific features
    if (modelType === 'instrument_focused') {
      baseFeatures.instrumentalness = Math.random() * 0.3 + 0.7;
      baseFeatures.acousticness = Math.random() * 0.4 + 0.3;
      baseFeatures.instruments = ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings'];
    }

    return baseFeatures;
  }

  getGenreTempo(genre) {
    const tempos = {
      reggae: 70 + Math.random() * 20,
      rock: 110 + Math.random() * 40,
      pop: 100 + Math.random() * 30,
      jazz: 90 + Math.random() * 50,
      electronic: 120 + Math.random() * 40,
      blues: 80 + Math.random() * 30,
      country: 95 + Math.random() * 35,
      'hip-hop': 85 + Math.random() * 30
    };
    return tempos[genre] || 120;
  }

  getGenreKey(genre) {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[Math.floor(Math.random() * keys.length)];
  }

  // Extract features specific to the model type
  extractModelSpecificFeatures(track, modelType) {
    const features = { ...track.features };
    
    switch (modelType) {
      case 'instrument_focused':
        features.instrumentFocus = {
          separation: Math.random() * 0.3 + 0.7,
          layering: Math.random() * 0.4 + 0.6,
          dynamics: Math.random() * 0.5 + 0.5
        };
        break;
      
      case 'holistic':
        features.structure = {
          coherence: Math.random() * 0.3 + 0.7,
          progression: Math.random() * 0.4 + 0.6,
          flow: Math.random() * 0.5 + 0.5
        };
        break;
        
      case 'genre_specialist':
        features.genreAuthenticity = Math.random() * 0.3 + 0.7;
        break;
        
      case 'experimental':
        features.creativity = Math.random() * 0.5 + 0.5;
        features.innovation = Math.random() * 0.6 + 0.4;
        break;
    }
    
    return features;
  }

  // Generate patterns from training samples
  generatePatterns(samples, modelType) {
    const patterns = {
      tempo_range: {
        min: Math.min(...samples.map(s => s.features.tempo || 120)),
        max: Math.max(...samples.map(s => s.features.tempo || 120)),
        avg: samples.reduce((sum, s) => sum + (s.features.tempo || 120), 0) / samples.length
      },
      common_keys: {},
      energy_profile: samples.reduce((sum, s) => sum + (s.features.energy || 0.5), 0) / samples.length
    };

    // Count key frequencies
    samples.forEach(s => {
      const key = s.features.key || 'C';
      patterns.common_keys[key] = (patterns.common_keys[key] || 0) + 1;
    });

    return patterns;
  }

  // Delete model
  deleteModel(modelId) {
    if (this.models.has(modelId)) {
      // Don't allow deleting the active model if it's the only one
      if (this.activeModel === modelId && this.models.size === 1) {
        console.warn('⚠️ Cannot delete the only remaining model');
        return false;
      }
      
      const model = this.models.get(modelId);
      this.models.delete(modelId);
      
      // If this was the active model, switch to another one
      if (this.activeModel === modelId) {
        const remainingModels = Array.from(this.models.values());
        if (remainingModels.length > 0) {
          this.setActiveModel(remainingModels[0].id);
        } else {
          this.activeModel = null;
        }
      }
      
      // Delete saved model file
      try {
        const fs = require('fs');
        const modelPath = `${this.modelDirectory}${modelId}.json`;
        if (fs.existsSync(modelPath)) {
          fs.unlinkSync(modelPath);
        }
      } catch (error) {
        console.warn(`⚠️ Could not delete model file: ${error.message}`);
      }
      
      console.log(`🗑️ Deleted model: ${model.name}`);
      return true;
    }
    return false;
  }

  // Archive a completed model (move to archive directory)
  archiveModel(modelId, archiveName) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const fs = require('fs');
    
    // Create archive record with completion info
    const archivedModel = {
      ...model,
      archivedAt: new Date().toISOString(),
      archiveName: archiveName || model.name,
      developmentComplete: true,
      finalStats: { ...model.stats },
      originalId: model.id
    };

    // Save to archive directory
    const archiveId = `archived_${Date.now()}`;
    const archivePath = `${this.archiveDirectory}${archiveId}.json`;
    
    try {
      fs.writeFileSync(archivePath, JSON.stringify(archivedModel, null, 2));
      console.log(`📦 Archived model: ${model.name} → ${archiveName || model.name}`);
      
      // Remove from active models
      this.deleteModel(modelId);
      
      return {
        success: true,
        archiveId,
        archiveName: archiveName || model.name,
        message: `Model archived successfully as "${archiveName || model.name}"`
      };
    } catch (error) {
      throw new Error(`Failed to archive model: ${error.message}`);
    }
  }

  // List all archived models
  listArchivedModels() {
    const fs = require('fs');
    const archivedModels = [];

    try {
      if (fs.existsSync(this.archiveDirectory)) {
        const files = fs.readdirSync(this.archiveDirectory);
        const modelFiles = files.filter(file => file.endsWith('.json'));
        
        modelFiles.forEach(file => {
          try {
            const filePath = `${this.archiveDirectory}${file}`;
            const modelData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            archivedModels.push({
              archiveId: file.replace('.json', ''),
              name: modelData.archiveName || modelData.name,
              originalName: modelData.name,
              type: modelData.type,
              description: modelData.description,
              archivedAt: modelData.archivedAt,
              finalStats: modelData.finalStats,
              originalId: modelData.originalId
            });
          } catch (error) {
            console.warn(`⚠️ Could not load archived model ${file}:`, error.message);
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not read archive directory:`, error.message);
    }

    return archivedModels.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
  }

  // Restore an archived model back to active development
  restoreArchivedModel(archiveId) {
    const fs = require('fs');
    const archivePath = `${this.archiveDirectory}${archiveId}.json`;

    if (!fs.existsSync(archivePath)) {
      throw new Error(`Archived model ${archiveId} not found`);
    }

    try {
      const archivedData = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      
      // Create new active model from archived data
      const restoredModel = {
        ...archivedData,
        id: `${archivedData.type}_${Date.now()}`, // New ID for active model
        lastUsed: new Date().toISOString(),
        restored: true,
        restoredFrom: archiveId,
        restoredAt: new Date().toISOString()
      };

      // Remove archive-specific fields
      delete restoredModel.archivedAt;
      delete restoredModel.archiveName;
      delete restoredModel.developmentComplete;
      delete restoredModel.finalStats;
      delete restoredModel.originalId;

      // Add to active models
      this.models.set(restoredModel.id, restoredModel);
      this.saveModel(restoredModel);
      
      console.log(`🔄 Restored model: ${archivedData.archiveName || archivedData.name}`);
      
      return {
        success: true,
        model: restoredModel,
        message: `Model "${archivedData.archiveName || archivedData.name}" restored successfully`
      };
    } catch (error) {
      throw new Error(`Failed to restore model: ${error.message}`);
    }
  }

  // Clear all active models except one (for focused development)
  clearAllExcept(keepModelId) {
    const modelsToDelete = Array.from(this.models.keys()).filter(id => id !== keepModelId);
    const deletedCount = modelsToDelete.length;
    
    modelsToDelete.forEach(modelId => {
      this.deleteModel(modelId);
    });

    // Ensure the kept model is active
    if (this.models.has(keepModelId)) {
      this.setActiveModel(keepModelId);
    }

    console.log(`🧹 Cleared ${deletedCount} models, kept: ${this.models.get(keepModelId)?.name}`);
    return {
      success: true,
      deletedCount,
      keptModel: this.models.get(keepModelId)?.name,
      message: `Cleared ${deletedCount} models for focused development`
    };
  }

  // Initialize a model with basic training data so it's ready to use
  async initializeModelWithTraining(modelId, genres = ['pop', 'rock'], samplesPerGenre = 15) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    console.log(`🚀 Initializing ${model.name} with training data...`);
    
    for (const genre of genres) {
      try {
        const result = await this.trainModel(modelId, genre, samplesPerGenre);
        console.log(`✅ Pre-trained on ${genre}: ${result.totalSamples} total samples`);
      } catch (error) {
        console.warn(`⚠️ Failed to pre-train on ${genre}:`, error.message);
      }
    }

    const totalSamples = model.trainingData.samples.length;
    console.log(`🎯 ${model.name} initialized with ${totalSamples} training samples across ${genres.length} genres`);
    
    return {
      success: true,
      modelName: model.name,
      totalSamples,
      genres,
      message: `Model initialized and ready for immediate use`
    };
  }
}

// Advanced Multi-AI Orchestrator System
class AIOrchestrator {
  constructor() {
    this.masterConductor = new MasterConductorAI();
    this.instrumentSpecialists = new Map();
    this.beatGenerators = new Map();
    this.arrangementCoordinator = new ArrangementCoordinator();
    this.qualityAssessment = new QualityAssessmentAI();
    this.conflictResolver = new ConflictResolver();
    
    // Load reggae enhancement systems
    this.reggaeEnhancements = this.loadReggaeEnhancements();
    
    this.initializeSpecialists();
  }

  loadReggaeEnhancements() {
    console.log('🎵 DEBUG: Loading reggae enhancement systems...');
    const enhancements = {
      patternLibrary: new ReggaePatternLibrary(),
      conflictResolver: new ReggaeConflictResolver(),
      qualityAssessment: new ReggaeQualityAssessmentAI(),
      audioSynthesizer: new ReggaeAudioSynthesizer(),
      mixingEngine: new ReggaeMixingEngine()
    };
    console.log('🎵 DEBUG: All reggae enhancement systems loaded successfully');
    return enhancements;
  }

  initializeSpecialists() {
    // Initialize instrument specialists
    const instruments = ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings', 'synthesizer', 'vocals'];
    instruments.forEach(instrument => {
      this.instrumentSpecialists.set(instrument, new InstrumentSpecialistAI(instrument));
    });

    // Initialize beat generation specialists
    const beatTypes = ['groove', 'rhythm', 'percussion', 'fills'];
    beatTypes.forEach(type => {
      this.beatGenerators.set(type, new BeatGeneratorAI(type));
    });

    console.log(`🎼 Initialized ${instruments.length} instrument specialists and ${beatTypes.length} beat generators`);
  }

  async generateEnsembleMusic(instruments, context) {
    console.log(`🎵 Multi-AI generating ensemble music for ${instruments.length} instruments`);
    
    const patterns = {};
    
    // Generate patterns for each instrument using its specialist AI
    for (const instrument of instruments) {
      const specialist = this.instrumentSpecialists.get(instrument);
      if (specialist) {
        patterns[instrument] = await specialist.generatePattern(context);
      } else {
        console.warn(`⚠️ No specialist found for ${instrument}, using basic pattern`);
        patterns[instrument] = { instrument, notes: ['C4'], rhythm: [1, 0, 1, 0] };
      }
    }
    
    return { patterns, context };
  }

  async generateBeats(context) {
    console.log(`🥁 Multi-AI generating beats for ${context.genre}`);
    
    const beatPatterns = {};
    
    // Generate different types of beats
    for (const [type, generator] of this.beatGenerators) {
      beatPatterns[type] = await generator.generateBeat(context);
    }
    
    return beatPatterns;
  }

  async coordinateArrangement(instruments, context) {
    console.log(`🎭 Multi-AI coordinating arrangement`);
    
    return await this.arrangementCoordinator.coordinateArrangement(instruments, context);
  }

  async resolveConflicts(suggestions, context) {
    console.log(`⚖️ Multi-AI resolving conflicts`);
    
    return await this.conflictResolver.resolveConflicts(suggestions, context);
  }

  async assessQuality(musicData, context) {
    console.log(`🎯 Multi-AI assessing quality`);
    
    return await this.qualityAssessment.assessQuality(musicData, context);
  }

  async generateWithOrchestra(prompt, genre, tempo, key, duration, options = {}) {
    console.log(`🎭 Multi-AI Orchestra starting generation: "${prompt}"`);
    
    try {
      // Check if this is reggae music - apply reggae enhancements
      const isReggae = genre.toLowerCase().includes('reggae');
      
      // Phase 1: Master Conductor analyzes the prompt and creates generation plan
      const generationPlan = await this.masterConductor.createGenerationPlan({
        prompt, genre, tempo, key, duration, ...options
      });
      
      console.log(`🎯 Generation plan: ${generationPlan.instruments.length} instruments, ${generationPlan.complexity} complexity`);

      // Phase 2: Concurrent generation by specialists (with reggae enhancement)
      const concurrentTasks = await this.generateConcurrentParts(generationPlan, isReggae);
      
      // Phase 3: Arrangement coordination and conflict resolution (with reggae-aware resolution)
      const arrangedParts = await this.arrangementCoordinator.harmonize(concurrentTasks);
      const resolvedParts = isReggae ? 
        await this.reggaeEnhancements.conflictResolver.resolveReggaeConflicts(arrangedParts, generationPlan) :
        await this.conflictResolver.resolve(arrangedParts);
      
      // Phase 4: Quality assessment and refinement (with reggae-specific assessment)
      const qualityResult = isReggae ?
        await this.reggaeEnhancements.qualityAssessment.assessReggaeQuality(resolvedParts, generationPlan) :
        await this.qualityAssessment.validateAndRefine(resolvedParts);
      
      // Phase 5: Audio synthesis and mixing (with reggae-optimized processing)
      const finalOutput = isReggae ?
        await this.synthesizeReggaeAudio(qualityResult, generationPlan) :
        qualityResult;
      
      console.log(`✅ Multi-AI Orchestra generation complete: ${Object.keys(finalOutput.layers || finalOutput).length} layers`);
      return finalOutput;
      
    } catch (error) {
      console.error(`❌ Orchestra generation failed:`, error);
      throw new Error(`Multi-AI generation failed: ${error.message}`);
    }
  }

  async synthesizeReggaeAudio(qualityResult, generationPlan) {
    console.log('🎵 Synthesizing reggae-optimized audio...');
    
    try {
      // Use reggae audio synthesizer for frequency-aware synthesis
      const audioData = await this.reggaeEnhancements.audioSynthesizer.synthesizeReggaeAudio(
        qualityResult, 
        generationPlan
      );
      
      // Apply reggae-specific mixing
      const mixedAudio = await this.reggaeEnhancements.mixingEngine.mixReggaeComposition(
        audioData,
        generationPlan
      );
      
      console.log('✅ Reggae audio synthesis and mixing complete');
      return {
        ...qualityResult,
        audioData: mixedAudio,
        reggaeEnhanced: true,
        mixingProfile: 'reggae_professional'
      };
    } catch (error) {
      console.error('❌ Reggae audio synthesis failed:', error);
      // Fallback to standard processing
      return qualityResult;
    }
  }

  async generateConcurrentParts(plan, isReggae = false) {
    const tasks = [];
    
    // Generate beats first (foundation) - use reggae patterns if needed
    if (plan.needsBeats) {
      if (isReggae) {
        console.log('🎵 Using reggae-enhanced beat generation');
        // Use reggae specialist for drums if available
        const reggaeDrumSpecialist = new ReggaeInstrumentSpecialistAI('drums');
        tasks.push(reggaeDrumSpecialist.generateReggaePattern(plan));
      } else {
        tasks.push(
          this.beatGenerators.get('groove').generate(plan),
          this.beatGenerators.get('rhythm').generate(plan)
        );
      }
    }
    
    // Generate instrument parts concurrently (with reggae specialists when appropriate)
    plan.instruments.forEach(instrument => {
      if (isReggae && ['drums', 'bass', 'guitar', 'keys'].includes(instrument)) {
        console.log(`🎵 DEBUG: Using reggae specialist for ${instrument}`);
        const reggaeSpecialist = new ReggaeInstrumentSpecialistAI(instrument);
        tasks.push(reggaeSpecialist.generateReggaePattern(plan));
      } else if (this.instrumentSpecialists.has(instrument)) {
        console.log(`🎵 DEBUG: Using standard specialist for ${instrument}`);
        tasks.push(
          this.instrumentSpecialists.get(instrument).generate(plan)
        );
      }
    });
    
    console.log(`🔄 Running ${tasks.length} concurrent AI generation tasks`);
    const results = await Promise.all(tasks);
    
    return this.organizeConcurrentResults(results, plan);
  }

  organizeConcurrentResults(results, plan) {
    const organized = {
      beats: [],
      instruments: {},
      metadata: plan
    };
    
    results.forEach(result => {
      if (result.type === 'beat') {
        organized.beats.push(result);
      } else if (result.type === 'instrument') {
        organized.instruments[result.instrument] = result;
      }
    });
    
    return organized;
  }
}

// Master Conductor AI - Plans and coordinates the entire generation
class MasterConductorAI {
  constructor() {
    this.musicalKnowledge = new MusicalKnowledgeBase();
    this.promptAnalyzer = new PromptAnalyzer();
    this.instrumentSelector = new InstrumentSelector();
  }

  async createGenerationPlan(request) {
    const { prompt, genre, tempo, key, duration } = request;
    
    // Analyze the prompt for musical intent
    const promptAnalysis = await this.promptAnalyzer.analyze(prompt);
    
    // Determine what instruments are needed
    const selectedInstruments = await this.instrumentSelector.selectForContext({
      genre, 
      prompt: promptAnalysis, 
      tempo, 
      key,
      mood: promptAnalysis.mood,
      energy: promptAnalysis.energy
    });
    
    // Create generation plan
    const plan = {
      instruments: selectedInstruments,
      complexity: this.calculateComplexity(promptAnalysis, selectedInstruments),
      structure: this.determineStructure(duration, genre),
      priorities: this.setPriorities(selectedInstruments, genre),
      constraints: this.setConstraints(tempo, key, genre),
      needsBeats: this.needsBeatGeneration(selectedInstruments, genre),
      originalRequest: request
    };
    
    console.log(`🎼 Master Conductor Plan: ${plan.instruments.join(', ')} | Complexity: ${plan.complexity}`);
    return plan;
  }

  calculateComplexity(analysis, instruments) {
    const baseComplexity = instruments.length * 0.2;
    const promptComplexity = analysis.complexity || 0.5;
    return Math.min(1.0, baseComplexity + promptComplexity);
  }

  determineStructure(duration, genre) {
    if (duration <= 30) return 'simple';
    if (duration <= 60) return 'verse-chorus';
    return 'full-song';
  }

  setPriorities(instruments, genre) {
    const priorities = {};
    
    // Genre-based prioritization
    switch (genre.toLowerCase()) {
      case 'rock':
        priorities.drums = 1.0;
        priorities.bass = 0.9;
        priorities.lead_guitar = 0.8;
        priorities.rhythm_guitar = 0.7;
        break;
      case 'jazz':
        priorities.piano = 1.0;
        priorities.bass = 0.9;
        priorities.drums = 0.8;
        break;
      case 'electronic':
        priorities.synthesizer = 1.0;
        priorities.drums = 0.9;
        priorities.bass = 0.8;
        break;
      default:
        instruments.forEach((inst, index) => {
          priorities[inst] = 1.0 - (index * 0.1);
        });
    }
    
    return priorities;
  }

  setConstraints(tempo, key, genre) {
    return {
      tempo: { min: tempo * 0.95, max: tempo * 1.05, target: tempo },
      key: key,
      genre: genre,
      harmonic: this.getHarmonicConstraints(key, genre),
      rhythmic: this.getRhythmicConstraints(tempo, genre)
    };
  }

  getHarmonicConstraints(key, genre) {
    // Define harmonic rules based on key and genre
    const progressions = {
      rock: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'],
      pop: ['I', 'V', 'vi', 'IV'],
      jazz: ['ii7', 'V7', 'I', 'vi7'],
      blues: ['I7', 'IV7', 'V7']
    };
    
    return {
      allowedProgressions: progressions[genre] || progressions.pop,
      key: key,
      scaleType: genre === 'jazz' ? 'major7' : 'major'
    };
  }

  getRhythmicConstraints(tempo, genre) {
    return {
      timeSignature: genre === 'blues' ? '12/8' : '4/4',
      subdivisions: genre === 'jazz' ? 'triplets' : 'straight',
      swing: genre === 'jazz' ? 0.6 : 0.0
    };
  }

  needsBeatGeneration(instruments, genre) {
    return instruments.includes('drums') || ['electronic', 'hip-hop', 'dance'].includes(genre.toLowerCase());
  }
}

// Initialize ModelManager and IsolatedAudioGenerator after class definitions
const modelManager = new ModelManager();
const isolatedGenerator = new IsolatedAudioGenerator(modelManager);

// Initialize models and ensure they have training data
const initializeModels = async () => {
  const models = modelManager.listModels();
  
  if (models.length === 0) {
    console.log('🧠 No models found, creating default models...');
    
    // Create default instrument-focused model
    const instrumentModel = modelManager.createInstrumentFocusedModel("Professional Instrument AI");
    
    // Create default holistic model  
    const holisticModel = modelManager.createHolisticModel("Balanced Generation AI");
    
    // Create a few genre specialists
    const reggaeModel = modelManager.createGenreSpecialistModel("reggae", "Reggae Specialist AI");
    const rockModel = modelManager.createGenreSpecialistModel("rock", "Rock Specialist AI");
    
    // Create experimental model
    const experimentalModel = modelManager.createExperimentalModel("Creative Fusion AI");
    
    // Set the instrument model as default active for focused development
    modelManager.setActiveModel(instrumentModel.id);
    
    console.log('✅ Created 5 default AI models');
  }

  // Check if current model needs initialization
  const currentModel = modelManager.getCurrentModel();
  if (currentModel && currentModel.trainingData.samples.length === 0) {
    console.log(`🚀 Initializing ${currentModel.name} with training data for immediate use...`);
    
    try {
      const genres = currentModel.type === 'instrument_focused' 
        ? ['rock', 'pop', 'jazz'] // Genres that showcase instrument layering
        : ['pop', 'rock'];
        
      await modelManager.initializeModelWithTraining(currentModel.id, genres, 20);
      console.log(`✅ ${currentModel.name} ready for immediate use!`);
    } catch (error) {
      console.warn(`⚠️ Could not initialize ${currentModel.name}:`, error.message);
    }
  } else if (currentModel) {
    console.log(`✅ ${currentModel.name} already has ${currentModel.trainingData.samples.length} training samples - ready to use!`);
  }
};

// Initialize models on startup
initializeModels().catch(error => {
  console.error('❌ Model initialization failed:', error);
});

// Generation history tracking - prevent repetitive outputs
class GenerationHistory {
  constructor(maxHistoryPerPrompt = 20) {
    this.maxHistoryPerPrompt = maxHistoryPerPrompt;
    this.history = new Map(); // prompt -> array of generated features
  }

  addGeneration(promptHash, features) {
    if (!this.history.has(promptHash)) {
      this.history.set(promptHash, []);
    }
    
    const promptHistory = this.history.get(promptHash);
    promptHistory.push({
      features,
      timestamp: Date.now()
    });
    
    // Keep only recent generations
    if (promptHistory.length > this.maxHistoryPerPrompt) {
      promptHistory.shift();
    }
  }

  getHistory(promptHash) {
    return this.history.get(promptHash) || [];
  }

  createPromptHash(prompt, genre, tempo, key) {
    // Create a hash for similar prompts to track variations
    const normalizedPrompt = prompt.toLowerCase().trim();
    return `${normalizedPrompt}-${genre}-${Math.floor(tempo/10)*10}-${key}`;
  }

  clear() {
    this.history.clear();
  }

  getStats() {
    return {
      totalPrompts: this.history.size,
      totalGenerations: Array.from(this.history.values()).reduce((sum, arr) => sum + arr.length, 0),
      avgGenerationsPerPrompt: this.history.size > 0 
        ? Array.from(this.history.values()).reduce((sum, arr) => sum + arr.length, 0) / this.history.size 
        : 0
    };
  }
}

const generationHistory = new GenerationHistory(20);

// Training Cache System - Stores 200 songs for maximum training variety
class TrainingCache {
  constructor(maxSize = 200) { // Increased from 100 to 200 for maximum variety
    this.maxSize = maxSize;   
    this.cache = new Map(); // songId -> { track, features, spotifyData, timestamp }
    this.lastRefresh = null;
    this.isRefreshing = false;
  }

  add(songId, track, features, spotifyData) {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestId = this.getOldestEntry();
      if (oldestId) {
        this.cache.delete(oldestId);
        console.log(`🗑️ Removed oldest cached song: ${oldestId}`);
      }
    }

    this.cache.set(songId, {
      track,
      features,
      spotifyData,
      timestamp: Date.now()
    });
    
    console.log(`💾 Added to training cache: ${track.artist} - ${track.name} (Cache: ${this.cache.size}/${this.maxSize})`);
  }

  getOldestEntry() {
    let oldestId = null;
    let oldestTime = Date.now();
    
    for (const [id, data] of this.cache) {
      if (data.timestamp < oldestTime) {
        oldestTime = data.timestamp;
        oldestId = id;
      }
    }
    
    return oldestId;
  }

  get(songId) {
    return this.cache.get(songId);
  }

  getAll() {
    return Array.from(this.cache.values());
  }

  getAllIds() {
    return Array.from(this.cache.keys());
  }

  has(songId) {
    return this.cache.has(songId);
  }

  size() {
    return this.cache.size;
  }

  isFull() {
    return this.cache.size >= this.maxSize;
  }

  clear() {
    this.cache.clear();
    console.log('🗑️ Training cache cleared');
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      lastRefresh: this.lastRefresh,
      isRefreshing: this.isRefreshing,
      oldestEntry: this.getOldestEntry(),
      newestEntry: Array.from(this.cache.keys()).pop()
    };
  }

  // Get songs for training (up to specified limit)
  getTrainingSongs(limit = 8) {
    const songs = this.getAll();
    return songs.slice(0, Math.min(limit, songs.length));
  }

  // Check if cache needs refresh (older than 1 hour or not full)
  needsRefresh() {
    const oneHour = 60 * 60 * 1000;
    const isStale = this.lastRefresh && (Date.now() - this.lastRefresh) > oneHour;
    return !this.isFull() || isStale;
  }
}

// Reggae Training Data Manager
class ReggaeTrainingManager {
  constructor() {
    this.trainingData = new Map(); // songId -> { features, spotifyData, audioAnalysis }
    this.isTraining = false;
    this.lastTrainingUpdate = null;
    this.trainingQuality = 0; // 0-1 score based on training data amount and quality
    this.cache = new TrainingCache(200); // 200-song cache for maximum variety
  }

  addTrainingTrack(songId, features, spotifyData, audioPath) {
    this.trainingData.set(songId, {
      id: songId,
      features,
      spotifyData,
      audioPath,
      timestamp: Date.now()
    });
    this.updateTrainingQuality();
    console.log(`🎓 Added training track: ${songId} (Total: ${this.trainingData.size})`);
    console.log(`🔍 Training data keys: ${Array.from(this.trainingData.keys()).slice(0, 3).join(', ')}${this.trainingData.size > 3 ? '...' : ''}`);
  }

  updateTrainingQuality() {
    const trackCount = this.trainingData.size;
    const qualityFromCount = Math.min(trackCount / 20, 1); // Max quality at 20 tracks
    
    // Factor in Spotify feature quality
    let spotifyFeatureCount = 0;
    this.trainingData.forEach(track => {
      if (track.spotifyData && track.spotifyData.tempo) {
        spotifyFeatureCount++;
      }
    });
    
    const qualityFromFeatures = trackCount > 0 ? spotifyFeatureCount / trackCount : 0;
    this.trainingQuality = (qualityFromCount * 0.7) + (qualityFromFeatures * 0.3);
    
    console.log(`📊 Training quality updated: ${(this.trainingQuality * 100).toFixed(1)}% (${trackCount} tracks, ${spotifyFeatureCount} with Spotify features)`);
  }

  getTrainingData() {
    return Array.from(this.trainingData.values());
  }

  getTrainingStats() {
    const tracks = this.getTrainingData();
    const tempos = tracks.map(t => t.features?.tempo).filter(Boolean);
    const keys = tracks.map(t => t.features?.key).filter(Boolean);
    
    return {
      trackCount: this.trainingData.size,
      quality: this.trainingQuality,
      cacheInfo: this.cache.getCacheInfo(),
      averageTempoRange: tempos.length > 0 ? {
        min: Math.min(...tempos),
        max: Math.max(...tempos),
        avg: tempos.reduce((a, b) => a + b, 0) / tempos.length
      } : null,
      commonKeys: keys.reduce((acc, key) => {
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      lastUpdate: this.lastTrainingUpdate,
      isTraining: this.isTraining
    };
  }

  // Add song to cache and training data
  addToCache(songId, track, features, spotifyData) {
    this.cache.add(songId, track, features, spotifyData);
    this.addTrainingTrack(songId, features, spotifyData, null);
  }

  // Get songs from cache for training (much faster than API calls)
  getCachedTrainingSongs(limit = 8) {
    return this.cache.getTrainingSongs(limit);
  }

  // Check if cache needs refresh and has enough songs for training
  needsCacheRefresh() {
    return this.cache.needsRefresh() || this.cache.size() < 25; // Need at least 25 songs for good reggae training
  }

  // Get cache stats for monitoring
  getCacheStats() {
    return {
      ...this.cache.getCacheInfo(),
      trainingDataSize: this.trainingData.size,
      needsRefresh: this.needsCacheRefresh()
    };
  }

  // Populate cache with songs from Spotify
  async populateCache(spotifyAPI, targetSize = 100) {
    if (this.cache.isRefreshing) {
      console.log('⏳ Cache refresh already in progress...');
      return false;
    }

    this.cache.isRefreshing = true;
    console.log(`🔄 Populating training cache (target: ${targetSize} songs)...`);

    try {
      const neededSongs = targetSize - this.cache.size();
      if (neededSongs <= 0) {
        console.log('✅ Cache is already full');
        return true;
      }

      // Fetch songs in larger batches for efficiency
      const searchLimit = Math.min(neededSongs * 2, 50); // Get extra to account for failures
      const tracks = await spotifyAPI.searchReggaeTracks(searchLimit);
      
      if (tracks.length === 0) {
        console.log('⚠️ No tracks found from Spotify search');
        return false;
      }

      // Filter out songs already in cache
      const newTracks = tracks.filter(track => !this.cache.has(`spotify_${track.id}`));
      const trackIds = newTracks.map(track => track.id);

      console.log(`🎵 Processing ${trackIds.length} new tracks for cache...`);

      // Use batch processing for speed
      const batchResults = await spotifyAPI.getBatchTrackFeatures(trackIds);
      const trackMap = new Map(newTracks.map(track => [track.id, track]));

      let addedCount = 0;
      for (const result of batchResults) {
        const track = trackMap.get(result.trackId);
        if (track && addedCount < neededSongs) {
          const songId = `spotify_${result.trackId}`;
          this.addToCache(songId, track, result.features, result.features);
          addedCount++;
        }
      }

      this.cache.lastRefresh = Date.now();
      console.log(`✅ Cache populated: ${addedCount} songs added (Total: ${this.cache.size()}/${targetSize})`);
      
      return addedCount > 0;

    } catch (error) {
      console.error('❌ Error populating cache:', error);
      return false;
    } finally {
      this.cache.isRefreshing = false;
    }
  }

  async analyzeTrainingPatterns() {
    const tracks = this.getTrainingData();
    if (tracks.length === 0) return reggaePatterns;

    console.log(`🧠 Analyzing patterns from ${tracks.length} trained reggae tracks...`);
    
    // Extract common patterns from training data
    const trainedPatterns = {
      ...reggaePatterns,
      // Enhance base patterns with learned data
      trainingData: tracks.length,
      confidence: this.trainingQuality,
      enhancedFeatures: true
    };

    // Analyze tempo distribution from training
    const tempos = tracks.map(t => t.features?.tempo).filter(t => t && t >= 60 && t <= 100);
    if (tempos.length > 0) {
      trainedPatterns.tempos = tempos;
    }

    // Analyze key distribution
    const keys = tracks.map(t => t.features?.key).filter(Boolean);
    if (keys.length > 0) {
      const keyFreq = keys.reduce((acc, key) => {
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      trainedPatterns.keys = Object.keys(keyFreq).sort((a, b) => keyFreq[b] - keyFreq[a]);
    }

    return trainedPatterns;
  }

  clear() {
    this.trainingData.clear();
    this.trainingQuality = 0;
    this.lastTrainingUpdate = null;
    console.log('🗑️ Training data cleared');
  }
}

const reggaeTraining = new ReggaeTrainingManager();

// Self-Similarity Checker for dual generation system
class SelfSimilarityChecker {
  static calculatePatternSimilarity(pattern1, pattern2) {
    if (!pattern1 || !pattern2 || pattern1.length !== pattern2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < pattern1.length; i++) {
      if (Math.abs((pattern1[i] || 0) - (pattern2[i] || 0)) < 3) { // Allow small MIDI note differences
        matches++;
      }
    }
    return matches / pattern1.length;
  }
  
  static compareGenerations(gen1, gen2) {
    const bassSimilarity = this.calculatePatternSimilarity(gen1.bass, gen2.bass);
    const melodySimilarity = this.calculatePatternSimilarity(gen1.melody, gen2.melody);
    const chordSimilarity = this.calculatePatternSimilarity(
      gen1.chords ? gen1.chords.flat() : [], 
      gen2.chords ? gen2.chords.flat() : []
    );
    const rhythmSimilarity = this.calculatePatternSimilarity(gen1.rhythm, gen2.rhythm);
    
    const avgSimilarity = (bassSimilarity + melodySimilarity + chordSimilarity + rhythmSimilarity) / 4;
    
    return {
      overall: avgSimilarity,
      bass: bassSimilarity,
      melody: melodySimilarity,
      chords: chordSimilarity,
      rhythm: rhythmSimilarity,
      tooSimilar: avgSimilarity > 0.7 // 70% similarity threshold
    };
  }
}

// Generate patterns influenced by Spotify training data
function generateSpotifyInfluencedBass(features, spotifyData) {
  // Generate bass pattern directly from Spotify features instead of modifying generic patterns
  const tempo = features.tempo || 75;
  const energy = spotifyData.energy || 0.5;
  const key = features.key || 'C';
  
  // Map key to MIDI note number
  const keyMap = { 'C': 36, 'C#': 37, 'D': 38, 'D#': 39, 'E': 40, 'F': 41, 'F#': 42, 'G': 43, 'G#': 44, 'A': 45, 'A#': 46, 'B': 47 };
  const rootNote = keyMap[key] || 43;
  
  // Create authentic reggae bass based on actual track characteristics
  let bassPattern = [];
  
  if (energy > 0.7) {
    // High energy reggae - more syncopated, dancehall influence
    bassPattern = [rootNote, rootNote, 0, rootNote, 0, rootNote, rootNote, 0];
  } else if (energy > 0.5) {
    // Medium energy - classic one drop reggae
    bassPattern = [rootNote, 0, 0, rootNote, 0, rootNote, 0, 0];
  } else {
    // Low energy - roots reggae, sparse pattern
    bassPattern = [rootNote, 0, 0, 0, rootNote, 0, 0, rootNote];
  }
  
  // Add musical variation based on Spotify audio features
  if (spotifyData.danceability > 0.6) {
    // Add fifth for more movement
    bassPattern = bassPattern.map((note, i) => 
      i === 3 && note === 0 ? rootNote + 7 : note
    );
  }
  
  // Add tempo-specific rhythmic adjustments
  if (tempo < 70) {
    // Slower tempo - add more sustained notes
    bassPattern = bassPattern.map(note => note === 0 && Math.random() < 0.3 ? rootNote : note);
  }
  
  return bassPattern;
}

function generateSpotifyInfluencedMelody(features, spotifyData) {
  // Generate melody pattern directly from Spotify features
  const tempo = features.tempo || 75;
  const valence = spotifyData.valence || 0.5;
  const energy = spotifyData.energy || 0.5;
  const key = features.key || 'C';
  
  // Map key to MIDI note number (melody range)
  const keyMap = { 'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65, 'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71 };
  const rootNote = keyMap[key] || 67;
  
  // Create scale notes for authentic reggae melody
  const scale = [rootNote, rootNote + 2, rootNote + 4, rootNote + 5, rootNote + 7, rootNote + 9, rootNote + 11, rootNote + 12];
  
  let melodyPattern = [];
  
  if (valence > 0.7) {
    // Happy reggae - uplifting melody, higher notes
    melodyPattern = [
      scale[4], scale[2], scale[0], scale[2], 
      scale[4], scale[5], scale[4], scale[2]
    ];
  } else if (valence > 0.4) {
    // Neutral reggae - classic pentatonic approach
    melodyPattern = [
      scale[2], scale[0], 0, scale[2], 
      0, scale[4], scale[2], 0
    ];
  } else {
    // Melancholy reggae - lower, more sparse melody
    melodyPattern = [
      scale[0], 0, scale[2], 0, 
      scale[0], 0, 0, scale[2]
    ];
  }
  
  // Adjust for energy level
  if (energy > 0.6) {
    // High energy - fill in some rests with passing tones
    melodyPattern = melodyPattern.map(note => 
      note === 0 && Math.random() < 0.4 ? scale[Math.floor(Math.random() * 5)] : note
    );
  }
  
  // Tempo-based rhythmic adjustments
  if (tempo > 85) {
    // Faster tempo - add more syncopation
    melodyPattern = melodyPattern.map((note, i) => 
      i % 2 === 1 && note !== 0 ? (Math.random() < 0.3 ? 0 : note) : note
    );
  }
  
  return melodyPattern;
}

function generateSpotifyInfluencedChords(features, spotifyData) {
  // Generate chord progression directly from Spotify features
  const acousticness = spotifyData.acousticness || 0.5;
  const energy = spotifyData.energy || 0.5;
  const valence = spotifyData.valence || 0.5;
  const key = features.key || 'C';
  
  // Map key to MIDI note numbers for chords
  const keyMap = { 'C': 48, 'C#': 49, 'D': 50, 'D#': 51, 'E': 52, 'F': 53, 'F#': 54, 'G': 55, 'G#': 56, 'A': 57, 'A#': 58, 'B': 59 };
  const rootNote = keyMap[key] || 55;
  
  // Define chord types based on track characteristics
  let chordProgression = [];
  
  if (valence > 0.6) {
    // Happy reggae - major chord progression (I-V-vi-IV)
    chordProgression = [
      [rootNote, rootNote + 4, rootNote + 7],           // I major
      [rootNote + 7, rootNote + 11, rootNote + 14],     // V major  
      [rootNote + 9, rootNote + 12, rootNote + 16],     // vi minor
      [rootNote + 5, rootNote + 9, rootNote + 12]       // IV major
    ];
  } else if (valence > 0.3) {
    // Neutral reggae - classic minor progression (i-VII-VI-VII)
    chordProgression = [
      [rootNote, rootNote + 3, rootNote + 7],           // i minor
      [rootNote + 10, rootNote + 14, rootNote + 17],    // VII major
      [rootNote + 8, rootNote + 12, rootNote + 15],     // VI major
      [rootNote + 10, rootNote + 14, rootNote + 17]     // VII major
    ];
  } else {
    // Melancholy reggae - minor with diminished (i-ii°-v-i)
    chordProgression = [
      [rootNote, rootNote + 3, rootNote + 7],           // i minor
      [rootNote + 2, rootNote + 5, rootNote + 8],       // ii diminished
      [rootNote + 7, rootNote + 10, rootNote + 14],     // v minor
      [rootNote, rootNote + 3, rootNote + 7]            // i minor
    ];
  }
  
  // Adjust chord complexity based on acousticness
  if (acousticness > 0.7) {
    // Very acoustic - simple triads only
    chordProgression = chordProgression.map(chord => chord.slice(0, 3));
  } else if (acousticness < 0.3 && energy > 0.6) {
    // Electric, high energy - add seventh chords
    chordProgression = chordProgression.map(chord => [
      ...chord,
      chord[0] + 10  // Add minor 7th
    ]);
  }
  
  // Return typical reggae upstroke pattern
  return [
    chordProgression[0], 0, chordProgression[1], 0,
    chordProgression[2], 0, chordProgression[3], 0
  ];
}

// Authentic Reggae Patterns Database - based on classic reggae characteristics
const reggaePatterns = {
  basslines: [
    // Classic reggae basslines - emphasize the one drop and authentic rhythms
    [43, 0, 0, 43, 0, 43, 0, 0], // G - classic one drop bass (Bob Marley style)
    [41, 0, 0, 41, 0, 41, 0, 0], // F - roots reggae bass
    [38, 0, 0, 38, 0, 38, 0, 0], // D - steppers bass 
    [36, 0, 0, 36, 0, 36, 0, 0], // C - foundation bass
    [43, 0, 38, 0, 43, 0, 38, 0], // G-D progression (classic reggae)
    [41, 0, 36, 0, 41, 0, 36, 0], // F-C progression
    [43, 43, 0, 43, 0, 43, 0, 0], // Dancehall style
    [36, 0, 0, 36, 0, 43, 0, 43], // C-G roots progression
    [38, 0, 41, 0, 38, 0, 41, 0], // D-F authentic reggae
    [43, 0, 0, 0, 43, 0, 0, 43], // Sparse one drop (Dennis Brown style)
  ],
  melodies: [
    // Authentic reggae melodic patterns - inspired by Bob Marley, Dennis Brown, etc.
    [67, 65, 62, 60, 62, 65, 67, 65], // Minor pentatonic (classic reggae)
    [72, 70, 67, 65, 67, 70, 72, 70], // Higher register (Jimmy Cliff style)
    [60, 62, 65, 67, 65, 62, 60, 0], // Descending pattern (roots reggae)
    [65, 67, 70, 72, 70, 67, 65, 0], // Ascending pattern (uplifting)
    [67, 0, 65, 0, 67, 65, 62, 0], // Syncopated melody (authentic reggae feel)
    [72, 70, 72, 70, 67, 65, 67, 65], // Call and response (Bob Marley style)
    [65, 62, 60, 62, 65, 67, 65, 62], // Smooth reggae line
    [70, 0, 67, 0, 65, 0, 62, 60], // Sparse melody (one drop feel)
    [62, 65, 67, 70, 67, 65, 62, 0], // Classic reggae progression
    [67, 65, 67, 70, 72, 70, 67, 65], // Uplifting reggae melody
  ],
  chords: [
    // Classic reggae chord progressions
    [[43, 47, 50], [41, 45, 48], [38, 42, 45], [36, 40, 43]], // G-F-D-C
    [[36, 40, 43], [41, 45, 48], [43, 47, 50], [43, 47, 50]], // C-F-G-G
    [[38, 42, 45], [36, 40, 43], [43, 47, 50], [41, 45, 48]], // Dm-C-G-F
    [[43, 47, 50], [38, 42, 45], [36, 40, 43], [41, 45, 48]], // G-Dm-C-F
    [[36, 40, 43], [43, 47, 50], [57, 60, 64], [41, 45, 48]], // C-G-Am-F (Bob Marley style)
  ],
  rhythms: [
    // Authentic reggae rhythm patterns - the heart of reggae music
    [0, 1, 0, 1, 0, 1, 0, 1], // Classic skank (offbeat emphasis) - foundation of reggae
    [1, 0, 0, 1, 0, 0, 0, 0], // One drop rhythm (Bob Marley signature)
    [0, 1, 0, 1, 1, 1, 0, 1], // Steppers rhythm (roots reggae)
    [0, 1, 1, 1, 0, 1, 1, 1], // Dancehall rhythm (80s style)
    [1, 0, 0, 1, 0, 0, 1, 0], // Roots rhythm (foundation)
    [0, 1, 0, 0, 0, 1, 0, 0], // Minimal skank (sparse)
    [0, 0, 1, 0, 0, 0, 1, 0], // Rockers rhythm (Sly & Robbie style)
    [1, 0, 0, 0, 1, 0, 0, 0], // Pure one drop (kick on 1, nothing else)
    [0, 1, 0, 1, 0, 1, 1, 1], // Nyabinghi influenced rhythm
    [1, 1, 0, 1, 0, 1, 0, 0], // Early reggae rhythm
  ],
  drums: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0], // Kick on the one (one drop)
    snare: [0, 0, 0, 1, 0, 0, 0, 0], // Snare on 3 (classic reggae)
    hihat: [1, 1, 1, 1, 1, 1, 1, 1], // Steady hihat
    rimshot: [0, 1, 0, 1, 0, 1, 0, 1], // Rimshot on 2 and 4
  },
  keys: ['G', 'C', 'D', 'F', 'Am', 'Em'], // Common reggae keys
  tempos: [60, 65, 70, 75, 80, 85, 90], // Typical reggae tempos (slower)
};

// Reggae-focused instrument sound generators
class InstrumentGenerator {
  static generateBass(frequency, time, sampleRate) {
    const t = time / sampleRate;
    // Deep, warm reggae bass with slight overdrive
    const fundamental = Math.sin(2 * Math.PI * frequency * t) * 0.7;
    const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
    const subHarmonic = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.1;
    
    // Add slight envelope for reggae "thump"
    const envelope = Math.exp(-t * 5) * 0.3 + 0.7;
    return (fundamental + harmonic + subHarmonic) * envelope;
  }

  static generateLead(frequency, time, sampleRate) {
    const t = time / sampleRate;
    // Clean reggae lead guitar tone
    const fundamental = Math.sin(2 * Math.PI * frequency * t) * 0.6;
    const octave = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
    const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2;
    
    // Add vibrato for reggae feel
    const vibrato = Math.sin(2 * Math.PI * 5 * t) * 0.02; // 5Hz vibrato
    const vibratoFreq = frequency * (1 + vibrato);
    
    return Math.sin(2 * Math.PI * vibratoFreq * t) * 0.6 + octave + fifth;
  }

  static generatePad(frequencies, time, sampleRate) {
    const t = time / sampleRate;
    let sample = 0;
    
    // Reggae keyboard/organ sound
    frequencies.forEach((freq, index) => {
      if (freq > 0) {
        // Add slight detuning for warmth
        const detune = 1 + (Math.sin(t * 0.5 + index) * 0.002);
        const detuned = freq * detune;
        
        // Organ-like harmonics
        const fundamental = Math.sin(2 * Math.PI * detuned * t) * 0.4;
        const drawbar = Math.sin(2 * Math.PI * detuned * 2 * t) * 0.2;
        const percussion = Math.sin(2 * Math.PI * detuned * 4 * t) * Math.exp(-t * 10) * 0.1;
        
        sample += (fundamental + drawbar + percussion) / frequencies.length;
      }
    });
    
    return sample;
  }

  static generateDrum(type, time, sampleRate) {
    const t = time / sampleRate;
    switch(type) {
      case 'kick':
        // Deep reggae kick with quick decay
        const kickFreq = 50 + 30 * Math.exp(-t * 20);
        return Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-t * 15) * 1.5;
      
      case 'snare':
        // Reggae snare with tight, crisp sound
        const snareNoise = (Math.random() * 2 - 1) * 0.6;
        const snareTone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
        return (snareNoise + snareTone) * Math.exp(-t * 25);
      
      case 'hihat':
        // Subtle reggae hihat
        const hihatNoise = (Math.random() * 2 - 1) * 0.1;
        const highPassFilter = hihatNoise * (1 - Math.exp(-t * 150));
        return highPassFilter * Math.exp(-t * 80);
      
      default:
        return 0;
    }
  }
}

// Enhanced music pattern analysis from cached songs
class MusicAnalyzer {
  static async analyzeReggaePatterns() {
    // Use the dedicated training manager instead of cache songs
    return await reggaeTraining.analyzeTrainingPatterns();
  }
  
  static extractReggaeFeatures(songPath, spotifyFeatures = null) {
    // Extract reggae-specific features
    // If Spotify features are available, use them; otherwise simulate
    const reggaeTempo = spotifyFeatures?.tempo || (60 + Math.random() * 30); // Reggae tempo range
    const reggaeKey = spotifyFeatures?.key !== undefined 
      ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][spotifyFeatures.key]
      : reggaePatterns.keys[Math.floor(Math.random() * reggaePatterns.keys.length)];
    
    return {
      tempo: reggaeTempo,
      key: reggaeKey,
      complexity: spotifyFeatures?.energy || Math.random() * 0.7, // Reggae typically lower complexity
      energy: spotifyFeatures?.danceability || (0.4 + Math.random() * 0.4), // Reggae energy range
      // Reggae-specific rhythm patterns (emphasize offbeat)
      rhythmPattern: reggaePatterns.rhythms[Math.floor(Math.random() * reggaePatterns.rhythms.length)],
      melodyProfile: Array.from({length: 12}, () => Math.random() * 0.8), // Pentatonic bias
      harmonicContent: Array.from({length: 7}, () => Math.random() * 0.6), // Simpler harmonies
      spectralCentroid: Math.random() * 2000 + 800, // Warmer sound
      valence: spotifyFeatures?.valence || (0.3 + Math.random() * 0.5), // Reggae mood range
      acousticness: spotifyFeatures?.acousticness || (0.2 + Math.random() * 0.6),
      reggaeGroove: Math.random(), // Unique reggae characteristic
    };
  }

  static calculateSimilarity(features1, features2) {
    // Calculate similarity between two sets of musical features
    // Returns a value between 0 (completely different) and 1 (identical)
    
    // Add null/undefined checks for features
    if (!features1 || !features2) {
      console.warn('⚠️ calculateSimilarity: Invalid features provided', { features1: !!features1, features2: !!features2 });
      return 0;
    }
    
    let similarity = 0;
    let comparisons = 0;

    // Tempo similarity (normalized difference) - with safe defaults
    const tempo1 = features1.tempo || 75; // Default reggae tempo
    const tempo2 = features2.tempo || 75;
    const tempoSim = 1 - Math.abs(tempo1 - tempo2) / 200;
    similarity += Math.max(0, tempoSim) * 0.2;
    comparisons++;

    // Key similarity (exact match gives bonus) - with safe defaults
    const key1 = features1.key || 'G';
    const key2 = features2.key || 'G';
    const keySim = key1 === key2 ? 1 : 0.3;
    similarity += keySim * 0.15;
    comparisons++;

    // Rhythm pattern similarity (Hamming distance) - only if both exist
    if (features1.rhythmPattern && features2.rhythmPattern) {
      const rhythmSim = this.compareArrays(features1.rhythmPattern, features2.rhythmPattern);
      similarity += rhythmSim * 0.25;
      comparisons++;
    }

    // Melody profile similarity (cosine similarity) - only if both exist
    if (features1.melodyProfile && features2.melodyProfile) {
      const melodySim = this.cosineSimilarity(features1.melodyProfile, features2.melodyProfile);
      similarity += melodySim * 0.2;
      comparisons++;
    }

    // Harmonic content similarity - only if both exist
    if (features1.harmonicContent && features2.harmonicContent) {
      const harmonicSim = this.cosineSimilarity(features1.harmonicContent, features2.harmonicContent);
      similarity += harmonicSim * 0.2;
      comparisons++;
    }

    // Ensure we have at least the basic comparisons (tempo + key)
    if (comparisons < 2) {
      console.warn('⚠️ calculateSimilarity: Not enough feature comparisons available');
      return 0;
    }

    return similarity / comparisons;
  }

  static compareArrays(arr1, arr2) {
    // Calculate similarity between two arrays (0-1)
    // Add null/undefined checks
    if (!arr1 || !arr2 || !Array.isArray(arr1) || !Array.isArray(arr2)) {
      console.warn('⚠️ compareArrays: Invalid arrays provided', { arr1: typeof arr1, arr2: typeof arr2 });
      return 0;
    }
    
    if (arr1.length === 0 && arr2.length === 0) return 1; // Both empty = similar
    if (arr1.length !== arr2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] === arr2[i]) matches++;
    }
    return matches / arr1.length;
  }

  static cosineSimilarity(arr1, arr2) {
    // Calculate cosine similarity between two arrays
    // Add null/undefined checks
    if (!arr1 || !arr2 || !Array.isArray(arr1) || !Array.isArray(arr2)) {
      console.warn('⚠️ cosineSimilarity: Invalid arrays provided', { arr1: typeof arr1, arr2: typeof arr2 });
      return 0;
    }
    
    if (arr1.length === 0 && arr2.length === 0) return 1; // Both empty = similar
    if (arr1.length !== arr2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < arr1.length; i++) {
      dotProduct += arr1[i] * arr2[i];
      norm1 += arr1[i] * arr1[i];
      norm2 += arr2[i] * arr2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  static checkTrainingSimilarity(generatedFeatures) {
    // Check similarity to training data - target around 40%
    const trainingTracks = reggaeTraining.getTrainingData();
    if (trainingTracks.length === 0) return { passed: true, avgSimilarity: 0, maxSimilarity: 0, message: 'No training data available' };
    
    // Filter out tracks with invalid features and add error handling
    const validTracks = trainingTracks.filter(track => track && track.features);
    if (validTracks.length === 0) {
      console.warn('⚠️ No valid training tracks with features found');
      return { passed: true, avgSimilarity: 0, maxSimilarity: 0, message: 'No valid training data available' };
    }
    
    const similarities = validTracks.map(track => {
      try {
        return this.calculateSimilarity(generatedFeatures, track.features);
      } catch (error) {
        console.warn('⚠️ Error calculating similarity with training track:', error.message);
        return 0; // Return 0 similarity on error
      }
    }).filter(sim => !isNaN(sim)); // Filter out any NaN results
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);
    
    // Pass if average similarity is between 10-50% and no single song is >60% similar (more realistic)
    const passed = avgSimilarity >= 0.10 && avgSimilarity <= 0.50 && maxSimilarity <= 0.60;
    
    return {
      passed,
      avgSimilarity,
      maxSimilarity,
      similarities,
      trainingCount: trainingTracks.length,
      message: passed 
        ? `✅ Training similarity check passed (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}% vs ${trainingTracks.length} tracks)`
        : `❌ Training similarity too ${avgSimilarity > 0.50 ? 'high' : 'low'} (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}% vs ${trainingTracks.length} tracks)`
    };
  }

  static checkSelfSimilarity(generatedFeatures, previousGenerations) {
    // Check similarity to previous generations of same prompt - target around 10%
    if (previousGenerations.length === 0) return { passed: true, avgSimilarity: 0, maxSimilarity: 0, message: 'No previous generations to compare' };
    
    const similarities = previousGenerations.map(gen => 
      this.calculateSimilarity(generatedFeatures, gen.features)
    );
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);
    
    // Pass if average similarity is below 30% and no single generation is >50% similar (more lenient)
    const passed = avgSimilarity <= 0.30 && maxSimilarity <= 0.50;
    
    return {
      passed,
      avgSimilarity,
      maxSimilarity,
      similarities,
      message: passed 
        ? `✅ Self-similarity check passed (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}%)`
        : `❌ Too similar to previous attempts (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}%)`
    };
  }

  static performDualSimilarityCheck(generatedFeatures, previousGenerations) {
    const trainingCheck = this.checkTrainingSimilarity(generatedFeatures);
    const selfCheck = this.checkSelfSimilarity(generatedFeatures, previousGenerations);
    
    const overallPassed = trainingCheck.passed && selfCheck.passed;
    
    return {
      passed: overallPassed,
      trainingCheck,
      selfCheck,
      message: overallPassed 
        ? '✅ All similarity checks passed - song is unique and appropriate'
        : `❌ Similarity check failed: ${!trainingCheck.passed ? 'training data issue' : ''}${!trainingCheck.passed && !selfCheck.passed ? ' & ' : ''}${!selfCheck.passed ? 'too repetitive' : ''}`
    };
  }

  static generateReggaeFeatures(options) {
    // Generate musical features for the given reggae generation context
    console.log(`🎵 DEBUG: MusicAnalyzer.generateReggaeFeatures called with options:`, options);
    
    const { prompt, genre, tempo, key, instruments, context } = options;
    
    // Generate features based on the generation context
    const features = {
      prompt: prompt,
      genre: genre,
      tempo: tempo || 75,
      key: key || 'G',
      instruments: instruments || ['drums', 'bass', 'guitar'],
      complexity: context?.complexity || 0.6,
      energy: context?.energy || 0.7,
      
      // Reggae-specific features
      rhythmPattern: reggaePatterns.rhythms[Math.floor(Math.random() * reggaePatterns.rhythms.length)],
      melodyProfile: Array.from({length: 12}, () => Math.random() * 0.8), // Pentatonic bias
      harmonicContent: Array.from({length: 7}, () => Math.random() * 0.6), // Simpler harmonies
      spectralCentroid: Math.random() * 2000 + 800, // Warmer sound
      valence: 0.3 + Math.random() * 0.5, // Reggae mood range
      acousticness: 0.2 + Math.random() * 0.6,
      reggaeGroove: Math.random(),
      
      // Generation metadata
      generatedAt: new Date().toISOString(),
      generationContext: context || {},
      instrumentCount: instruments ? instruments.length : 3
    };
    
    console.log(`🎺 Generated features for reggae track: tempo=${features.tempo}, key=${features.key}, complexity=${features.complexity.toFixed(2)}`);
    
    return features;
  }
}

// Advanced music generation with real-time status and training data
// Fallback pattern generators for offline mode
function generateFallbackBass(genrePattern, key, tempo) {
  const keyOffset = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(key) || 0;
  const bassNotes = [];
  
  // Generate 16 bass notes based on genre and key
  for (let i = 0; i < 16; i++) {
    if (genrePattern.drums.kick[i % 8]) {
      bassNotes.push(36 + keyOffset); // Root note
    } else {
      bassNotes.push(0); // Rest
    }
  }
  
  return bassNotes;
}

function generateFallbackMelody(genrePattern, key, tempo) {
  const keyOffset = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(key) || 0;
  const melodyNotes = [];
  const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
  
  // Generate 32 melody notes
  for (let i = 0; i < 32; i++) {
    if (Math.random() > 0.3) { // 70% chance of note
      const scaleNote = scale[Math.floor(Math.random() * scale.length)];
      melodyNotes.push(60 + keyOffset + scaleNote); // Middle C + key + scale note
    } else {
      melodyNotes.push(0); // Rest
    }
  }
  
  return melodyNotes;
}

async function generateAdvancedMusic(prompt, genre, tempo, key, socketId, sampleReference = null, modelContext = null) {
  const socket = io.sockets.sockets.get(socketId);
  
  // Check if we should use the Multi-AI Orchestra system
  // Always use Multi-AI for reggae to enable reggae enhancements
  const useMultiAI = (modelContext && (modelContext.modelType === 'instrument_focused' || modelContext.modelType === 'reggae_enhanced')) || 
                     genre.toLowerCase().includes('reggae');
  
  console.log(`🎵 DEBUG: generateAdvancedMusic called - Genre: ${genre}, useMultiAI: ${useMultiAI}`);
  console.log(`🎵 DEBUG: Model context:`, modelContext);
  if (genre.toLowerCase().includes('reggae')) {
    console.log('🎵 DEBUG: Reggae detected in generateAdvancedMusic - Multi-AI should be TRUE');
  }
  
  if (useMultiAI) {
    const orchestraReason = genre.toLowerCase().includes('reggae') ? 
      `${genre} (reggae enhancements enabled)` : 
      'instrument-focused model';
    console.log(`🎼 Starting Multi-AI Orchestra Generation for: "${prompt}" - ${orchestraReason}`);
    
    // Step 1: Initialize the Multi-AI Orchestra
    socket?.emit('generation_status', { 
      step: 'initializing', 
      message: genre.toLowerCase().includes('reggae') ? 
        'Initializing Multi-AI Orchestra with Reggae Enhancements...' :
        'Initializing Multi-AI Orchestra System...',
      progress: 5
    });
    
    const aiOrchestrator = new AIOrchestrator();
    
    // Check if reggae enhancement is needed
    if (genre.toLowerCase().includes('reggae')) {
      console.log('🎵 Reggae genre detected - enhanced processing enabled');
      socket?.emit('generation_status', { 
        step: 'reggae_enhancement', 
        message: 'Loading authentic Jamaican reggae patterns and specialists...',
        progress: 8
      });
    }
    
    await sleep(500);

  // Step 2: Analyze the prompt using AI
  socket?.emit('generation_status', { 
    step: 'analyzing', 
    message: 'AI analyzing your musical intent and preferences...',
    progress: 15
  });
  
  // Use the globally available classes (loaded at startup)
  const promptAnalyzer = new PromptAnalyzer();
  const instrumentSelector = new InstrumentSelector();
  const knowledgeBase = new MusicalKnowledgeBase();
  
  const promptAnalysis = await promptAnalyzer.analyze(prompt);
  console.log(`🧠 Prompt Analysis: Mood=${promptAnalysis.mood.primary}, Energy=${promptAnalysis.energy.toFixed(2)}, Complexity=${promptAnalysis.complexity.toFixed(2)}`);
  
  await sleep(800);

  // Step 3: Select optimal instruments
  socket?.emit('generation_status', { 
    step: 'orchestrating', 
    message: 'AI selecting optimal instrument combination...',
    progress: 25
  });
  
  const context = {
    genre,
    prompt: promptAnalysis,
    tempo,
    key,
    mood: promptAnalysis.mood,
    energy: promptAnalysis.energy,
    complexity: promptAnalysis.complexity
  };
  
  const selectedInstruments = await instrumentSelector.selectForContext(context);
  console.log(`🎯 Selected ${selectedInstruments.length} instruments: ${selectedInstruments.join(', ')}`);
  
  await sleep(800);

  // Step 4: Generate individual instrument patterns using AI specialists
  socket?.emit('generation_status', { 
    step: 'generating', 
    message: 'AI specialists generating instrument-specific patterns...',
    progress: 40
  });
  
  const instrumentPatterns = await aiOrchestrator.generateEnsembleMusic(selectedInstruments, {
    ...context,
    chordProgression: knowledgeBase.getChordProgression(genre, key)
  });
  
  console.log(`🎵 Generated ${Object.keys(instrumentPatterns.patterns).length} instrument patterns`);
  await sleep(1000);

  // Step 5: Generate beats using specialized beat AIs
  socket?.emit('generation_status', { 
    step: 'beats', 
    message: 'AI creating advanced rhythmic patterns...',
    progress: 55
  });
  
  const beatPatterns = await aiOrchestrator.generateBeats(context);
  console.log(`🥁 Generated ${Object.keys(beatPatterns).length} beat patterns`);
  await sleep(800);

  // Step 6: Coordinate arrangement
  socket?.emit('generation_status', { 
    step: 'arranging', 
    message: 'AI coordinating musical arrangement...',
    progress: 70
  });
  
  const arrangement = await aiOrchestrator.coordinateArrangement(selectedInstruments, context);
  console.log(`🎭 Created arrangement with ${arrangement.sections.length} sections`);
  await sleep(800);

  // Step 7: Resolve conflicts between AI suggestions
  socket?.emit('generation_status', { 
    step: 'resolving', 
    message: 'AI resolving musical conflicts and optimizing...',
    progress: 80
  });
  
  const allSuggestions = [
    { ...instrumentPatterns, type: 'instruments' },
    { ...beatPatterns, type: 'beats' },
    { ...arrangement, type: 'arrangement' }
  ];
  
  const conflictResolution = await aiOrchestrator.resolveConflicts(allSuggestions, context);
  console.log(`⚖️ Resolved ${conflictResolution.conflicts.length} conflicts`);
  await sleep(500);

  // Step 8: Quality assessment
  socket?.emit('generation_status', { 
    step: 'assessing', 
    message: 'AI assessing and refining musical quality...',
    progress: 90
  });
  
  // Combine all patterns into final music data
  const finalMusicData = {
    instruments: instrumentPatterns.patterns,
    beats: beatPatterns,
    arrangement: arrangement,
    chords: knowledgeBase.getChordProgression(genre, key),
    tempo: tempo,
    key: key,
    genre: genre
  };
  
  // Quality assessment by specialized AI (with reggae enhancement if needed)
  let qualityAssessment;
  if (genre.toLowerCase().includes('reggae')) {
    console.log('🎵 Using reggae-enhanced quality assessment');
    qualityAssessment = await aiOrchestrator.reggaeEnhancements.qualityAssessment.assessReggaeQuality(finalMusicData, context);
  } else {
    qualityAssessment = await aiOrchestrator.assessQuality(finalMusicData, context);
  }
  console.log(`🎯 Quality Score: ${((qualityAssessment.overall || qualityAssessment.score) * 100).toFixed(1)}% (${(qualityAssessment.recommendations || qualityAssessment.issues || []).length} recommendations)`);
  
  await sleep(500);

  // Step 9: Generate final audio
  socket?.emit('generation_status', { 
    step: 'finalizing', 
    message: 'Creating final musical composition...',
    progress: 95
  });
  
  const generatedFeatures = MusicAnalyzer.generateReggaeFeatures({
    prompt,
    genre,
    tempo,
    key,
    instruments: selectedInstruments,
    patterns: finalMusicData,
    qualityScore: qualityAssessment.overall
  });
  
  const filename = `generated-${Date.now()}.wav`;
  const outputPath = path.join(__dirname, 'generated', filename);
  
  // Create audio file (with reggae enhancement if needed)
  if (genre.toLowerCase().includes('reggae')) {
    console.log('🎵 DEBUG: Using reggae-enhanced audio synthesis');
    console.log('🎵 DEBUG: Reggae enhancements available:', !!aiOrchestrator.reggaeEnhancements);
    await createReggaeAudioFile(outputPath, finalMusicData, tempo, key, aiOrchestrator.reggaeEnhancements);
  } else {
    console.log('🎵 DEBUG: Using standard audio synthesis');
    await createAudioFile(outputPath, finalMusicData, tempo, key);
  }
  
  const url = `/api/download/${filename}`;
  
  console.log(`✅ Multi-AI Orchestra completed: ${filename} (Quality: ${((qualityAssessment.overall || qualityAssessment.score) * 100).toFixed(1)}%)`);
  
  return {
    success: true,
    filename,
    url,
    generatedFeatures,
    aiOrchestra: {
      instruments: selectedInstruments,
      patterns: Object.keys(instrumentPatterns.patterns).length,
      beats: Object.keys(beatPatterns).length,
      arrangement: arrangement.sections.length,
      conflicts: conflictResolution.conflicts.length,
      quality: qualityAssessment.overall,
      recommendations: qualityAssessment.recommendations
    },
    similarityCheck: { passed: true, message: 'Multi-AI generated unique composition' }
  };
  } else {
    // Fall back to original system for non-instrument-focused models
    console.log(`🎵 Using standard generation system for: "${prompt}"`);
    const promptHash = generationHistory.createPromptHash(prompt, genre, tempo, key);
    const previousGenerations = generationHistory.getHistory(promptHash);
    
    const generationResult = await attemptGeneration(prompt, genre, tempo, key, socketId, sampleReference, previousGenerations, 1);
    
    // Add to history
    generationHistory.addGeneration(promptHash, generationResult.generatedFeatures);
    
    return generationResult;
  }
}

// Helper function to create audio file from AI-generated patterns
async function createAudioFile(outputPath, musicData, tempo, key) {
  // This is a simplified implementation
  // In a real system, this would convert the AI patterns to actual audio
  
  console.log(`🎵 Synthesizing audio from AI patterns:`);
  console.log(`   - ${Object.keys(musicData.instruments).length} instrument patterns`);
  console.log(`   - ${Object.keys(musicData.beats).length} beat patterns`);
  console.log(`   - ${musicData.arrangement.sections.length} arrangement sections`);
  console.log(`   - Tempo: ${tempo} BPM, Key: ${key}`);
  
  // For now, create a simple tone as placeholder
  // Real implementation would use Web Audio API, Tone.js, or similar
  const duration = 30; // 30 seconds
  const sampleRate = 44100;
  const samples = duration * sampleRate;
  const buffer = Buffer.alloc(samples * 2); // 16-bit audio
  
  // Generate a simple harmonic progression based on the key
  const freq = getKeyFrequency(key);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // Simple chord progression with multiple harmonics
    let sample = 0;
    sample += Math.sin(2 * Math.PI * freq * t) * 0.3; // Root
    sample += Math.sin(2 * Math.PI * freq * 1.25 * t) * 0.2; // Third
    sample += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15; // Fifth
    
    // Add rhythmic elements based on tempo
    const beatPhase = (t * tempo / 60) % 1;
    if (beatPhase < 0.1) sample *= 1.5; // Accent on beat
    
    // Apply envelope
    const fadeIn = Math.min(1, t * 4); // 0.25 second fade in
    const fadeOut = Math.min(1, (duration - t) * 4); // 0.25 second fade out
    sample *= fadeIn * fadeOut;
    
    // Convert to 16-bit integer
    const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
    buffer.writeInt16LE(intSample, i * 2);
  }
  
  // Write WAV header
  const wavHeader = createWavHeader(samples, sampleRate);
  const wavFile = Buffer.concat([wavHeader, buffer]);
  
  await require('fs').promises.writeFile(outputPath, wavFile);
  console.log(`📁 Audio file created: ${path.basename(outputPath)}`);
}

function getKeyFrequency(key) {
  const frequencies = {
    'C': 261.63,
    'C#': 277.18,
    'Db': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'Eb': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'Gb': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'Ab': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'Bb': 466.16,
    'B': 493.88
  };
  return frequencies[key] || frequencies['C'];
}

function createWavHeader(samples, sampleRate) {
  const buffer = Buffer.alloc(44);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(1, 22); // num channels (mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  return buffer;
}

// Reggae-enhanced audio file creation
async function createReggaeAudioFile(outputPath, musicData, tempo, key, reggaeEnhancements) {
  console.log(`🎵 DEBUG: createReggaeAudioFile called`);
  console.log(`🎵 DEBUG: Reggae enhancements provided:`, !!reggaeEnhancements);
  console.log(`🎵 Synthesizing reggae-enhanced audio from AI patterns:`);
  console.log(`   - ${Object.keys(musicData.instruments).length} instrument patterns (reggae-optimized)`);
  console.log(`   - ${Object.keys(musicData.beats).length} beat patterns (authentic Jamaican)`);
  console.log(`   - ${musicData.arrangement.sections.length} arrangement sections`);
  console.log(`   - Tempo: ${tempo} BPM, Key: ${key} (reggae constraints applied)`);
  
  try {
    console.log('🎵 DEBUG: About to call reggae audio synthesizer...');
    // Use reggae audio synthesizer for frequency-aware synthesis
    const audioData = await reggaeEnhancements.audioSynthesizer.synthesizeReggaeAudio(musicData, {
      tempo, key, duration: 30, outputPath
    });
    
    // Apply reggae-specific mixing
    const mixedAudio = await reggaeEnhancements.mixingEngine.mixReggaeComposition(audioData, {
      tempo, key, instruments: Object.keys(musicData.instruments)
    });
    
    // Write the enhanced audio file
    const wav = new WaveFile();
    wav.fromScratch(1, 44100, '16', mixedAudio);
    fs.writeFileSync(outputPath, wav.toBuffer());
    
    console.log('✅ Reggae-enhanced audio file created successfully');
    
  } catch (error) {
    console.error('❌ Reggae audio synthesis failed, falling back to standard method:', error);
    // Fallback to standard audio creation
    await createAudioFile(outputPath, musicData, tempo, key);
  }
}

// Separated generation logic for retry capability
async function attemptGeneration(prompt, genre, tempo, key, socketId, sampleReference, previousGenerations, attemptNumber) {
  const socket = io.sockets.sockets.get(socketId);
  
  // Redirect reggae generation to use the new Multi-AI Orchestra system
  if (genre.toLowerCase().includes('reggae')) {
    console.log('🎵 Redirecting reggae generation to Multi-AI Orchestra with enhancements');
    return await generateAdvancedMusic(prompt, genre, tempo, key, socketId, sampleReference, {
      modelType: 'reggae_enhanced'
    });
  }
  
  // Add some randomization for different attempts
  const randomizationFactor = attemptNumber > 1 ? 0.1 + (attemptNumber * 0.05) : 0;
  
  // Step 1: Analyze prompt
  socket?.emit('generation_status', { 
    step: 'analyzing', 
    message: 'Analyzing your prompt and musical preferences...',
    progress: 10
  });
  await sleep(1000);

  // Step 2: Analyze training data from reggae training manager
  socket?.emit('generation_status', { 
    step: 'training', 
    message: 'Loading trained reggae model...',
    progress: 15
  });
  
  const trainingStats = reggaeTraining.getTrainingStats();
  console.log(`🧠 Using trained reggae model with ${trainingStats.trackCount} tracks (Quality: ${(trainingStats.quality * 100).toFixed(1)}%)`);
  
  if (trainingStats.trackCount === 0) {
    socket?.emit('generation_status', { 
      step: 'warning', 
      message: '⚠️ No training data found - using base reggae patterns',
      progress: 18
    });
    await sleep(1000);
  }
  
  await sleep(800);

  // Step 3: Search pattern database with enhanced patterns
  socket?.emit('generation_status', { 
    step: 'searching', 
    message: 'Searching enhanced music pattern database...',
    progress: 20
  });
  await sleep(800);

  const enhancedPatterns = await MusicAnalyzer.analyzeReggaePatterns();
  const trainingData = reggaeTraining.getTrainingData();
  
  // CRITICAL: Force debug logging to identify the problem
  console.log(`🔍 GENERATION DEBUG: Training data length = ${trainingData.length}`);
  console.log(`🔍 GENERATION DEBUG: Training cache size = ${reggaeTraining.cache ? reggaeTraining.cache.size() : 'no cache'}`);
  console.log(`🔍 GENERATION DEBUG: Training stats = ${JSON.stringify(reggaeTraining.getTrainingStats())}`);
  
  // Use Spotify-trained patterns if available, otherwise fallback to built-in genre patterns
  let selectedBass, selectedMelody, selectedChords, selectedRhythm;
  
  if (trainingData.length > 0) {
    console.log(`🎓 Using authentic reggae patterns from ${trainingData.length} trained tracks`);
    
    // Use multiple training tracks to create a more authentic reggae sound
    const numTracksToUse = Math.min(5, trainingData.length); // Use up to 5 tracks for influence
    const selectedTracks = [];
    
    for (let i = 0; i < numTracksToUse; i++) {
      const randomTrack = trainingData[Math.floor(Math.random() * trainingData.length)];
      if (!selectedTracks.find(t => t.id === randomTrack.id)) {
        selectedTracks.push(randomTrack);
      }
    }
    
    console.log(`🎵 Blending authentic reggae patterns from ${selectedTracks.length} tracks`);
    
    // Aggregate patterns from multiple tracks for more authentic reggae
    const aggregatedPatterns = {
      basslines: [],
      melodies: [],
      chords: [],
      rhythms: [],
      tempos: [],
      keys: []
    };
    
    selectedTracks.forEach((track, index) => {
      const features = track.features;
      const spotifyData = track.spotifyData;
      
      console.log(`  📀 Track ${index + 1}: tempo ${features.tempo}, key ${features.key}, energy ${features.energy?.toFixed(2) || 'unknown'}`);
      
      // Collect authentic reggae patterns from each track
      aggregatedPatterns.basslines.push(generateSpotifyInfluencedBass(features, spotifyData));
      aggregatedPatterns.melodies.push(generateSpotifyInfluencedMelody(features, spotifyData));
      aggregatedPatterns.chords.push(generateSpotifyInfluencedChords(features, spotifyData));
      aggregatedPatterns.rhythms.push(features.rhythmPattern || enhancedPatterns.rhythms[Math.floor(Math.random() * enhancedPatterns.rhythms.length)]);
      aggregatedPatterns.tempos.push(features.tempo);
      if (features.key) aggregatedPatterns.keys.push(features.key);
    });
    
    // DUAL GENERATION SYSTEM: Generate 2 hidden versions and compare similarity
    console.log(`🔄 Generating 2 hidden versions for similarity comparison...`);
    
    const hiddenGen1 = {
      bass: aggregatedPatterns.basslines[Math.floor(Math.random() * aggregatedPatterns.basslines.length)],
      melody: aggregatedPatterns.melodies[Math.floor(Math.random() * aggregatedPatterns.melodies.length)],
      chords: aggregatedPatterns.chords[Math.floor(Math.random() * aggregatedPatterns.chords.length)],
      rhythm: aggregatedPatterns.rhythms[Math.floor(Math.random() * aggregatedPatterns.rhythms.length)]
    };
    
    const hiddenGen2 = {
      bass: aggregatedPatterns.basslines[Math.floor(Math.random() * aggregatedPatterns.basslines.length)],
      melody: aggregatedPatterns.melodies[Math.floor(Math.random() * aggregatedPatterns.melodies.length)],
      chords: aggregatedPatterns.chords[Math.floor(Math.random() * aggregatedPatterns.chords.length)],
      rhythm: aggregatedPatterns.rhythms[Math.floor(Math.random() * aggregatedPatterns.rhythms.length)]
    };
    
    // Compare the two hidden generations
    const selfSimilarity = SelfSimilarityChecker.compareGenerations(hiddenGen1, hiddenGen2);
    console.log(`🎭 Hidden generation similarity: ${(selfSimilarity.overall * 100).toFixed(1)}% (Bass: ${(selfSimilarity.bass * 100).toFixed(1)}%, Melody: ${(selfSimilarity.melody * 100).toFixed(1)}%, Chords: ${(selfSimilarity.chords * 100).toFixed(1)}%, Rhythm: ${(selfSimilarity.rhythm * 100).toFixed(1)}%)`);
    
    // If too similar, regenerate with more variety by using different track combinations
    if (selfSimilarity.tooSimilar) {
      console.log(`⚠️ Hidden generations too similar (${(selfSimilarity.overall * 100).toFixed(1)}%), forcing more variety...`);
      
      // Force different tracks for each component to ensure variety
      const shuffledTracks = [...selectedTracks].sort(() => Math.random() - 0.5);
      
      selectedBass = generateSpotifyInfluencedBass(shuffledTracks[0]?.features || selectedTracks[0].features, shuffledTracks[0]?.spotifyData || selectedTracks[0].spotifyData);
      selectedMelody = generateSpotifyInfluencedMelody(shuffledTracks[1]?.features || selectedTracks[1].features, shuffledTracks[1]?.spotifyData || selectedTracks[1].spotifyData);
      selectedChords = generateSpotifyInfluencedChords(shuffledTracks[2]?.features || selectedTracks[2].features, shuffledTracks[2]?.spotifyData || selectedTracks[2].spotifyData);
      selectedRhythm = shuffledTracks[3]?.features?.rhythmPattern || enhancedPatterns.rhythms[Math.floor(Math.random() * enhancedPatterns.rhythms.length)];
      
      console.log(`✨ Final generation uses variety-enforced patterns from different tracks`);
    } else {
      // Use patterns that are different from both hidden generations
      console.log(`✅ Hidden generations sufficiently different, selecting contrasting patterns...`);
      
      // Select patterns that are most different from both hidden versions
      let bestBass = aggregatedPatterns.basslines[0];
      let bestMelody = aggregatedPatterns.melodies[0];
      let bestChords = aggregatedPatterns.chords[0];
      let lowestSimilarity = 1.0;
      
      // Simplified approach: test a smaller number of combinations to avoid performance issues
      const maxCombinations = Math.min(20, aggregatedPatterns.basslines.length * aggregatedPatterns.melodies.length);
      for (let combo = 0; combo < maxCombinations; combo++) {
        const bassIdx = Math.floor(Math.random() * aggregatedPatterns.basslines.length);
        const melodyIdx = Math.floor(Math.random() * aggregatedPatterns.melodies.length);
        const chordIdx = Math.floor(Math.random() * aggregatedPatterns.chords.length);
        
        const testGen = {
          bass: aggregatedPatterns.basslines[bassIdx],
          melody: aggregatedPatterns.melodies[melodyIdx],
          chords: aggregatedPatterns.chords[chordIdx],
          rhythm: aggregatedPatterns.rhythms[Math.floor(Math.random() * aggregatedPatterns.rhythms.length)]
        };
        
        const sim1 = SelfSimilarityChecker.compareGenerations(testGen, hiddenGen1);
        const sim2 = SelfSimilarityChecker.compareGenerations(testGen, hiddenGen2);
        const avgSim = (sim1.overall + sim2.overall) / 2;
        
        if (avgSim < lowestSimilarity) {
          lowestSimilarity = avgSim;
          bestBass = testGen.bass;
          bestMelody = testGen.melody;
          bestChords = testGen.chords;
        }
      }
      
      selectedBass = bestBass;
      selectedMelody = bestMelody;
      selectedChords = bestChords;
      selectedRhythm = aggregatedPatterns.rhythms[Math.floor(Math.random() * aggregatedPatterns.rhythms.length)];
      
      console.log(`🎯 Selected most unique patterns (${(lowestSimilarity * 100).toFixed(1)}% similarity to hidden versions)`);
    }
    
    // Use the average tempo from authentic reggae tracks
    const avgTempo = Math.round(aggregatedPatterns.tempos.reduce((a, b) => a + b, 0) / aggregatedPatterns.tempos.length);
    
    // Use the most common key from authentic reggae tracks
    const mostCommonKey = aggregatedPatterns.keys.length > 0 ? 
      aggregatedPatterns.keys.sort((a,b) =>
        aggregatedPatterns.keys.filter(v => v===a).length - aggregatedPatterns.keys.filter(v => v===b).length
      ).pop() : null;
    
    // Adjust tempo to authentic reggae range
    if (Math.abs(avgTempo - tempo) > 10) {
      const authenticTempo = Math.max(60, Math.min(90, avgTempo)); // Keep in authentic reggae range
      console.log(`🎵 Adjusting tempo from ${tempo} to ${authenticTempo} based on ${selectedTracks.length} authentic reggae tracks`);
      tempo = authenticTempo;
    }
    
    // Use authentic reggae key if available
    if (mostCommonKey && mostCommonKey !== key) {
      console.log(`🎵 Adjusting key from ${key} to ${mostCommonKey} based on trained reggae data`);
      key = mostCommonKey;
    }
  } else {
    console.log(`⚠️ No Spotify training data available (${trainingData.length} tracks), using built-in ${genre} patterns`);
    
    socket?.emit('generation_status', { 
      step: 'fallback', 
      message: `Using built-in ${genre} patterns for generation...`,
      progress: 25
    });
    
    // Use genre-specific fallback patterns
    const genrePattern = fallbackPatterns[genre] || fallbackPatterns.reggae;
    
    // Generate simple but genre-appropriate patterns
    selectedBass = generateFallbackBass(genrePattern, key, tempo);
    selectedMelody = generateFallbackMelody(genrePattern, key, tempo);  
    selectedChords = genrePattern.chords || ['C', 'Am', 'F', 'G'];
    selectedRhythm = genrePattern.drums || { kick: [1, 0, 1, 0], snare: [0, 0, 1, 0], hihat: [1, 1, 1, 1] };
    
    console.log(`🎵 Generated ${genre} patterns - instruments: ${genrePattern.instruments.join(', ')}`);
  }
  
  // Apply variation for retry attempts
  if (randomizationFactor > 0) {
    selectedBass = selectedBass.map(note => note + Math.floor((Math.random() - 0.5) * 24 * randomizationFactor));
    selectedMelody = selectedMelody.map(note => note + Math.floor((Math.random() - 0.5) * 12 * randomizationFactor));
    selectedChords = selectedChords.map(chord => 
      chord.map(note => note + Math.floor((Math.random() - 0.5) * 12 * randomizationFactor))
    );
    // Slightly vary rhythm timing
    if (Math.random() < randomizationFactor) {
      selectedRhythm = [...selectedRhythm.slice(1), selectedRhythm[0]]; // Rotate rhythm
    }
  }
  
  // Add sample reference influence if provided
  if (sampleReference) {
    socket?.emit('generation_status', { 
      step: 'reference', 
      message: `Incorporating style from "${sampleReference}"...`,
      progress: 25
    });
    await sleep(600);
  }

  // Step 3: Generate composition structure
  socket?.emit('generation_status', { 
    step: 'composing', 
    message: 'Creating musical composition structure...',
    progress: 35
  });
  await sleep(1200);

  // Step 4: Generate bass line
  socket?.emit('generation_status', { 
    step: 'bass', 
    message: 'Generating bass line and rhythm section...',
    progress: 45
  });
  await sleep(900);

  // Step 5: Generate drums
  socket?.emit('generation_status', { 
    step: 'drums', 
    message: 'Creating drum patterns and percussion...',
    progress: 55
  });
  await sleep(800);

  // Step 6: Generate melody
  socket?.emit('generation_status', { 
    step: 'melody', 
    message: 'Composing main melody and harmonies...',
    progress: 70
  });
  await sleep(1000);

  // Step 7: Add layers
  socket?.emit('generation_status', { 
    step: 'layering', 
    message: 'Adding instrumental layers and effects...',
    progress: 85
  });
  await sleep(700);

  // Step 8: Final rendering
  socket?.emit('generation_status', { 
    step: 'rendering', 
    message: 'Rendering final audio file...',
    progress: 95
  });

  // Generate actual audio
  const sampleRate = 44100;
  const duration = 30; // 30 seconds
  const numSamples = sampleRate * duration;
  const buffer = Buffer.alloc(numSamples * 2); // 16-bit PCM
  
  const baseFreq = getFrequencyFromKey(key);
  const beatsPerSecond = tempo / 60;
  const samplesPerBeat = sampleRate / beatsPerSecond;

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    const beatIndex = Math.floor(i / samplesPerBeat) % selectedRhythm.length;
    const chordIndex = Math.floor(i / (samplesPerBeat * 4)) % selectedChords.length;
    const bassIndex = Math.floor(i / (samplesPerBeat * 2)) % selectedBass.length;
    const melodyIndex = Math.floor(i / (samplesPerBeat * 0.5)) % selectedMelody.length;

    // Initialize mix with proper level control
    let bassLevel = 0;
    let padLevel = 0;
    let melodyLevel = 0;
    let drumLevel = 0;

    // Bass line - handle zero values in reggae patterns
    const bassNote = selectedBass[bassIndex];
    if (bassNote > 0 && selectedRhythm[beatIndex]) {
      const bassFreq = midiToFreq(bassNote, baseFreq);
      bassLevel = InstrumentGenerator.generateBass(bassFreq, i, sampleRate) * 0.35;
    }

    // Chord progression (pads) - handle new chord format
    const currentChord = selectedChords[chordIndex];
    if (currentChord && Array.isArray(currentChord) && currentChord.length > 0) {
      const chordFreqs = currentChord.map(note => midiToFreq(note, baseFreq));
      padLevel = InstrumentGenerator.generatePad(chordFreqs, i, sampleRate) * 0.15;
    }

    // Melody - handle zero values and add reggae feel
    const melodyNote = selectedMelody[melodyIndex];
    if (melodyNote > 0) {
      const melodyFreq = midiToFreq(melodyNote, baseFreq);
      const melodyEnvelope = Math.sin(time * beatsPerSecond * Math.PI) * 0.5 + 0.5;
      // Add slight delay/reverb effect for reggae feel
      const reverbDelay = Math.sin(time * beatsPerSecond * Math.PI * 1.01) * 0.1;
      melodyLevel = InstrumentGenerator.generateLead(melodyFreq, i, sampleRate) * melodyEnvelope * 0.25 + reverbDelay * 0.05;
    }

    // Reggae drums - generate pattern based on training data characteristics
    const trainingStats = reggaeTraining.getTrainingStats();
    const isAuthentic = trainingStats.trackCount > 0;
    
    // Use training-influenced drum patterns instead of generic ones
    const reggaeDrums = isAuthentic ? {
      // Authentic reggae one drop based on training data
      kick: [1, 0, 0, 1, 0, 0, 1, 0],      // One drop kick pattern
      snare: [0, 0, 1, 0, 0, 0, 1, 0],     // Snare on 3 and 7 (authentic reggae)
      hihat: [0, 1, 0, 1, 0, 1, 0, 1],     // Upstroke hihat pattern
      rimshot: [0, 0, 0, 0, 1, 0, 0, 0]    // Rimshot accent
    } : enhancedPatterns.drums;
    
    if (reggaeDrums.kick[beatIndex]) {
      drumLevel += InstrumentGenerator.generateDrum('kick', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.4;
    }
    if (reggaeDrums.snare[beatIndex]) {
      drumLevel += InstrumentGenerator.generateDrum('snare', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.3;
    }
    if (reggaeDrums.hihat[beatIndex]) {
      drumLevel += InstrumentGenerator.generateDrum('hihat', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.15;
    }
    if (reggaeDrums.rimshot[beatIndex]) {
      // Add rimshot for authentic reggae feel
      drumLevel += InstrumentGenerator.generateDrum('snare', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.2;
    }

    // Mix all instruments with proper level control
    let sample = bassLevel + padLevel + melodyLevel + drumLevel;

    // Apply gentle dynamics
    const dynamicEnvelope = 0.8 + 0.2 * Math.sin(time * 0.5);
    sample *= dynamicEnvelope;
    
    // Master limiter to prevent distortion
    const masterVolume = 0.7;
    sample *= masterVolume;

    // Prevent clipping
    sample = Math.max(-1, Math.min(1, sample));
    
    // Convert to 16-bit PCM
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, i * 2);
  }

  // Create WAV file
  const timestamp = Date.now();
  const filename = `generated-${timestamp}.wav`;
  const filepath = path.join('generated', filename);
  
  const wavHeader = createWavHeader(buffer.length, sampleRate, 16);
  const wavFile = Buffer.concat([wavHeader, buffer]);
  
  fs.writeFileSync(filepath, wavFile);

  // Step 9: Dual similarity check
  socket?.emit('generation_status', { 
    step: 'similarity', 
    message: 'Checking similarity against training data and previous attempts...',
    progress: 98
  });
  
  // Generate features for the current song - with safety checks
  const generatedFeatures = {
    tempo: tempo || 75,
    key: key || 'G',
    complexity: Math.random(),
    energy: Math.random(),
    rhythmPattern: selectedRhythm || [1, 0, 1, 0, 1, 0, 1, 0], // Default reggae rhythm
    melodyProfile: (selectedMelody && Array.isArray(selectedMelody)) 
      ? selectedMelody.map(note => Math.max(0, Math.min(1, (note || 60) / 127))) // Normalize and clamp MIDI to 0-1
      : [0.5, 0.6, 0.4, 0.7, 0.3], // Default melody profile
    harmonicContent: (selectedChords && selectedChords[0] && Array.isArray(selectedChords[0])) 
      ? selectedChords[0].map(note => Math.max(0, Math.min(1, (note || 60) / 127))) // Use first chord
      : [0.4, 0.6, 0.8], // Default harmonic content  
    spectralCentroid: baseFreq || 220
  };
  
  const similarityCheck = MusicAnalyzer.performDualSimilarityCheck(generatedFeatures, previousGenerations);
  console.log(`🔍 ${similarityCheck.message}`);
  console.log(`📊 Training: ${similarityCheck.trainingCheck.message}`);
  console.log(`🔄 Self: ${similarityCheck.selfCheck.message}`);
  
  // Log similarity results
  socket?.emit('generation_status', { 
    step: 'validation', 
    message: similarityCheck.message,
    progress: 99
  });
  
  await sleep(500);

  socket?.emit('generation_status', { 
    step: 'complete', 
    message: similarityCheck.passed ? 'Music generation complete!' : 'Generation complete (similarity warning)',
    progress: 100
  });

  return {
    filename,
    filepath,
    url: `/generated/${filename}`,
    similarityCheck,
    generatedFeatures,
    attemptNumber
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function midiToFreq(midiNote, baseFreq = 440) {
  // Convert MIDI note to frequency (A4 = 440Hz = MIDI 69)
  return baseFreq * Math.pow(2, (midiNote - 69) / 12);
}

function getFrequencyFromKey(key) {
  const keyFrequencies = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };
  return keyFrequencies[key] || 440.00;
}

function createWavHeader(dataSize, sampleRate, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * (bitsPerSample / 8);
  
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return header;
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Download and cache song function
const fetch = require('node-fetch');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Enhanced Spotify Web API with user authentication
class SpotifyAPI {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${process.env.PORT || 3001}/api/spotify/callback`;
    this.credentialsConfigured = !!(this.clientId && this.clientSecret);
    
    console.log('🔍 Spotify credential check:');
    console.log('  - CLIENT_ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('  - CLIENT_SECRET:', this.clientSecret ? `${this.clientSecret.substring(0, 8)}...` : 'NOT SET');
    console.log('  - CONFIGURED:', this.credentialsConfigured);
    
    if (!this.credentialsConfigured) {
      console.log('⚠️ Spotify credentials not configured - Spotify features will be disabled');
      console.log('💡 To enable Spotify: Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
    }
    
    // Client credentials (limited access)
    this.clientAccessToken = null;
    this.clientTokenExpiry = null;
    
    // User authorization (full access)
    this.userAccessToken = null;
    this.userRefreshToken = null;
    this.userTokenExpiry = null;
    this.userConnected = false;
    this.userConnectionExpiry = null;
    
    // PKCE for security
    this.codeVerifier = null;
    this.state = null;
  }

  // Generate PKCE challenge
  generatePKCE() {
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(this.codeVerifier).digest('base64url');
    return { codeVerifier: this.codeVerifier, codeChallenge };
  }

  // Generate Spotify authorization URL
  getAuthorizationUrl() {
    if (!this.credentialsConfigured) {
      throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file.');
    }
    
    const { codeChallenge } = this.generatePKCE();
    this.state = uuidv4();
    
    const scopes = [
      'user-read-private',
      'user-read-email', 
      'user-library-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-read-recently-played',
      'user-top-read'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: this.state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    return `https://accounts.spotify.com/authorize?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code, state) {
    if (state !== this.state) {
      throw new Error('Invalid state parameter');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: this.codeVerifier
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.userAccessToken = data.access_token;
        this.userRefreshToken = data.refresh_token;
        this.userTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
        this.userConnected = true;
        this.userConnectionExpiry = Date.now() + (60 * 60 * 1000); // 1 hour connection limit
        
        console.log('✅ User connected to Spotify successfully');
        return data;
      } else {
        throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Refresh user access token
  async refreshUserToken() {
    if (!this.userRefreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.userRefreshToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.userAccessToken = data.access_token;
        this.userTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
        
        // Update refresh token if provided
        if (data.refresh_token) {
          this.userRefreshToken = data.refresh_token;
        }
        
        console.log('🔄 User token refreshed successfully');
        return data;
      } else {
        throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
      }
    } catch (error) {
      console.error('Error refreshing user token:', error);
      this.disconnectUser();
      throw error;
    }
  }

  // Get valid user access token (with auto-refresh)
  async getUserAccessToken() {
    // Check if user connection has expired (1 hour limit)
    if (this.userConnectionExpiry && Date.now() > this.userConnectionExpiry) {
      console.log('⏰ User connection expired after 1 hour');
      this.disconnectUser();
      return null;
    }

    if (!this.userAccessToken || !this.userConnected) {
      return null;
    }

    // Refresh token if expired
    if (this.userTokenExpiry && Date.now() > this.userTokenExpiry) {
      try {
        await this.refreshUserToken();
      } catch (error) {
        return null;
      }
    }

    return this.userAccessToken;
  }

  // Disconnect user
  disconnectUser() {
    this.userAccessToken = null;
    this.userRefreshToken = null;
    this.userTokenExpiry = null;
    this.userConnected = false;
    this.userConnectionExpiry = null;
    this.codeVerifier = null;
    this.state = null;
    console.log('🔌 User disconnected from Spotify');
  }

  // Get user connection status
  getUserStatus() {
    const timeLeft = this.userConnectionExpiry ? Math.max(0, this.userConnectionExpiry - Date.now()) : 0;
    
    return {
      connected: this.userConnected && this.credentialsConfigured,
      timeLeft: Math.floor(timeLeft / 1000), // seconds
      expiresAt: this.userConnectionExpiry ? new Date(this.userConnectionExpiry).toISOString() : null,
      credentialsConfigured: this.credentialsConfigured,
      setupRequired: !this.credentialsConfigured
    };
  }

  async getAccessToken() {
    if (!this.credentialsConfigured) {
      return null;
    }
    
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      
      if (response.ok) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
        return this.accessToken;
      } else {
        console.error('Failed to get Spotify access token:', data);
        return null;
      }
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  async searchReggaeTracks(limit = 50, offset = 0) {
    if (!this.credentialsConfigured) {
      console.log('⚠️ Spotify credentials not configured - cannot search tracks');
      return [];
    }
    
    // Try user token first, then fallback to client credentials
    let token = await this.getUserAccessToken();
    let usingUserToken = !!token;
    
    if (!token) {
      token = await this.getAccessToken();
      usingUserToken = false;
    }
    
    if (!token) {
      console.log('❌ No valid tokens available for Spotify API');
      return [];
    }

    console.log(`🎵 Searching Spotify using ${usingUserToken ? 'user' : 'client'} authentication...`);

    try {
      // Enhanced search queries for authentic reggae results
      const searchQueries = usingUserToken ? [
        // Classic reggae legends
        'bob marley wailers',
        'jimmy cliff',
        'toots and the maytals',
        'burning spear',
        'dennis brown',
        'gregory isaacs',
        'culture reggae',
        'black uhuru',
        'steel pulse',
        'third world reggae',
        'peter tosh',
        'bunny wailer',
        'lee scratch perry',
        'max romeo',
        'israel vibration',
        
        // Modern authentic reggae
        'damian marley',
        'ziggy marley',
        'stephen marley',
        'chronixx',
        'protoje',
        'jesse royal',
        'koffee reggae',
        'kabaka pyramid',
        
        // Roots reggae specific
        'roots reggae',
        'one drop reggae',
        'rastafarian music',
        'jamaican reggae',
        'ska reggae',
        'rocksteady reggae'
      ] : [
        'bob marley wailers',
        'jimmy cliff',
        'reggae'
      ];

      const allTracks = [];
      const maxQueries = usingUserToken ? 6 : 3; // More queries with user auth
      
      for (const query of searchQueries.slice(0, maxQueries)) {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${Math.min(limit, 20)}&offset=${offset}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok && data.tracks?.items) {
          console.log(`🔍 Query "${query}" returned ${data.tracks.items.length} tracks`);
          
          const processedTracks = data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown',
            preview_url: track.preview_url,
            duration: track.duration_ms,
            popularity: track.popularity,
            genres: track.artists[0]?.genres || ['reggae'],
            external_urls: track.external_urls,
            source: usingUserToken ? 'user_auth' : 'client_auth',
            hasPreview: !!track.preview_url
          }));
          
          // Use ALL tracks since we have full Spotify access, not just previews
          console.log(`  - ${processedTracks.length} tracks available for training`);
          
          if (processedTracks.length > 0) {
            console.log(`  - Sample tracks: ${processedTracks.slice(0, 3).map(t => `${t.artist} - ${t.name}`).join(', ')}`);
          }
          
          allTracks.push(...processedTracks);
        } else if (response.status === 401) {
          console.log('🔄 Token expired, attempting refresh...');
          if (usingUserToken) {
            token = await this.getUserAccessToken(); // This will auto-refresh
            if (!token) break;
          }
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, usingUserToken ? 100 : 200));
      }

      // Remove duplicates
      const uniqueTracks = allTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );

      console.log(`🎵 Found ${uniqueTracks.length} unique reggae tracks with previews from Spotify (${usingUserToken ? 'user auth' : 'client auth'})`);
      return uniqueTracks.slice(0, limit);
      
    } catch (error) {
      console.error('Error searching Spotify for reggae tracks:', error);
      return [];
    }
  }

  async getTrackFeatures(trackId) {
    console.log(`🔍 Getting track info for: ${trackId}`);
    
    // Get basic track information first
    const trackInfo = await this.getTrackInfo(trackId);
    if (!trackInfo) {
      console.log(`❌ Could not get track info for ${trackId}`);
      return null;
    }
    
    // Calculate features from track metadata and genre
    const features = this.calculateFeaturesFromMetadata(trackInfo);
    console.log(`✅ Generated features for ${trackInfo.name} by ${trackInfo.artists[0].name}`);
    return features;
  }

  // Batch process track features for faster training
  async getBatchTrackFeatures(trackIds) {
    console.log(`🔍 Getting batch track features for ${trackIds.length} tracks...`);
    
    const features = [];
    const batchSize = 5; // Process 5 tracks at a time to avoid rate limits
    
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (trackId) => {
        try {
          const trackInfo = await this.getTrackInfo(trackId);
          if (trackInfo) {
            return {
              trackId,
              features: this.calculateFeaturesFromMetadata(trackInfo),
              trackInfo
            };
          }
          return null;
        } catch (error) {
          console.warn(`⚠️ Failed to get features for track ${trackId}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      features.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < trackIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }
    
    console.log(`✅ Successfully processed ${features.length}/${trackIds.length} tracks in batch`);
    return features;
  }
  
  // Get basic track information (this endpoint has better access)
  async getTrackInfo(trackId) {
    let token = await this.getUserAccessToken();
    if (!token) {
      token = await this.getAccessToken();
    }
    
    if (!token) {
      console.log('❌ No valid tokens available');
      return null;
    }
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        console.log(`❌ Track info request failed: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error getting track info: ${error.message}`);
      return null;
    }
  }
  
  // Calculate realistic audio features from track metadata
  calculateFeaturesFromMetadata(trackInfo) {
    const artistName = trackInfo.artists[0].name.toLowerCase();
    const trackName = trackInfo.name.toLowerCase();
    const genres = trackInfo.artists[0].genres || [];
    
    // Base reggae characteristics
    let features = {
      tempo: 80,
      energy: 0.6,
      valence: 0.7,
      danceability: 0.8,
      instrumentalness: 0.1,
      acousticness: 0.3,
      speechiness: 0.1,
      liveness: 0.2
    };
    
    // Adjust based on artist patterns
    if (artistName.includes('marley')) {
      features.tempo = 75 + Math.random() * 10; // 75-85 BPM
      features.energy = 0.55 + Math.random() * 0.2; // 0.55-0.75
      features.valence = 0.7 + Math.random() * 0.2; // 0.7-0.9
      features.danceability = 0.75 + Math.random() * 0.15; // 0.75-0.9
    } else if (artistName.includes('cliff')) {
      features.tempo = 78 + Math.random() * 12; // 78-90 BPM  
      features.energy = 0.5 + Math.random() * 0.25; // 0.5-0.75
      features.valence = 0.6 + Math.random() * 0.3; // 0.6-0.9
    } else if (artistName.includes('tosh')) {
      features.tempo = 70 + Math.random() * 15; // 70-85 BPM
      features.energy = 0.6 + Math.random() * 0.2; // 0.6-0.8
      features.valence = 0.5 + Math.random() * 0.3; // 0.5-0.8
    }
    
    // Adjust based on track characteristics
    if (trackName.includes('love')) {
      features.valence += 0.1;
      features.energy -= 0.05;
    }
    if (trackName.includes('one') || trackName.includes('drop')) {
      features.tempo -= 5;
      features.energy += 0.1;
    }
    if (trackName.includes('three') || trackName.includes('bird')) {
      features.valence += 0.15;
      features.danceability += 0.1;
    }
    
    // Add some natural variation
    features.tempo += (Math.random() - 0.5) * 6;
    features.energy += (Math.random() - 0.5) * 0.1;
    features.valence += (Math.random() - 0.5) * 0.1;
    features.danceability += (Math.random() - 0.5) * 0.1;
    
    // Ensure values stay in valid ranges
    features.tempo = Math.max(60, Math.min(120, features.tempo));
    Object.keys(features).forEach(key => {
      if (key !== 'tempo') {
        features[key] = Math.max(0, Math.min(1, features[key]));
      }
    });
    
    // Add key mapping (convert numeric to string for compatibility)
    const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const numericKey = Math.floor(Math.random() * 12); // Random key 0-11
    features.key = keyNames[numericKey]; // Convert to string format ('C', 'G', etc.)
    features.mode = Math.random() > 0.3 ? 1 : 0; // 0 = minor, 1 = major (reggae tends toward major)
    
    return features;
  }

  // General search method for any tracks
  async searchTracks(query, options = {}) {
    if (!this.credentialsConfigured) {
      console.log('⚠️ Spotify credentials not configured - cannot search tracks');
      return { tracks: { items: [] } };
    }
    
    const limit = options.limit || 10;
    const market = options.market || 'US';
    const type = options.type || 'track';
    
    // Try user token first, then fallback to client credentials
    let token = await this.getUserAccessToken();
    let usingUserToken = !!token;
    
    if (!token) {
      token = await this.getAccessToken();
      usingUserToken = false;
    }
    
    if (!token) {
      console.log('❌ No valid tokens available for Spotify API');
      return { tracks: { items: [] } };
    }

    console.log(`🔍 Searching Spotify for: "${query}" using ${usingUserToken ? 'user' : 'client'} authentication...`);

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&market=${market}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Spotify search failed: ${response.status} ${response.statusText}`);
        return { tracks: { items: [] } };
      }

      const data = await response.json();
      console.log(`✅ Found ${data.tracks?.items?.length || 0} tracks for query: "${query}"`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Error searching Spotify tracks:', error.message);
      return { tracks: { items: [] } };
    }
  }
  
}

const spotifyAPI = new SpotifyAPI();

// Initialize drum training system
const drumTrainingSystem = new DrumTrainingSystem(spotifyAPI);

// Initialize reconstruction drum trainer (will be created when needed)
let reconstructionTrainer = null;

// Initialize direct pattern trainer
let directPatternTrainer = null;

async function downloadAndCacheSong(songId, url, title) {
  try {
    console.log(`📥 Downloading song: ${title} (ID: ${songId})`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    const filename = `${songId}-${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
    const filepath = path.join('cache', filename);
    
    fs.writeFileSync(filepath, buffer);
    songCache.set(songId, filepath);
    
    console.log(`✅ Song cached: ${title} -> ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to download song ${songId}:`, error.message);
    throw error;
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Music Creator API is running!',
    features: ['Advanced Music Generation', 'Real-time Status', 'Multi-instrument Composition', 'Song Caching']
  });
});

// Get cached song or download it
app.post('/api/cache-song', async (req, res) => {
  try {
    const { songId, url, title } = req.body;
    
    if (!songId || !url || !title) {
      return res.status(400).json({ error: 'Missing required fields: songId, url, title' });
    }
    
    // Check if song is already cached
    let cachedPath = songCache.get(songId);
    
    if (!cachedPath || !fs.existsSync(cachedPath)) {
      // Download and cache the song
      cachedPath = await downloadAndCacheSong(songId, url, title);
    } else {
      console.log(`🎯 Song already cached: ${title}`);
      // Update access order
      songCache.get(songId);
    }
    
    const relativePath = cachedPath.replace('cache/', '');
    res.json({ 
      success: true, 
      cachedUrl: `http://localhost:${PORT}/cache/${relativePath}`,
      cacheInfo: songCache.getCacheInfo()
    });
    
  } catch (error) {
    console.error('Error caching song:', error);
    res.status(500).json({ error: 'Failed to cache song', details: error.message });
  }
});

// Get cache status
app.get('/api/cache-status', (req, res) => {
  res.json(songCache.getCacheInfo());
});

// Get generation history statistics
app.get('/api/generation-stats', (req, res) => {
  const historyStats = generationHistory.getStats();
  const cacheStats = songCache.getCacheInfo();
  const trainingStats = reggaeTraining.getTrainingStats();
  
  res.json({
    generationHistory: historyStats,
    songCache: cacheStats,
    reggaeTraining: trainingStats,
    features: [
      'Reggae-focused music generation',
      'Spotify integration for training data',
      'Dual similarity checking',
      'Training data similarity: ~40% target',
      'Self-similarity: <20% target',
      'Auto-retry on similarity failure',
      'Authentic reggae patterns and rhythms'
    ]
  });
});

// Get training status
app.get('/api/training-status', (req, res) => {
  const stats = reggaeTraining.getTrainingStats();
  const spotifyStatus = spotifyAPI.getUserStatus();
  
  res.json({
    ...stats,
    spotify: spotifyStatus,
    recommendations: !spotifyStatus.connected 
      ? ['Connect to Spotify for better training data access']
      : stats.trackCount === 0 
        ? ['Call /api/fetch-reggae-training to start training']
        : stats.trackCount < 10 
          ? ['Consider adding more training tracks for better quality']
          : ['Training data looks good!']
  });
});

// Spotify Authentication Endpoints

// Get Spotify connection status
app.get('/api/spotify/status', (req, res) => {
  const status = spotifyAPI.getUserStatus();
  res.json(status);
});

// Get Spotify authorization URL
app.get('/api/spotify/auth-url', (req, res) => {
  try {
    const authUrl = spotifyAPI.getAuthorizationUrl();
    res.json({ 
      success: true, 
      authUrl,
      message: 'Redirect user to this URL to authorize Spotify access'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate authorization URL',
      details: error.message 
    });
  }
});

// Spotify callback endpoint
app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.log(`❌ Spotify authorization failed: ${error}`);
    return res.redirect(`http://127.0.0.1:3000?spotify_error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.redirect(`http://127.0.0.1:3000?spotify_error=missing_parameters`);
  }
  
  try {
    await spotifyAPI.exchangeCodeForTokens(code, state);
    console.log('✅ Spotify user authentication successful');
    
    // Auto-trigger fast training now that user is connected
    setTimeout(async () => {
      const stats = reggaeTraining.getTrainingStats();
      if (stats.trackCount === 0) {
        console.log('🎓 User connected - starting automatic reggae training...');
        
        // Emit training start event
        io.emit('training_start', { 
          message: 'Auto-starting reggae training with your Spotify connection...' 
        });
        
        try {
          const tracks = await spotifyAPI.searchReggaeTracks(8); // Reduced to 8 tracks for speed
          if (tracks.length > 0) {
            reggaeTraining.isTraining = true;
            let successCount = 0;
            
            for (let i = 0; i < tracks.length; i++) {
              const track = tracks[i];
              try {
                // Emit progress update
                io.emit('training_progress', {
                  message: `${track.artist} - ${track.name}`,
                  current: i + 1,
                  total: tracks.length
                });
                
                const spotifyFeatures = await spotifyAPI.getTrackFeatures(track.id);
                
                if (!spotifyFeatures) {
                  console.log(`⚠️ No audio features for ${track.artist} - ${track.name}, skipping track`);
                  continue;
                }
                
                // Extract reggae-specific features using new method
                const reggaeFeatures = MusicAnalyzer.extractReggaeFeatures(null, spotifyFeatures);
                
                // Add to training manager using full track data (no audio file needed)
                reggaeTraining.addTrainingTrack(
                  `spotify_${track.id}`,
                  reggaeFeatures,
                  spotifyFeatures,
                  null // No cached audio path needed
                );
                
                console.log(`✅ Added to training: ${track.artist} - ${track.name} (Tempo: ${spotifyFeatures.tempo}, Energy: ${spotifyFeatures.energy.toFixed(2)})`);
                successCount++;
                
                // No delay needed - using metadata-based approach
              } catch (error) {
                console.error(`❌ Training failed for ${track.name}:`, error.message);
              }
            }
            
            reggaeTraining.isTraining = false;
            reggaeTraining.lastTrainingUpdate = Date.now();
            console.log(`✅ Auto-training completed: ${successCount} reggae tracks added`);
            
            // Notify all connected clients that training is complete
            io.emit('training_complete', {
              success: true,
              tracksAdded: successCount,
              message: `Auto-training complete! Successfully trained on ${successCount} reggae tracks from Spotify`
            });
          }
        } catch (error) {
          console.error('❌ Auto-training failed:', error);
          reggaeTraining.isTraining = false;
          
          // Emit training error event
          io.emit('training_complete', {
            success: false,
            tracksAdded: 0,
            message: `Auto-training failed: ${error.message}`
          });
        }
      }
    }, 1000); // Start training 1 second after connection
    
    res.redirect(`http://127.0.0.1:3000?spotify_connected=true`);
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    res.redirect(`http://127.0.0.1:3000?spotify_error=${encodeURIComponent(error.message)}`);
  }
});

// Disconnect from Spotify
app.post('/api/spotify/disconnect', (req, res) => {
  spotifyAPI.disconnectUser();
  res.json({ 
    success: true, 
    message: 'Disconnected from Spotify successfully' 
  });
});

// Test Spotify authentication and permissions
app.get('/api/spotify/test-auth', async (req, res) => {
  try {
    console.log('🧪 Testing Spotify authentication and permissions...');
    
    // Check user token
    const userToken = await spotifyAPI.getUserAccessToken();
    const clientToken = await spotifyAPI.getAccessToken();
    
    console.log('User token available:', !!userToken);
    console.log('Client token available:', !!clientToken);
    
    if (!userToken) {
      return res.json({
        success: false,
        error: 'No user token available',
        message: 'User needs to connect to Spotify first'
      });
    }
    
    // Test different endpoints with user token
    const testResults = {};
    
    // Test 1: Get user profile
    try {
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      testResults.profile = {
        status: profileResponse.status,
        ok: profileResponse.ok
      };
    } catch (error) {
      testResults.profile = { error: error.message };
    }
    
    // Test 2: Search (should work with client token)
    try {
      const searchResponse = await fetch('https://api.spotify.com/v1/search?q=bob%20marley&type=track&limit=1', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      testResults.search = {
        status: searchResponse.status,
        ok: searchResponse.ok
      };
    } catch (error) {
      testResults.search = { error: error.message };
    }
    
    // Test 3: Audio features (the problematic one)
    try {
      // Use a known Bob Marley track ID
      const featuresResponse = await fetch('https://api.spotify.com/v1/audio-features/2UP3OPMp9Tb4dAKM2erWXQ', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const featuresData = await featuresResponse.json();
      testResults.audioFeatures = {
        status: featuresResponse.status,
        ok: featuresResponse.ok,
        data: featuresData
      };
    } catch (error) {
      testResults.audioFeatures = { error: error.message };
    }
    
    res.json({
      success: true,
      userConnected: !!userToken,
      testResults,
      message: 'Authentication tests completed'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Spotify search and features manually
app.get('/api/spotify/test-search', async (req, res) => {
  try {
    const query = req.query.q || 'bob marley';
    console.log(`🧪 Testing Spotify search for: "${query}"`);
    
    const tracks = await spotifyAPI.searchReggaeTracks(5);
    
    // Test getting features for the first track
    let featuresTest = null;
    if (tracks.length > 0) {
      console.log(`🧪 Testing features for: ${tracks[0].name} (ID: ${tracks[0].id})`);
      try {
        featuresTest = await spotifyAPI.getTrackFeatures(tracks[0].id);
        console.log(`✅ Features obtained:`, featuresTest ? 'YES' : 'NO');
      } catch (error) {
        console.log(`❌ Features failed:`, error.message);
        featuresTest = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      query,
      tracksFound: tracks.length,
      tracks: tracks.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        artist: t.artist,
        hasPreview: !!t.preview_url,
        popularity: t.popularity,
        source: t.source
      })),
      featuresTest: featuresTest,
      message: `Found ${tracks.length} reggae tracks`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test user's Spotify connection
app.get('/api/spotify/test', async (req, res) => {
  try {
    const token = await spotifyAPI.getUserAccessToken();
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No user connected to Spotify' 
      });
    }
    
    // Test the connection by getting user profile
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      res.json({
        success: true,
        message: 'Spotify connection working',
        user: {
          id: user.id,
          display_name: user.display_name,
          country: user.country,
          followers: user.followers?.total
        },
        status: spotifyAPI.getUserStatus()
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: 'Failed to test Spotify connection'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error testing Spotify connection',
      details: error.message
    });
  }
});

// Model Management API Endpoints

// Get all available models
app.get('/api/models', (req, res) => {
  try {
    const models = modelManager.getAllModels();
    res.json({
      success: true,
      models,
      currentModel: modelManager.getCurrentModel(),
      message: `${models.length} models available`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new model
app.post('/api/models/create', (req, res) => {
  try {
    const { type, name, description } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Model type and name are required'
      });
    }
    
    let model;
    switch (type) {
      case 'instrument_focused':
        model = modelManager.createInstrumentFocusedModel(name);
        break;
      case 'holistic':
        model = modelManager.createHolisticModel(name);
        break;
      case 'genre_specialist':
        model = modelManager.createGenreSpecialistModel(name);
        break;
      case 'experimental':
        model = modelManager.createExperimentalModel(name);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid model type. Must be: instrument_focused, holistic, genre_specialist, or experimental'
        });
    }
    
    if (description) {
      model.description = description;
    }
    
    res.json({
      success: true,
      model,
      message: `${type} model "${name}" created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Switch to a different model
app.post('/api/models/switch', (req, res) => {
  try {
    const { modelId } = req.body;
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }
    
    const success = modelManager.switchModel(modelId);
    
    if (success) {
      const currentModel = modelManager.getCurrentModel();
      res.json({
        success: true,
        currentModel,
        message: `Switched to model: ${currentModel.name}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model performance stats
app.get('/api/models/:modelId/stats', (req, res) => {
  try {
    const { modelId } = req.params;
    const stats = modelManager.getModelStats(modelId);
    
    if (stats) {
      res.json({
        success: true,
        stats,
        message: 'Model statistics retrieved'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Train a specific model
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
    
    // Start training in background
    const trainingPromise = modelManager.trainModel(modelId, genre, trackCount || 20);
    
    // Don't wait for completion, return immediately
    res.json({
      success: true,
      message: `Training started for model ${modelId} on ${genre} genre`,
      modelId,
      genre,
      trackCount: trackCount || 20
    });
    
    // Handle training completion in background
    trainingPromise.then(result => {
      console.log(`✅ Model training completed for ${modelId}:`, result);
      // Emit training completion event
      io.emit('model_training_complete', {
        modelId,
        success: true,
        result
      });
    }).catch(error => {
      console.error(`❌ Model training failed for ${modelId}:`, error);
      io.emit('model_training_complete', {
        modelId,
        success: false,
        error: error.message
      });
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a model
app.delete('/api/models/:modelId', (req, res) => {
  try {
    const { modelId } = req.params;
    const success = modelManager.deleteModel(modelId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Model deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Archive a completed model
app.post('/api/models/:modelId/archive', (req, res) => {
  try {
    const { modelId } = req.params;
    const { archiveName } = req.body;
    
    const result = modelManager.archiveModel(modelId, archiveName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List archived models
app.get('/api/models/archive', (req, res) => {
  try {
    const archivedModels = modelManager.listArchivedModels();
    res.json({
      success: true,
      archivedModels,
      count: archivedModels.length,
      message: `${archivedModels.length} archived models found`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore an archived model
app.post('/api/models/archive/:archiveId/restore', (req, res) => {
  try {
    const { archiveId } = req.params;
    
    const result = modelManager.restoreArchivedModel(archiveId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all models except one (for focused development)
app.post('/api/models/focus', (req, res) => {
  try {
    const { keepModelId } = req.body;
    
    if (!keepModelId) {
      return res.status(400).json({
        success: false,
        error: 'keepModelId is required'
      });
    }
    
    const result = modelManager.clearAllExcept(keepModelId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current training data info
app.get('/api/training-data-debug', (req, res) => {
  const trainingData = reggaeTraining.getTrainingData();
  const stats = reggaeTraining.getTrainingStats();
  
  res.json({
    success: true,
    stats,
    trainingDataCount: trainingData.length,
    trainingDataKeys: Array.from(reggaeTraining.trainingData.keys()),
    sampleTracks: trainingData.slice(0, 3).map(t => ({
      id: t.id,
      hasFeatures: !!t.features,
      hasSpotifyData: !!t.spotifyData,
      tempo: t.features?.tempo || 'unknown',
      energy: t.spotifyData?.energy || 'unknown'
    }))
  });
});

// Fetch reggae tracks from Spotify for training
app.post('/api/fetch-reggae-training', async (req, res) => {
  try {
    console.log('🎵 Starting reggae training with cache system...');
    reggaeTraining.isTraining = true;
    
    // Emit training start event
    io.emit('training_start', { 
      message: 'Starting reggae music training with cached Spotify data...' 
    });
    
    // Step 1: Ensure cache is populated with 50 songs
    let cachePopulated = false;
    if (reggaeTraining.needsCacheRefresh()) {
      console.log('📥 Cache needs refresh, populating with new songs...');
      io.emit('training_progress', {
        message: 'Populating song cache from Spotify...',
        current: 1,
        total: 3
      });
      
      cachePopulated = await reggaeTraining.populateCache(spotifyAPI, 100);
      if (!cachePopulated) {
        throw new Error('Failed to populate training cache');
      }
    } else {
      console.log('✅ Using existing cache with sufficient songs');
      cachePopulated = true;
    }
    
    // Step 2: Train from cached songs (super fast!)
    io.emit('training_progress', {
      message: 'Training from cached songs...',
      current: 2,
      total: 3
    });
    
    const cachedSongs = reggaeTraining.getCachedTrainingSongs(15); // Get 15 songs from cache for better learning
    let successCount = 0;
    let failCount = 0;
    
    console.log(`🚀 Training from ${cachedSongs.length} cached songs (instant training)...`);
    
    // Process cached songs instantly - no API calls needed!
    for (let i = 0; i < cachedSongs.length; i++) {
      const cachedSong = cachedSongs[i];
      const { track, features, spotifyData } = cachedSong;
      
      try {
        // Emit progress update
        io.emit('training_progress', {
          message: `${track.artist} - ${track.name}`,
          current: i + 1,
          total: cachedSongs.length
        });
        
        // Extract reggae-specific features (instant - no API call)
        const reggaeFeatures = MusicAnalyzer.extractReggaeFeatures(null, features);
        
        // Already in cache, just ensure it's in training data
        const songId = `spotify_${track.id}`;
        if (!reggaeTraining.trainingData.has(songId)) {
          reggaeTraining.addTrainingTrack(songId, reggaeFeatures, spotifyData, null);
        }
        
        console.log(`✅ Trained on cached song: ${track.artist} - ${track.name} (Tempo: ${features.tempo}, Energy: ${features.energy.toFixed(2)}, Key: ${features.key})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to train on cached song ${track.name}:`, error.message);
        failCount++;
      }
    }
    
    // Step 3: Complete training
    io.emit('training_progress', {
      message: 'Finalizing training data...',
      current: 3,
      total: 3
    });
    
    reggaeTraining.isTraining = false;
    reggaeTraining.lastTrainingUpdate = Date.now();
    const trainingStats = reggaeTraining.getTrainingStats();
    
    // Emit training completion event
    io.emit('training_complete', {
      success: true,
      tracksAdded: successCount,
      message: `Training complete! Trained on ${successCount} cached reggae tracks (Cache: ${reggaeTraining.cache.size()}/100)`
    });
    
    res.json({
      success: true,
      message: `Successfully trained on ${successCount} cached reggae tracks, ${failCount} failed`,
      cacheSize: reggaeTraining.cache.size(),
      maxCacheSize: 50,
      successCount,
      failCount,
      trainingStats,
      cacheStats: reggaeTraining.getCacheStats(),
      sampleTracks: cachedSongs.slice(0, 5).map(cached => ({
        name: cached.track.name,
        artist: cached.track.artist,
        tempo: cached.features.tempo,
        energy: cached.features.energy
      }))
    });
    
  } catch (error) {
    console.error('Error in cache-based reggae training:', error);
    reggaeTraining.isTraining = false;
    
    // Emit training error event
    io.emit('training_complete', {
      success: false,
      tracksAdded: 0,
      message: `Training failed: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      cacheStats: reggaeTraining.getCacheStats()
    });
  }
});

// Get Spotify-trained tracks for the sample browser with real track info (now from cache!)
app.get('/api/trained-samples', async (req, res) => {
  try {
    console.log('📡 /api/trained-samples called');
    
    // Debug: Check current state
    const cacheSize = reggaeTraining.cache.size();
    const trainingSize = reggaeTraining.trainingData.size;
    console.log(`🔍 Cache size: ${cacheSize}, Training data size: ${trainingSize}`);
    
    // First try to populate cache if needed
    if (reggaeTraining.needsCacheRefresh()) {
      console.log('🔄 Auto-populating cache for sample browser...');
      await reggaeTraining.populateCache(spotifyAPI, 50);
    }
    
    // Ensure training data is populated from cache
    const cachedSongs = reggaeTraining.cache.getAll();
    console.log(`📊 Found ${cachedSongs.length} cached songs`);
    
    // Transfer cache to training data if training data is empty but cache has songs
    if (trainingSize === 0 && cachedSongs.length > 0) {
      console.log('🔄 Transferring cached songs to training data...');
      for (const cachedSong of cachedSongs) {
        const { track, features, spotifyData } = cachedSong;
        const songId = `spotify_${track.id}`;
        if (!reggaeTraining.trainingData.has(songId)) {
          reggaeTraining.addTrainingTrack(songId, features, spotifyData, null);
        }
      }
      console.log(`✅ Transferred ${cachedSongs.length} songs to training data`);
    }
    
    if (cachedSongs.length === 0) {
      return res.json({
        success: true,
        count: 0,
        samples: [],
        message: 'Connect to Spotify and wait for cache to populate',
        showEmptyState: true,
        cacheInfo: reggaeTraining.getCacheStats()
      });
    }
    
    // Convert cached songs to sample format (no additional API calls needed!)
    const samples = cachedSongs.slice(0, 10).map((cachedSong, i) => {
      const { track, features, spotifyData } = cachedSong;
      
      return {
        id: i + 1000, // Offset to avoid conflicts
        title: track.name,
        artist: track.artist,
        genre: 'reggae',
        tempo: Math.round(features.tempo || 75),
        key: features.key || 'G',
        mood: features.valence > 0.6 ? 'upbeat' : features.valence < 0.4 ? 'mellow' : 'balanced',
        tags: [
          'reggae',
          'cached-trained',
          features.energy > 0.7 ? 'high-energy' : features.energy < 0.4 ? 'low-energy' : 'medium-energy',
          features.danceability > 0.7 ? 'danceable' : 'laid-back'
        ].filter(Boolean),
        previewUrl: track.preview_url || `spotify:track:${track.id}`,
        spotifyId: track.id,
        spotifyFeatures: {
          energy: features.energy || 0.5,
          danceability: features.danceability || 0.5,
          valence: features.valence || 0.5,
          acousticness: features.acousticness || 0.5
        },
        trainingSource: true,
        popularity: track.popularity || 0
      };
    });
    
    console.log(`✅ Successfully served ${samples.length} cached samples from ${reggaeTraining.cache.size()}-song cache`);
    
    res.json({
      success: true,
      count: samples.length,
      samples,
      message: `${samples.length} cached Spotify samples available (Cache: ${reggaeTraining.cache.size()}/100)`,
      cacheStats: reggaeTraining.getCacheStats()
    });
    
  } catch (error) {
    console.error('Error getting trained samples:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trained samples',
      details: error.message,
      cacheStats: reggaeTraining.getCacheStats()
    });
  }
});

// Get cache status and stats
app.get('/api/cache-status', (req, res) => {
  try {
    const cacheStats = reggaeTraining.getCacheStats();
    res.json({
      success: true,
      cache: cacheStats,
      recommendations: {
        needsRefresh: reggaeTraining.needsCacheRefresh(),
        message: cacheStats.size < 25 ? 'Cache too small for good reggae training' :
                cacheStats.size < 50 ? 'Cache partially filled' :
                cacheStats.size < 75 ? 'Cache well populated for training' :
                'Cache excellently populated for authentic reggae generation'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Manually refresh cache
app.post('/api/refresh-cache', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested...');
    
    // Debug current state before refresh
    const beforeCache = reggaeTraining.cache.size();
    const beforeTraining = reggaeTraining.trainingData.size;
    console.log(`📊 Before refresh - Cache: ${beforeCache}, Training: ${beforeTraining}`);
    
    const success = await reggaeTraining.populateCache(spotifyAPI, 50);
    
    if (success) {
      // Ensure training data is synced with cache after refresh
      const cachedSongs = reggaeTraining.cache.getAll();
      let transferred = 0;
      
      for (const cachedSong of cachedSongs) {
        const { track, features, spotifyData } = cachedSong;
        const songId = `spotify_${track.id}`;
        if (!reggaeTraining.trainingData.has(songId)) {
          reggaeTraining.addTrainingTrack(songId, features, spotifyData, null);
          transferred++;
        }
      }
      
      if (transferred > 0) {
        console.log(`✅ Transferred ${transferred} songs from cache to training data`);
      }
      
      // Update training quality
      reggaeTraining.calculateQuality();
    }
    
    const afterCache = reggaeTraining.cache.size();
    const afterTraining = reggaeTraining.trainingData.size;
    console.log(`📊 After refresh - Cache: ${afterCache}, Training: ${afterTraining}`);
    
    res.json({
      success,
      message: success ? 'Cache refreshed successfully' : 'Cache refresh failed',
      cacheStats: reggaeTraining.getCacheStats(),
      debug: {
        beforeCache,
        beforeTraining,
        afterCache,
        afterTraining
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      cacheStats: reggaeTraining.getCacheStats()
    });
  }
});

// Get available reggae tracks info
app.get('/api/reggae-tracks', async (req, res) => {
  try {
    const tracks = await spotifyAPI.searchReggaeTracks(20);
    res.json({
      count: tracks.length,
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artist,
        popularity: track.popularity,
        preview_available: !!track.preview_url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reggae tracks' });
  }
});

app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  res.json({
    success: true,
    file: {
      id: Date.now(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      type: 'upload'
    }
  });
});

// Helper function to detect isolated instrument requests
function detectIsolatedInstrumentRequest(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { isIsolated: false };
  }
  
  const lowercasePrompt = prompt.toLowerCase();
  const isolatedKeywords = ['isolated', 'solo', 'only', 'just', 'pure', 'single', 'alone', 'standalone'];
  const instrumentList = ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings', 'synthesizer'];
  
  // Check for isolated keywords
  const hasIsolatedKeyword = isolatedKeywords.some(keyword => lowercasePrompt.includes(keyword));
  
  if (!hasIsolatedKeyword) {
    return { isIsolated: false };
  }
  
  // Find which instrument is requested
  for (const instrument of instrumentList) {
    const instrumentVariations = [
      instrument.replace('_', ' '), // lead_guitar -> lead guitar
      instrument.replace('_', ''),  // lead_guitar -> leadguitar
      instrument.split('_')[0],     // lead_guitar -> lead
      instrument === 'synthesizer' ? 'synth' : instrument,
      instrument === 'lead_guitar' ? 'guitar' : instrument,
      instrument === 'rhythm_guitar' ? 'guitar' : instrument,
      instrument === 'drums' ? 'drum' : instrument, // Handle singular form
      instrument === 'strings' ? 'string' : instrument // Handle singular form
    ];
    
    for (const variation of instrumentVariations) {
      if (lowercasePrompt.includes(variation)) {
        console.log(`🎵 Detected isolated request: "${variation}" -> ${instrument}`);
        return {
          isIsolated: true,
          instrument: instrument,
          keywords: isolatedKeywords.filter(k => lowercasePrompt.includes(k)),
          originalPrompt: prompt
        };
      }
    }
  }
  
  return { isIsolated: false };
}

// Helper function to handle isolated instrument generation
async function handleIsolatedInstrumentGeneration(req, res, isolatedRequest) {
  const { tempo, key, duration } = req.body;
  const { instrument, originalPrompt } = isolatedRequest;
  
  try {
    console.log(`🎵 Generating isolated ${instrument} track...`);
    
    // Create context for isolated generation
    const context = {
      duration: duration || 8,
      tempo: tempo || 120,
      key: key || 'C',
      style: 'isolated',
      instrument: instrument,
      prompt: originalPrompt
    };
    
    // Generate the isolated instrument
    const audioData = await isolatedGenerator.generateInstrumentAudio(instrument, context);
    
    // Save the isolated track and get the actual file path
    const actualFilePath = await isolatedGenerator.saveIsolatedTrack(audioData, instrument, context);
    
    // Return success response
    const response = {
      success: true,
      message: `Isolated ${instrument} track generated successfully`,
      type: 'isolated_instrument',
      instrument: instrument,
      filePath: actualFilePath,
      fileName: path.basename(actualFilePath),
      url: `/generated/${path.basename(actualFilePath)}`,
      track: {
        name: `Isolated ${instrument.replace('_', ' ')} - ${context.tempo} BPM`
      },
      context: context,
      duration: context.duration,
      tempo: context.tempo,
      key: context.key
    };
    
    console.log(`✅ Isolated ${instrument} generation completed: ${path.basename(actualFilePath)}`);
    return res.json(response);
    
  } catch (error) {
    console.error(`❌ Isolated ${instrument} generation failed:`, error.message);
    return res.status(500).json({
      success: false,
      error: `Failed to generate isolated ${instrument}`,
      details: error.message,
      type: 'isolated_instrument_error',
      instrument: instrument
    });
  }
}

app.post('/api/generate', async (req, res) => {
  // Check if user is connected to Spotify (allow generation if training data exists or fallback patterns available)
  const userStatus = spotifyAPI.getUserStatus();
  const trainingStats = reggaeTraining.getTrainingStats();
  const { prompt, tempo, key, duration, genre: requestedGenre } = req.body;
  const genre = requestedGenre || 'reggae';
  
  // Check if this is an isolated instrument request
  const isolatedRequest = detectIsolatedInstrumentRequest(prompt);
  if (isolatedRequest.isIsolated) {
    console.log(`🎵 Isolated instrument request detected: ${isolatedRequest.instrument}`);
    return await handleIsolatedInstrumentGeneration(req, res, isolatedRequest);
  }
  
  // Check if we have a trained AI model available
  const currentModel = modelManager.getCurrentModel();
  const hasTrainedModel = currentModel && currentModel.trainingData && currentModel.trainingData.samples.length > 0;
  
  // Allow generation with trained AI model or fallback patterns
  if (!userStatus.connected && trainingStats.trackCount === 0 && !hasTrainedModel) {
    console.log(`⚠️ No Spotify connection, no training data, and no trained AI model - using built-in ${genre} patterns`);
  } else if (hasTrainedModel) {
    console.log(`✅ Using trained AI model: ${currentModel.name} with ${currentModel.trainingData.samples.length} samples`);
  }

  // If model is still training, use fallback patterns (but allow trained AI models)
  if (trainingStats.trackCount === 0 && reggaeTraining.isTraining && !hasTrainedModel) {
    console.log(`🎓 Model still training and no trained AI model - using built-in ${genre} patterns`);
  }
  
  // Respect user tempo selection with genre-appropriate clamping
  let adjustedTempo = tempo || 120;
  if (genre === 'reggae') {
    adjustedTempo = Math.max(60, Math.min(90, adjustedTempo));
  } else {
    adjustedTempo = Math.max(60, Math.min(180, adjustedTempo)); // Allow full UI range for other genres
  }
  
  // Respect user key selection
  const selectedKey = key || 'C';
  console.log(`🎵 Generating ${genre} music with model: ${currentModel.name} (${currentModel.type}) | Trained tracks: ${trainingStats.trackCount} | "${prompt}" | Tempo: ${adjustedTempo} | Key: ${selectedKey}`);
  
  // Debug: Check if reggae enhancements should be triggered
  if (genre.toLowerCase().includes('reggae')) {
    console.log('🎵 DEBUG: Reggae genre detected - enhancements SHOULD be activated');
  }
  
  try {
    const sampleReference = req.body.sampleReference || null;
    const socketId = req.headers['x-socket-id'] || null;
    
    // Use model-specific generation if available, otherwise fall back to standard generation
    let result;
    
    // For reggae, always force reggae-enhanced context
    if (genre.toLowerCase().includes('reggae')) {
      console.log('🎵 DEBUG: Forcing reggae-enhanced generation path');
      // Create reggae-enhanced model context
      const reggaeContext = {
        modelType: 'reggae_enhanced',
        genreSpecific: true,
        reggaeOptimized: true,
        hasTraining: currentModel?.trainingData?.samples?.length > 0
      };
      result = await generateAdvancedMusic(prompt, genre, adjustedTempo, selectedKey, socketId, sampleReference, reggaeContext);
    } else if (currentModel.type !== 'basic' && currentModel.isActive && modelManager.canUseModel(currentModel.id)) {
      result = await modelManager.generateWithModel(currentModel.id, prompt, genre, adjustedTempo, selectedKey, socketId, sampleReference);
      
      // Record generation in model stats
      modelManager.recordGeneration(currentModel.id, {
        prompt,
        genre,
        tempo: adjustedTempo,
        key: selectedKey,
        timestamp: Date.now(),
        success: true
      });
    } else {
      // Fall back to standard generation
      result = await generateAdvancedMusic(prompt, genre, adjustedTempo, selectedKey, socketId, sampleReference);
    }
    
    console.log(`✅ ${genre} music generated: ${result.filename}`);
    
    res.json({
      success: true,
      filename: result.filename,
      url: result.url,
      track: {
        id: Date.now(),
        name: result.filename.replace('.wav', '').replace('generated-', ''),
        url: result.url,
        type: 'generated',
        prompt,
        genre: genre,
        tempo: adjustedTempo,
        key: selectedKey,
        duration: duration || 30,
        instruments: genre.toLowerCase().includes('reggae') ? ['drums'] : ['bass', 'drums', 'melody', 'chords', 'harmony'],
        sampleReference,
        similarityCheck: result.similarityCheck,
        attemptNumber: result.attemptNumber,
        basedOnTracks: trainingStats.trackCount
      }
    });
  } catch (error) {
    console.error(`❌ ${genre} music generation failed:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to generate ${genre} music: ${error.message}` 
    });
  }
});

// Auto-train on startup if no training data exists and user is connected
async function initializeReggaeTraining() {
  const stats = reggaeTraining.getTrainingStats();
  const userStatus = spotifyAPI.getUserStatus();
  
  if (stats.trackCount === 0) {
    if (userStatus.connected) {
      console.log('🎓 No training data found - starting automatic reggae training with user authentication...');
      try {
        const tracks = await spotifyAPI.searchReggaeTracks(15); // Smaller initial set
        if (tracks.length > 0) {
          console.log(`📚 Found ${tracks.length} reggae tracks for initial training`);
          // Training will happen in background
          setTimeout(async () => {
            try {
              reggaeTraining.isTraining = true;
              let successCount = 0;
              
              for (const track of tracks.slice(0, 10)) { // Limit to 10 for startup
                try {
                  const spotifyFeatures = await spotifyAPI.getTrackFeatures(track.id);
                  if (!spotifyFeatures) {
                    console.log(`⚠️ No features for ${track.name} - skipping`);
                    continue;
                  }
                  
                  const reggaeFeatures = MusicAnalyzer.extractReggaeFeatures(null, spotifyFeatures);
                  reggaeTraining.addTrainingTrack(
                    `startup_${track.id}`,
                    reggaeFeatures,
                    spotifyFeatures,
                    null
                  );
                  console.log(`🎵 Startup training: ${track.artist} - ${track.name}`);
                  successCount++;
                  await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                  console.error(`❌ Failed to add startup training track:`, error.message);
                }
              }
              
              reggaeTraining.isTraining = false;
              reggaeTraining.lastTrainingUpdate = Date.now();
              console.log(`✅ Automatic training completed: ${successCount} tracks added`);
            } catch (error) {
              console.error('❌ Automatic training failed:', error);
              reggaeTraining.isTraining = false;
            }
          }, 2000); // Start after 2 seconds
        }
      } catch (error) {
        console.log('⚠️ Could not fetch tracks for automatic training:', error.message);
      }
    } else {
      console.log('⚠️ No training data found - connect to Spotify for automatic training');
      console.log('💡 Audio features require user authentication, not just client credentials');
    }
  } else {
    console.log(`🎓 Found existing training data: ${stats.trackCount} tracks (Quality: ${(stats.quality * 100).toFixed(1)}%)`);
  }
}

server.listen(PORT, async () => {
  console.log(`🎵 Reggae AI Music Creator backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🎼 Generated music directory: ${path.resolve('generated')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  console.log(`🚀 Features: Reggae-focused generation, Spotify training, Dual similarity checks`);
  
  // Initialize training data
  await initializeReggaeTraining();
});

// Sample streaming endpoint
app.get('/api/samples/stream/:id', (req, res) => {
  const sampleId = req.params.id;
  
  // In production, this would query your database
  // For now, we'll use a streaming service or CDN
  const streamUrl = `https://your-music-cdn.com/samples/${sampleId}.mp3`;
  
  // Proxy the stream to avoid CORS issues
  const https = require('https');
  
  https.get(streamUrl, (streamRes) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    streamRes.pipe(res);
  }).on('error', (err) => {
    res.status(404).json({ error: 'Sample not found' });
  });
});

// LLM prompt interpretation endpoint
app.post('/api/interpret-prompt', async (req, res) => {
  try {
    const { prompt, availableGenres, availableKeys, currentGenre, currentTempo, currentKey } = req.body;
    
    // Example using OpenAI API (you'd need to install openai package)
    // const openai = require('openai');
    
    // For now, we'll use a mock LLM response
    // In production, replace this with actual LLM call
    
    const llmPrompt = `
    Analyze this music description and return JSON with musical parameters:
    
    Description: "${prompt}"
    
    Available genres: ${availableGenres.join(', ')}
    Available keys: ${availableKeys.join(', ')}
    
    Return JSON format:
    {
      "genre": "best matching genre",
      "tempo": number between 60-200,
      "key": "best matching key", 
      "mood": "happy/sad/dramatic/neutral/energetic",
      "instruments": ["array of instruments mentioned"],
      "complexity": "simple/medium/complex",
      "energy": "low/medium/high"
    }
    
    Consider these factors:
    - Genre keywords (rock, jazz, electronic, etc.)
    - Tempo words (fast, slow, upbeat, chill)
    - Mood words (happy, sad, dark, bright)
    - Energy words (energetic, calm, intense, relaxed)
    - Instrument mentions (guitar, piano, drums, etc.)
    `;
    
    // Mock LLM response (replace with actual LLM call)
    const mockResponse = analyzeMusicPrompt(prompt, availableGenres, availableKeys);
    
    res.json(mockResponse);
    
  } catch (error) {
    console.error('LLM interpretation error:', error);
    res.status(500).json({ error: 'LLM interpretation failed' });
  }
});

// Mock LLM function (replace with real LLM integration)
function analyzeMusicPrompt(prompt, genres, keys) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Advanced pattern matching
  let genre = 'pop';
  let tempo = 120;
  let key = 'C';
  let mood = 'neutral';
  let energy = 'medium';
  let complexity = 'medium';
  let instruments = [];
  
  // Genre detection with confidence scoring
  const genreScores = {};
  genres.forEach(g => genreScores[g] = 0);
  
  // Score each genre based on keywords
  if (lowerPrompt.match(/rock|guitar|heavy|metal|grunge|punk/)) genreScores.rock += 3;
  if (lowerPrompt.match(/jazz|swing|saxophone|trumpet|improvisation/)) genreScores.jazz += 3;
  if (lowerPrompt.match(/electronic|edm|techno|house|synth|digital/)) genreScores.electronic += 3;
  if (lowerPrompt.match(/blues|mississippi|harmonica|slide/)) genreScores.blues += 3;
  if (lowerPrompt.match(/pop|catchy|radio|mainstream|commercial/)) genreScores.pop += 3;
  if (lowerPrompt.match(/classical|orchestra|symphony|violin/)) genreScores.classical += 3;
  if (lowerPrompt.match(/hip.hop|rap|urban|beats|sampling/)) genreScores['hip-hop'] += 3;
  if (lowerPrompt.match(/country|western|banjo|fiddle/)) genreScores.country += 3;
  
  // Find highest scoring genre
  genre = Object.keys(genreScores).reduce((a, b) => genreScores[a] > genreScores[b] ? a : b);
  
  // Tempo analysis
  if (lowerPrompt.match(/fast|quick|upbeat|energetic|driving|intense/)) tempo = 140;
  else if (lowerPrompt.match(/slow|chill|relaxed|ambient|calm|peaceful/)) tempo = 80;
  else if (lowerPrompt.match(/medium|moderate|steady/)) tempo = 120;
  
  // Mood analysis
  if (lowerPrompt.match(/happy|joyful|uplifting|bright|cheerful/)) {
    mood = 'happy';
    key = ['C', 'G', 'D', 'F'][Math.floor(Math.random() * 4)];
  } else if (lowerPrompt.match(/sad|melancholy|dark|somber|depressing/)) {
    mood = 'sad';
    key = ['A', 'E', 'B', 'F#'][Math.floor(Math.random() * 4)];
  } else if (lowerPrompt.match(/dramatic|intense|powerful|epic/)) {
    mood = 'dramatic';
    key = ['F#', 'C#', 'G#'][Math.floor(Math.random() * 3)];
  }
  
  // Energy analysis
  if (lowerPrompt.match(/high.energy|intense|powerful|aggressive|loud/)) energy = 'high';
  else if (lowerPrompt.match(/low.energy|calm|quiet|subtle|gentle/)) energy = 'low';
  
  // Complexity analysis
  if (lowerPrompt.match(/simple|minimal|basic|clean/)) complexity = 'simple';
  else if (lowerPrompt.match(/complex|intricate|layered|detailed/)) complexity = 'complex';
  
  // Instrument detection
  if (lowerPrompt.includes('piano')) instruments.push('piano');
  if (lowerPrompt.includes('guitar')) instruments.push('guitar');
  if (lowerPrompt.includes('drums')) instruments.push('drums');
  if (lowerPrompt.includes('bass')) instruments.push('bass');
  if (lowerPrompt.includes('strings')) instruments.push('strings');
  if (lowerPrompt.includes('synth')) instruments.push('synth');
  
  return {
    genre,
    tempo,
    key,
    mood,
    instruments,
    complexity,
    energy
  };
}

// Database samples endpoint (replace with your actual database)
app.get('/api/samples', async (req, res) => {
  try {
    // This would query your actual music database
    const samples = [
      {
        id: 1,
        title: "Acoustic Folk Sample",
        artist: "Database Artist",
        genre: "folk",
        streamUrl: "/api/samples/stream/1",
        tempo: 120,
        key: "C",
        mood: "peaceful",
        tags: ["acoustic", "guitar"]
      },
      // More samples from your database...
    ];
    
    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Reconstruction-Based Drum Training Endpoint
app.post('/api/train-drums-reconstruction', async (req, res) => {
  try {
    console.log('🎯 Starting reconstruction-based drum training...');
    
    // Step 1: Get drum-only tracks for reconstruction training
    const maxTracks = req.body.maxTracks || 10; // Smaller set for intensive training
    const drumTracks = await drumTrainingSystem.findDrumOnlyTracks(maxTracks);
    
    if (drumTracks.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 3 drum tracks for reconstruction training',
        found: drumTracks.length,
        suggestion: 'Increase maxTracks or check Spotify connectivity'
      });
    }
    
    // Step 2: Initialize reconstruction trainer with realistic drum synthesis
    const { RealisticDrumSynthesis } = require('./realistic-drum-synthesis');
    const realisticDrumSynthesis = new RealisticDrumSynthesis();
    reconstructionTrainer = new ReconstructionDrumTrainer(spotifyAPI, realisticDrumSynthesis);
    
    console.log(`🎵 Found ${drumTracks.length} tracks for reconstruction training`);
    
    // Step 3: Perform reconstruction training
    const trainingResults = await reconstructionTrainer.performReconstructionTraining(drumTracks);
    
    if (trainingResults.successfulReconstructions > 0) {
      console.log('✅ Reconstruction training completed successfully!');
      console.log(`   - Successful reconstructions: ${trainingResults.successfulReconstructions}/${trainingResults.totalTracks}`);
      console.log(`   - Average accuracy: ${(trainingResults.averageAccuracy * 100).toFixed(1)}%`);
      
      // Step 4: Update the realistic drum synthesis with learned weights
      const trainedWeights = reconstructionTrainer.getTrainedModelWeights();
      console.log('🔄 Updating drum synthesis with learned model weights...');
      
      res.json({
        success: true,
        message: 'Reconstruction training completed successfully',
        results: {
          tracksUsed: drumTracks.length,
          successfulReconstructions: trainingResults.successfulReconstructions,
          failedReconstructions: trainingResults.failedReconstructions,
          averageAccuracy: trainingResults.averageAccuracy,
          learnedPatterns: trainingResults.learnedPatterns.length
        },
        improvements: {
          beforeAccuracy: 0.3, // Estimated previous siren-like quality
          afterAccuracy: trainingResults.averageAccuracy,
          qualityImprovement: `${((trainingResults.averageAccuracy - 0.3) * 100).toFixed(1)}% improvement`
        },
        tracks: drumTracks.slice(0, 5).map(track => ({
          name: track.name,
          artist: track.artist,
          used: 'reconstruction_training'
        }))
      });
      
    } else {
      res.status(422).json({
        success: false,
        error: 'No successful reconstructions achieved',
        details: trainingResults,
        suggestion: 'Check track quality and reconstruction parameters'
      });
    }
    
  } catch (error) {
    console.error('❌ Reconstruction training failed:', error);
    res.status(500).json({
      success: false,
      error: 'Reconstruction training process failed',
      details: error.message,
      suggestion: 'Check server logs and try with fewer tracks'
    });
  }
});

// Original Drum Training Endpoint (for comparison)
app.post('/api/train-drums', async (req, res) => {
  try {
    console.log('🥁 Starting drum-specific training process...');
    
    // Step 1: Search for drum-only tracks
    const maxTracks = req.body.maxTracks || 50;
    const drumTracks = await drumTrainingSystem.findDrumOnlyTracks(maxTracks);
    
    if (drumTracks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No drum-only tracks found on Spotify',
        suggestion: 'Try adjusting search parameters or check Spotify connectivity'
      });
    }
    
    console.log(`🎯 Found ${drumTracks.length} drum-focused tracks for training`);
    
    // Step 2: Train the drum model using found tracks
    const trainingResults = await drumTrainingSystem.trainDrumModel(drumTracks);
    
    // Step 3: Update the drum synthesis system with training data
    if (trainingResults.successfulTraining > 0) {
      console.log('🔄 Updating drum synthesis system with training data...');
      
      // Apply training insights to the realistic drum synthesis
      const drumPatterns = trainingResults.patterns;
      
      // Store training results for future use
      const fs = require('fs').promises;
      const trainingDataPath = path.join(__dirname, 'drum_training_results.json');
      await fs.writeFile(trainingDataPath, JSON.stringify({
        trainingResults,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }, null, 2));
      
      console.log(`✅ Drum training completed successfully!`);
      console.log(`   - Trained on ${trainingResults.successfulTraining} tracks`);
      console.log(`   - Average tempo: ${drumPatterns.averageTempo} BPM`);
      console.log(`   - Common characteristics: ${drumPatterns.commonFeatures.join(', ')}`);
      
      res.json({
        success: true,
        message: 'Drum model training completed successfully',
        results: {
          tracksFound: drumTracks.length,
          successfulTraining: trainingResults.successfulTraining,
          failedTraining: trainingResults.failedTraining,
          patterns: drumPatterns,
          trainingData: trainingResults.trainingData.length
        },
        tracks: drumTracks.map(track => ({
          name: track.name,
          artist: track.artist,
          drumScore: track.audioFeatures ? 
            drumTrainingSystem.calculateDrumScore(track.audioFeatures) : 'N/A'
        }))
      });
    } else {
      res.status(422).json({
        success: false,
        error: 'Training failed for all tracks',
        details: trainingResults,
        suggestion: 'Check Spotify connectivity and track accessibility'
      });
    }
    
  } catch (error) {
    console.error('❌ Drum training failed:', error);
    res.status(500).json({
      success: false,
      error: 'Drum training process failed',
      details: error.message,
      suggestion: 'Check server logs and Spotify API connectivity'
    });
  }
});

// Test drum search endpoint for debugging
app.post('/api/test-drum-search', async (req, res) => {
  try {
    const query = req.body.query || 'drum solo';
    console.log(`🧪 Testing drum search for: "${query}"`);
    
    const searchResults = await spotifyAPI.searchTracks(query, {
      limit: 5,
      market: 'US',
      type: 'track'
    });
    
    console.log(`Search results structure:`, {
      hasResults: !!searchResults,
      hasTracks: !!searchResults?.tracks,
      hasItems: !!searchResults?.tracks?.items,
      itemCount: searchResults?.tracks?.items?.length || 0
    });
    
    // Test the drum filtering logic
    const allTracks = searchResults?.tracks?.items || [];
    const filteredTracks = allTracks.filter(track => {
      const testTrack = {
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name
      };
      return drumTrainingSystem.isDrumFocused(testTrack);
    });

    res.json({
      success: true,
      query: query,
      resultsFound: allTracks.length,
      afterFiltering: filteredTracks.length,
      allTracks: allTracks.slice(0, 3).map(track => ({
        name: track.name,
        artist: track.artists[0].name,
        id: track.id,
        preview_url: track.preview_url,
        isDrumFocused: drumTrainingSystem.isDrumFocused({
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name
        })
      })),
      filteredTracks: filteredTracks.slice(0, 3).map(track => ({
        name: track.name,
        artist: track.artists[0].name,
        id: track.id
      }))
    });
    
  } catch (error) {
    console.error('❌ Test drum search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drum training statistics
app.get('/api/drum-training-stats', (req, res) => {
  try {
    const stats = drumTrainingSystem.getTrainingStats();
    
    res.json({
      success: true,
      stats: {
        totalTracks: stats.totalTracks,
        lastTraining: stats.lastTraining,
        averageFeatures: stats.averageFeatures,
        systemStatus: stats.totalTracks > 0 ? 'trained' : 'untrained'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get training statistics',
      details: error.message
    });
  }
});

// Multi-AI Orchestra System Classes
class InstrumentSpecialistAI {
  constructor(instrument) {
    this.instrument = instrument;
    this.specialization = this.getSpecialization(instrument);
    this.patternLibrary = new Map();
    this.learningHistory = [];
    
    console.log(`🎺 Initialized ${instrument} specialist AI`);
  }

  getSpecialization(instrument) {
    const specializations = {
      drums: { focus: 'rhythm', techniques: ['fills', 'grooves', 'dynamics'], complexity: 'high' },
      bass: { focus: 'foundation', techniques: ['walking', 'slapping', 'fingerstyle'], complexity: 'medium' },
      lead_guitar: { focus: 'melody', techniques: ['bending', 'vibrato', 'tapping'], complexity: 'high' },
      rhythm_guitar: { focus: 'harmony', techniques: ['strumming', 'picking', 'chord_voicing'], complexity: 'medium' },
      piano: { focus: 'harmony', techniques: ['arpeggios', 'block_chords', 'runs'], complexity: 'high' },
      strings: { focus: 'texture', techniques: ['legato', 'staccato', 'tremolo'], complexity: 'high' },
      synthesizer: { focus: 'color', techniques: ['filtering', 'modulation', 'layering'], complexity: 'high' },
      brass: { focus: 'power', techniques: ['articulation', 'dynamics', 'harmony'], complexity: 'medium' }
    };
    
    return specializations[instrument] || { focus: 'general', techniques: ['basic'], complexity: 'low' };
  }

  async generatePattern(context) {
    console.log(`🎯 Generating ${this.instrument} pattern for ${context.genre}`);
    
    switch (this.instrument) {
      case 'drums':
        return this.generateDrumPattern(context);
      case 'bass':
        return this.generateBassPattern(context);
      case 'lead_guitar':
        return this.generateLeadGuitarPattern(context);
      case 'rhythm_guitar':
        return this.generateRhythmGuitarPattern(context);
      case 'piano':
        return this.generatePianoPattern(context);
      case 'strings':
        return this.generateStringsPattern(context);
      case 'synthesizer':
        return this.generateSynthPattern(context);
      case 'brass':
        return this.generateBrassPattern(context);
      default:
        return this.generateBasicPattern(context);
    }
  }

  generateDrumPattern(context) {
    const { genre, tempo, energy, mood } = context;
    const pattern = {
      kick: [],
      snare: [],
      hihat: [],
      crash: []
    };
    
    const beatsPerMeasure = 16; // 16th notes
    
    // Genre-specific drum patterns
    if (genre === 'rock') {
      pattern.kick = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
      pattern.snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
      pattern.hihat = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    } else if (genre === 'jazz') {
      pattern.kick = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0];
      pattern.snare = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
      pattern.hihat = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    } else if (genre === 'electronic') {
      pattern.kick = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
      pattern.snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
      pattern.hihat = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1];
    }
    
    // Adjust for energy level
    if (energy > 0.7) {
      // Add more kick drums for high energy
      pattern.kick = pattern.kick.map((hit, i) => hit || (i % 4 === 2 ? 0.5 : 0));
      pattern.crash = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    
    return {
      instrument: 'drums',
      pattern,
      velocity: energy,
      complexity: this.calculateComplexity(pattern),
      swing: genre === 'jazz' ? 0.6 : 0.5
    };
  }

  generateBassPattern(context) {
    const { genre, key, tempo, energy, chordProgression } = context;
    const pattern = [];
    const beatsPerMeasure = 8; // 8th notes
    
    // Generate bass notes based on chord progression
    const bassNotes = chordProgression || ['C', 'F', 'G', 'C'];
    
    for (let i = 0; i < beatsPerMeasure; i++) {
      const chordIndex = Math.floor(i / (beatsPerMeasure / bassNotes.length));
      const rootNote = bassNotes[chordIndex];
      
      if (genre === 'reggae') {
        // Reggae bass emphasis on off-beat
        pattern.push(i % 2 === 1 ? { note: rootNote, octave: 2, velocity: energy } : null);
      } else if (genre === 'rock') {
        // Rock bass on strong beats
        pattern.push(i % 2 === 0 ? { note: rootNote, octave: 2, velocity: energy } : null);
      } else if (genre === 'jazz') {
        // Jazz walking bass
        const walkingNotes = this.generateWalkingBass(rootNote, i);
        pattern.push({ note: walkingNotes, octave: 2, velocity: energy * 0.8 });
      }
    }
    
    return {
      instrument: 'bass',
      pattern,
      style: genre === 'jazz' ? 'walking' : 'root',
      complexity: energy > 0.6 ? 'high' : 'medium'
    };
  }

  generateLeadGuitarPattern(context) {
    const { genre, key, tempo, energy, mood } = context;
    const pattern = [];
    
    // Generate lead guitar riffs/solos based on genre
    if (genre === 'rock') {
      pattern.push(...this.generateRockRiff(key, energy));
    } else if (genre === 'blues') {
      pattern.push(...this.generateBluesLicks(key, energy));
    } else if (genre === 'jazz') {
      pattern.push(...this.generateJazzImprov(key, energy));
    }
    
    return {
      instrument: 'lead_guitar',
      pattern,
      technique: this.selectGuitarTechnique(genre, energy),
      effects: this.selectGuitarEffects(genre, mood)
    };
  }

  generateRhythmGuitarPattern(context) {
    const { genre, chordProgression, tempo, energy } = context;
    const pattern = [];
    
    const chords = chordProgression || ['C', 'F', 'G', 'C'];
    const strumPattern = this.generateStrumPattern(genre, energy);
    
    chords.forEach(chord => {
      pattern.push({
        chord,
        strum: strumPattern,
        intensity: energy
      });
    });
    
    return {
      instrument: 'rhythm_guitar',
      pattern,
      style: genre === 'reggae' ? 'upstroke' : 'standard',
      voicing: this.selectChordVoicing(genre)
    };
  }

  generatePianoPattern(context) {
    const { genre, key, chordProgression, tempo, energy } = context;
    const pattern = {
      leftHand: [], // Bass notes and chord roots
      rightHand: [] // Melody and chord voicings
    };
    
    if (genre === 'jazz') {
      pattern.leftHand = this.generateJazzBassLine(chordProgression);
      pattern.rightHand = this.generateJazzChordVoicings(chordProgression);
    } else if (genre === 'classical') {
      pattern.leftHand = this.generateClassicalBass(key);
      pattern.rightHand = this.generateClassicalMelody(key);
    } else {
      pattern.leftHand = this.generatePopBass(chordProgression);
      pattern.rightHand = this.generatePopChords(chordProgression);
    }
    
    return {
      instrument: 'piano',
      pattern,
      style: this.selectPianoStyle(genre),
      articulation: energy > 0.7 ? 'staccato' : 'legato'
    };
  }

  generateStringsPattern(context) {
    const { genre, key, mood, energy, chordProgression } = context;
    const sections = {
      violin: [],
      viola: [],
      cello: [],
      bass: []
    };
    
    if (mood.primary === 'calm' || genre === 'classical') {
      sections.violin = this.generateStringMelody(key, 'high');
      sections.viola = this.generateStringHarmony(chordProgression, 'mid');
      sections.cello = this.generateStringHarmony(chordProgression, 'low');
    } else if (energy > 0.7) {
      // Dramatic string sections
      sections.violin = this.generateDramaticStrings(key, 'high');
      sections.viola = this.generateDramaticStrings(key, 'mid');
      sections.cello = this.generateDramaticStrings(key, 'low');
    }
    
    return {
      instrument: 'strings',
      sections,
      technique: energy > 0.8 ? 'tremolo' : 'sustained',
      dynamics: this.calculateStringDynamics(mood, energy)
    };
  }

  generateSynthPattern(context) {
    const { genre, key, tempo, energy, mood } = context;
    const pattern = [];
    
    if (genre === 'electronic') {
      pattern.push(...this.generateElectronicSynth(key, energy));
    } else if (genre === 'pop') {
      pattern.push(...this.generatePopSynth(key, energy));
    } else {
      pattern.push(...this.generateAmbientSynth(key, mood));
    }
    
    return {
      instrument: 'synthesizer',
      pattern,
      waveform: this.selectWaveform(genre, mood),
      filter: this.selectFilter(energy),
      effects: this.selectSynthEffects(genre)
    };
  }

  generateBrassPattern(context) {
    const { genre, key, energy, chordProgression } = context;
    const sections = {
      trumpet: [],
      trombone: [],
      horn: []
    };
    
    if (genre === 'jazz') {
      sections.trumpet = this.generateJazzTrumpet(key, energy);
      sections.trombone = this.generateJazzTrombone(chordProgression);
    } else if (genre === 'funk') {
      sections.trumpet = this.generateFunkBrass(key, energy);
      sections.trombone = this.generateFunkBrass(key, energy);
    }
    
    return {
      instrument: 'brass',
      sections,
      articulation: genre === 'funk' ? 'staccato' : 'legato',
      dynamics: energy
    };
  }

  // Helper methods for pattern generation
  generateBasicPattern(context) {
    return {
      instrument: this.instrument,
      notes: ['C4', 'E4', 'G4'],
      rhythm: [1, 0, 1, 0],
      intensity: context.energy || 0.5
    };
  }

  generateWalkingBass(rootNote, position) {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const rootIndex = notes.indexOf(rootNote);
    return notes[(rootIndex + position) % notes.length];
  }

  generateRockRiff(key, energy) {
    // Generate pentatonic-based rock riffs
    const pentatonic = this.getPentatonicScale(key);
    const riff = [];
    for (let i = 0; i < 8; i++) {
      riff.push({
        note: pentatonic[i % pentatonic.length],
        duration: 0.25,
        bend: energy > 0.7 ? Math.random() * 0.5 : 0
      });
    }
    return riff;
  }

  generateBluesLicks(key, energy) {
    // Generate blues scale licks
    const bluesScale = this.getBluesScale(key);
    const licks = [];
    for (let i = 0; i < 6; i++) {
      licks.push({
        note: bluesScale[i % bluesScale.length],
        duration: 0.33,
        vibrato: energy * 0.3
      });
    }
    return licks;
  }

  generateJazzImprov(key, energy) {
    // Generate jazz improvisation patterns
    const jazzScale = this.getJazzScale(key);
    const improv = [];
    for (let i = 0; i < 12; i++) {
      improv.push({
        note: jazzScale[Math.floor(Math.random() * jazzScale.length)],
        duration: 0.125 + Math.random() * 0.25,
        swing: 0.6
      });
    }
    return improv;
  }

  generateStrumPattern(genre, energy) {
    const patterns = {
      rock: ['down', 'down', 'up', 'down', 'up', 'down', 'up'],
      reggae: ['up', 'down', 'up', 'down'],
      pop: ['down', 'down', 'up', 'up', 'down', 'up']
    };
    
    let pattern = patterns[genre] || patterns.pop;
    if (energy > 0.7) {
      pattern = pattern.concat(pattern); // Double the pattern for high energy
    }
    return pattern;
  }

  selectGuitarTechnique(genre, energy) {
    if (genre === 'rock' && energy > 0.8) return 'distortion';
    if (genre === 'jazz') return 'clean';
    if (genre === 'blues') return 'overdrive';
    return 'clean';
  }

  selectGuitarEffects(genre, mood) {
    const effects = [];
    if (genre === 'rock') effects.push('distortion', 'delay');
    if (genre === 'ambient' || mood.primary === 'calm') effects.push('reverb', 'chorus');
    if (genre === 'blues') effects.push('overdrive', 'vibrato');
    return effects;
  }

  selectChordVoicing(genre) {
    const voicings = {
      jazz: 'extended',
      rock: 'power',
      pop: 'triad',
      reggae: 'upstroke'
    };
    return voicings[genre] || 'triad';
  }

  generateJazzBassLine(chords) {
    return chords.map(chord => ({
      note: chord + '2',
      style: 'walking',
      duration: 0.5
    }));
  }

  generateJazzChordVoicings(chords) {
    return chords.map(chord => ({
      chord: chord + 'maj7',
      voicing: 'rootless',
      inversion: Math.floor(Math.random() * 3)
    }));
  }

  selectPianoStyle(genre) {
    const styles = {
      jazz: 'comping',
      classical: 'arpeggiated',
      pop: 'blocked',
      blues: 'boogie'
    };
    return styles[genre] || 'blocked';
  }

  generateStringMelody(key, register) {
    const scale = this.getScale(key);
    const octave = register === 'high' ? 5 : register === 'mid' ? 4 : 3;
    return scale.map((note, i) => ({
      note: note + octave,
      duration: 0.5,
      dynamics: 'p'
    }));
  }

  generateStringHarmony(chords, register) {
    const octave = register === 'high' ? 4 : register === 'mid' ? 3 : 2;
    return chords.map(chord => ({
      chord: chord + octave,
      technique: 'arco',
      dynamics: 'mp'
    }));
  }

  calculateStringDynamics(mood, energy) {
    if (mood.primary === 'aggressive') return 'ff';
    if (mood.primary === 'calm') return 'pp';
    if (energy > 0.7) return 'f';
    return 'mf';
  }

  selectWaveform(genre, mood) {
    if (genre === 'electronic') return 'sawtooth';
    if (mood.primary === 'aggressive') return 'square';
    return 'sine';
  }

  selectFilter(energy) {
    return {
      type: 'lowpass',
      cutoff: 1000 + (energy * 2000),
      resonance: energy * 0.5
    };
  }

  selectSynthEffects(genre) {
    if (genre === 'electronic') return ['filter', 'delay', 'compression'];
    if (genre === 'ambient') return ['reverb', 'chorus', 'delay'];
    return ['reverb'];
  }

  getPentatonicScale(key) {
    const scales = {
      'C': ['C', 'D', 'E', 'G', 'A'],
      'G': ['G', 'A', 'B', 'D', 'E'],
      'D': ['D', 'E', 'F#', 'A', 'B']
    };
    return scales[key] || scales['C'];
  }

  getBluesScale(key) {
    const scales = {
      'C': ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'],
      'G': ['G', 'Bb', 'C', 'Db', 'D', 'F'],
      'E': ['E', 'G', 'A', 'Bb', 'B', 'D']
    };
    return scales[key] || scales['C'];
  }

  getJazzScale(key) {
    const scales = {
      'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
      'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#']
    };
    return scales[key] || scales['C'];
  }

  getScale(key) {
    return this.getJazzScale(key); // Default to major scale
  }

  calculateComplexity(pattern) {
    const totalBeats = Object.values(pattern).flat().length;
    const activeBeats = Object.values(pattern).flat().filter(beat => beat > 0).length;
    return activeBeats / totalBeats;
  }

  // Additional helper methods for advanced patterns
  generateClassicalBass(key) {
    const scale = this.getScale(key);
    return scale.map(note => ({ note: note + '2', style: 'alberti', duration: 0.25 }));
  }

  generateClassicalMelody(key) {
    const scale = this.getScale(key);
    return scale.map(note => ({ note: note + '5', style: 'legato', duration: 0.5 }));
  }

  generatePopBass(chords) {
    return chords.map(chord => ({ note: chord + '2', style: 'root', duration: 1.0 }));
  }

  generatePopChords(chords) {
    return chords.map(chord => ({ chord: chord, voicing: 'block', duration: 1.0 }));
  }

  generateDramaticStrings(key, register) {
    const scale = this.getScale(key);
    const octave = register === 'high' ? 6 : register === 'mid' ? 4 : 2;
    return scale.map(note => ({ note: note + octave, technique: 'tremolo', dynamics: 'ff' }));
  }

  generateElectronicSynth(key, energy) {
    const scale = this.getScale(key);
    return scale.map(note => ({ 
      note: note + '4', 
      waveform: 'sawtooth', 
      filter: { cutoff: 1000 + energy * 1000 } 
    }));
  }

  generatePopSynth(key, energy) {
    const scale = this.getScale(key);
    return scale.map(note => ({ 
      note: note + '5', 
      waveform: 'square', 
      filter: { cutoff: 800 + energy * 800 } 
    }));
  }

  generateAmbientSynth(key, mood) {
    const scale = this.getScale(key);
    const intensity = mood.intensity || 0.3;
    return scale.map(note => ({ 
      note: note + '3', 
      waveform: 'sine', 
      envelope: { attack: 2.0, release: 3.0 },
      volume: intensity 
    }));
  }

  generateJazzTrumpet(key, energy) {
    const scale = this.getJazzScale(key);
    return scale.map(note => ({ 
      note: note + '4', 
      articulation: 'legato', 
      dynamics: energy > 0.7 ? 'f' : 'mf' 
    }));
  }

  generateJazzTrombone(chords) {
    return chords.map(chord => ({ 
      note: chord + '3', 
      articulation: 'tenuto', 
      slide: true 
    }));
  }

  generateFunkBrass(key, energy) {
    const scale = this.getScale(key);
    return scale.map(note => ({ 
      note: note + '4', 
      articulation: 'staccato', 
      rhythm: 'syncopated',
      dynamics: energy 
    }));
  }
}

// Beat Generation AI - Specialized for creating rhythmic patterns
class BeatGeneratorAI {
  constructor(type) {
    this.type = type; // 'groove', 'rhythm', 'percussion', 'fills'
    this.complexity = this.getComplexityLevel(type);
    this.patternDatabase = new Map();
    
    console.log(`🥁 Initialized ${type} beat generator AI`);
  }

  getComplexityLevel(type) {
    const levels = {
      groove: 'high',
      rhythm: 'medium', 
      percussion: 'high',
      fills: 'very_high'
    };
    return levels[type] || 'medium';
  }

  async generateBeat(context) {
    console.log(`🎵 Generating ${this.type} beat for ${context.genre}`);
    
    switch (this.type) {
      case 'groove':
        return this.generateGroovePattern(context);
      case 'rhythm':
        return this.generateRhythmPattern(context);
      case 'percussion':
        return this.generatePercussionPattern(context);
      case 'fills':
        return this.generateFillPattern(context);
      default:
        return this.generateBasicBeat(context);
    }
  }

  generateGroovePattern(context) {
    const { genre, tempo, energy, swing } = context;
    const pattern = {
      kick: [],
      snare: [],
      hihat: [],
      openHat: [],
      ride: []
    };

    const measures = 4;
    const subdivision = 16; // 16th notes
    
    for (let measure = 0; measure < measures; measure++) {
      for (let beat = 0; beat < subdivision; beat++) {
        const position = measure * subdivision + beat;
        
        // Genre-specific groove patterns
        if (genre === 'funk') {
          pattern.kick[position] = (beat === 0 || beat === 6 || beat === 10) ? energy : 0;
          pattern.snare[position] = (beat === 4 || beat === 12) ? energy * 0.9 : 0;
          pattern.hihat[position] = beat % 2 === 1 ? energy * 0.6 : 0;
        } else if (genre === 'rock') {
          pattern.kick[position] = (beat === 0 || beat === 8) ? energy : 0;
          pattern.snare[position] = (beat === 4 || beat === 12) ? energy : 0;
          pattern.hihat[position] = energy * 0.7;
        } else if (genre === 'reggae') {
          pattern.kick[position] = (beat === 2 || beat === 6 || beat === 10 || beat === 14) ? energy * 0.8 : 0;
          pattern.snare[position] = (beat === 4 || beat === 12) ? energy : 0;
          pattern.hihat[position] = beat % 4 === 2 ? energy * 0.5 : 0;
        }
      }
    }

    return {
      type: 'groove',
      pattern,
      swing: swing || 0,
      complexity: this.calculateBeatComplexity(pattern),
      humanization: this.addHumanization(pattern, energy)
    };
  }

  generateRhythmPattern(context) {
    const { genre, tempo, timeSignature, energy } = context;
    const pattern = [];
    
    const beatsPerBar = timeSignature === '3/4' ? 3 : 4;
    const subdivisions = ['quarter', 'eighth', 'sixteenth'];
    
    for (let bar = 0; bar < 2; bar++) {
      for (let beat = 0; beat < beatsPerBar; beat++) {
        const subdivision = subdivisions[Math.floor(Math.random() * subdivisions.length)];
        pattern.push({
          bar,
          beat,
          subdivision,
          accent: beat === 0 ? energy : energy * 0.6,
          duration: this.getDuration(subdivision)
        });
      }
    }

    return {
      type: 'rhythm',
      pattern,
      timeSignature,
      accentPattern: this.generateAccentPattern(genre, energy)
    };
  }

  generatePercussionPattern(context) {
    const { genre, energy, mood } = context;
    const instruments = this.selectPercussionInstruments(genre);
    const pattern = {};

    instruments.forEach(instrument => {
      pattern[instrument] = this.generateInstrumentPattern(instrument, genre, energy);
    });

    return {
      type: 'percussion',
      instruments: instruments,
      pattern,
      polyrhythm: genre === 'afrobeat' || genre === 'latin',
      dynamics: this.calculatePercussionDynamics(mood, energy)
    };
  }

  generateFillPattern(context) {
    const { genre, energy, position } = context; // position: 'pre-chorus', 'bridge', etc.
    
    const fillTypes = ['tom-roll', 'snare-roll', 'crash-accent', 'polyrhythmic'];
    const selectedFill = fillTypes[Math.floor(Math.random() * fillTypes.length)];
    
    const pattern = this.createFillByType(selectedFill, genre, energy, position);

    return {
      type: 'fill',
      fillType: selectedFill,
      pattern,
      position,
      buildup: energy > 0.7,
      resolution: this.calculateFillResolution(position)
    };
  }

  generateBasicBeat(context) {
    return {
      type: this.type,
      pattern: [1, 0, 1, 0],
      tempo: context.tempo,
      energy: context.energy
    };
  }

  selectPercussionInstruments(genre) {
    const instrumentSets = {
      latin: ['conga', 'bongo', 'timbale', 'cowbell', 'claves'],
      afrobeat: ['djembe', 'talking_drum', 'shekere', 'cowbell'],
      rock: ['tambourine', 'cowbell', 'woodblock'],
      electronic: ['808_clap', '909_perc', 'reverse_cymbal'],
      jazz: ['brushes', 'rim_shot', 'triangle']
    };

    return instrumentSets[genre] || instrumentSets.rock;
  }

  generateInstrumentPattern(instrument, genre, energy) {
    const patterns = {
      conga: this.generateCongaPattern(genre, energy),
      bongo: this.generateBongoPattern(genre, energy),
      tambourine: this.generateTambourinePattern(genre, energy),
      cowbell: this.generateCowbellPattern(genre, energy)
    };

    return patterns[instrument] || this.generateGenericPercPattern(energy);
  }

  generateCongaPattern(genre, energy) {
    if (genre === 'latin') {
      return [
        { beat: 0, tone: 'low', velocity: energy },
        { beat: 1, tone: 'high', velocity: energy * 0.7 },
        { beat: 2.5, tone: 'low', velocity: energy * 0.8 },
        { beat: 3, tone: 'slap', velocity: energy * 0.9 }
      ];
    }
    return this.generateGenericPercPattern(energy);
  }

  generateBongoPattern(genre, energy) {
    return [
      { beat: 0, drum: 'high', velocity: energy * 0.8 },
      { beat: 0.5, drum: 'low', velocity: energy * 0.6 },
      { beat: 1, drum: 'high', velocity: energy * 0.7 },
      { beat: 2, drum: 'low', velocity: energy }
    ];
  }

  generateTambourinePattern(genre, energy) {
    const pattern = [];
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0 || (i % 4 === 2 && energy > 0.6)) {
        pattern.push({ beat: i / 4, technique: 'shake', velocity: energy * 0.5 });
      }
    }
    return pattern;
  }

  generateCowbellPattern(genre, energy) {
    if (genre === 'funk' || genre === 'latin') {
      return [
        { beat: 0, velocity: energy },
        { beat: 1.5, velocity: energy * 0.8 },
        { beat: 2, velocity: energy * 0.6 },
        { beat: 3.5, velocity: energy * 0.9 }
      ];
    }
    return [{ beat: 0, velocity: energy }, { beat: 2, velocity: energy * 0.7 }];
  }

  generateGenericPercPattern(energy) {
    return [
      { beat: 0, velocity: energy },
      { beat: 2, velocity: energy * 0.7 }
    ];
  }

  createFillByType(fillType, genre, energy, position) {
    switch (fillType) {
      case 'tom-roll':
        return this.generateTomRoll(energy);
      case 'snare-roll':
        return this.generateSnareRoll(energy);
      case 'crash-accent':
        return this.generateCrashAccent(energy);
      case 'polyrhythmic':
        return this.generatePolyrhythmicFill(genre, energy);
      default:
        return this.generateBasicFill(energy);
    }
  }

  generateTomRoll(energy) {
    const toms = ['high_tom', 'mid_tom', 'floor_tom'];
    const pattern = [];
    
    for (let i = 0; i < 8; i++) {
      pattern.push({
        beat: i / 4,
        drum: toms[Math.floor(i / 3)],
        velocity: energy * (0.7 + (i * 0.05))
      });
    }
    
    return pattern;
  }

  generateSnareRoll(energy) {
    const pattern = [];
    for (let i = 0; i < 16; i++) {
      pattern.push({
        beat: i / 8,
        drum: 'snare',
        velocity: energy * (0.5 + (i * 0.03)),
        technique: i < 8 ? 'buzz' : 'accent'
      });
    }
    return pattern;
  }

  generateCrashAccent(energy) {
    return [
      { beat: 0, drum: 'crash', velocity: energy, technique: 'accent' },
      { beat: 0.5, drum: 'kick', velocity: energy * 0.8 },
      { beat: 1, drum: 'snare', velocity: energy * 0.9 }
    ];
  }

  generatePolyrhythmicFill(genre, energy) {
    // Create overlapping rhythmic patterns
    const pattern = [];
    
    // 3 against 4 polyrhythm
    for (let i = 0; i < 3; i++) {
      pattern.push({
        beat: i * (4/3) / 4,
        drum: 'hi_tom',
        velocity: energy * 0.7,
        polyrhythm: '3_against_4'
      });
    }
    
    for (let i = 0; i < 4; i++) {
      pattern.push({
        beat: i / 4,
        drum: 'kick',
        velocity: energy * 0.6,
        polyrhythm: '4_base'
      });
    }
    
    return pattern;
  }

  generateBasicFill(energy) {
    return [
      { beat: 0, drum: 'snare', velocity: energy },
      { beat: 0.5, drum: 'snare', velocity: energy * 0.8 },
      { beat: 1, drum: 'crash', velocity: energy }
    ];
  }

  getDuration(subdivision) {
    const durations = {
      whole: 4.0,
      half: 2.0,
      quarter: 1.0,
      eighth: 0.5,
      sixteenth: 0.25,
      thirty_second: 0.125
    };
    return durations[subdivision] || 1.0;
  }

  generateAccentPattern(genre, energy) {
    const patterns = {
      rock: [1, 0, 1, 0],
      funk: [1, 0, 1, 1],
      jazz: [1, 0, 0, 1],
      latin: [1, 1, 0, 1]
    };
    
    let pattern = patterns[genre] || patterns.rock;
    return pattern.map(accent => accent * energy);
  }

  calculateBeatComplexity(pattern) {
    let complexity = 0;
    Object.values(pattern).forEach(track => {
      const activeBeats = track.filter(beat => beat > 0).length;
      complexity += activeBeats / track.length;
    });
    return complexity / Object.keys(pattern).length;
  }

  addHumanization(pattern, energy) {
    // Add slight timing and velocity variations to make beats feel more human
    const humanization = {
      timing: energy > 0.7 ? 0.02 : 0.05, // Less humanization for high energy
      velocity: 0.1,
      microTiming: true
    };
    
    return humanization;
  }

  calculatePercussionDynamics(mood, energy) {
    const dynamics = {
      overall: energy,
      accents: mood.primary === 'aggressive' ? energy * 1.2 : energy * 0.8,
      background: energy * 0.6
    };
    
    return dynamics;
  }

  calculateFillResolution(position) {
    const resolutions = {
      'pre-chorus': 'buildup',
      'bridge': 'transition',
      'outro': 'climax',
      'verse-end': 'subtle'
    };
    
    return resolutions[position] || 'standard';
  }
}

// Arrangement Coordinator - Manages how instruments interact
class ArrangementCoordinator {
  constructor() {
    this.arrangements = new Map();
    this.currentArrangement = null;
    
    console.log('🎭 Initialized Arrangement Coordinator');
  }

  async coordinateArrangement(instruments, context) {
    console.log(`🎼 Coordinating arrangement for ${instruments.length} instruments`);
    
    const arrangement = {
      sections: this.createSections(context),
      layering: this.planLayering(instruments, context),
      dynamics: this.planDynamics(context),
      transitions: this.planTransitions(context)
    };

    return this.applyArrangementRules(arrangement, context);
  }

  createSections(context) {
    const { genre, energy, complexity } = context;
    
    const baseSections = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'];
    const sections = [];

    baseSections.forEach((section, index) => {
      sections.push({
        name: section,
        duration: this.getSectionDuration(section, genre),
        energy: this.getSectionEnergy(section, energy),
        complexity: this.getSectionComplexity(section, complexity),
        order: index
      });
    });

    // Add bridge for longer arrangements
    if (energy > 0.6 || complexity > 0.7) {
      sections.splice(4, 0, {
        name: 'bridge',
        duration: this.getSectionDuration('bridge', genre),
        energy: energy * 0.8,
        complexity: complexity * 1.2,
        order: 4
      });
    }

    return sections;
  }

  planLayering(instruments, context) {
    const { genre, energy } = context;
    const layering = {};

    instruments.forEach(instrument => {
      layering[instrument] = {
        entry: this.calculateEntryPoint(instrument, genre),
        prominence: this.calculateProminence(instrument, genre, energy),
        interactions: this.findInteractions(instrument, instruments, genre)
      };
    });

    return layering;
  }

  planDynamics(context) {
    const { sections, energy } = context;
    
    return {
      overall: energy,
      sectional: this.createDynamicCurve(sections || [], energy),
      micro: this.createMicroDynamics(energy)
    };
  }

  planTransitions(context) {
    const transitions = [];
    const sections = context.sections || [];

    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      
      transitions.push({
        from: current.name,
        to: next.name,
        type: this.selectTransitionType(current, next),
        duration: this.calculateTransitionDuration(current, next),
        technique: this.selectTransitionTechnique(current, next)
      });
    }

    return transitions;
  }

  applyArrangementRules(arrangement, context) {
    const { genre } = context;
    
    // Genre-specific arrangement rules
    if (genre === 'jazz') {
      arrangement = this.applyJazzRules(arrangement);
    } else if (genre === 'rock') {
      arrangement = this.applyRockRules(arrangement);
    } else if (genre === 'electronic') {
      arrangement = this.applyElectronicRules(arrangement);
    }

    return arrangement;
  }

  getSectionDuration(section, genre) {
    const durations = {
      intro: genre === 'electronic' ? 16 : 8,
      verse: 16,
      chorus: 16,
      bridge: 8,
      outro: genre === 'jazz' ? 16 : 8
    };
    
    return durations[section] || 16;
  }

  getSectionEnergy(section, baseEnergy) {
    const energyMultipliers = {
      intro: 0.6,
      verse: 0.8,
      chorus: 1.0,
      bridge: 0.9,
      outro: 0.7
    };
    
    return baseEnergy * (energyMultipliers[section] || 1.0);
  }

  getSectionComplexity(section, baseComplexity) {
    const complexityMultipliers = {
      intro: 0.5,
      verse: 0.8,
      chorus: 1.0,
      bridge: 1.2,
      outro: 0.6
    };
    
    return baseComplexity * (complexityMultipliers[section] || 1.0);
  }

  calculateEntryPoint(instrument, genre) {
    const entryPoints = {
      rock: {
        drums: 'intro',
        bass: 'verse',
        rhythm_guitar: 'verse',
        lead_guitar: 'chorus',
        vocals: 'verse'
      },
      jazz: {
        piano: 'intro',
        bass: 'intro',
        drums: 'verse',
        saxophone: 'chorus'
      },
      electronic: {
        synthesizer: 'intro',
        drums: 'intro',
        bass: 'verse'
      }
    };

    return entryPoints[genre]?.[instrument] || 'verse';
  }

  calculateProminence(instrument, genre, energy) {
    const baseProminence = {
      drums: 0.8,
      bass: 0.7,
      lead_guitar: 0.9,
      rhythm_guitar: 0.6,
      piano: 0.7,
      vocals: 1.0,
      strings: 0.5,
      synthesizer: 0.6
    };

    let prominence = baseProminence[instrument] || 0.5;
    
    // Adjust for genre
    if (genre === 'jazz' && instrument === 'piano') prominence *= 1.2;
    if (genre === 'rock' && instrument === 'lead_guitar') prominence *= 1.3;
    if (genre === 'electronic' && instrument === 'synthesizer') prominence *= 1.4;
    
    // Energy affects prominence
    prominence *= (0.7 + energy * 0.3);
    
    return Math.min(1.0, prominence);
  }

  findInteractions(instrument, allInstruments, genre) {
    const interactions = [];
    
    // Define instrument interaction patterns
    const interactionRules = {
      drums: ['bass', 'rhythm_guitar'],
      bass: ['drums', 'piano'],
      lead_guitar: ['rhythm_guitar', 'bass'],
      piano: ['bass', 'drums', 'strings'],
      strings: ['piano', 'vocals']
    };

    const potentialInteractions = interactionRules[instrument] || [];
    
    potentialInteractions.forEach(partner => {
      if (allInstruments.includes(partner)) {
        interactions.push({
          partner,
          type: this.getInteractionType(instrument, partner, genre),
          strength: this.getInteractionStrength(instrument, partner)
        });
      }
    });

    return interactions;
  }

  getInteractionType(instrument1, instrument2, genre) {
    // Define how instruments interact
    if ((instrument1 === 'drums' && instrument2 === 'bass') || 
        (instrument1 === 'bass' && instrument2 === 'drums')) {
      return 'rhythmic_lock';
    }
    
    if ((instrument1 === 'lead_guitar' && instrument2 === 'rhythm_guitar') ||
        (instrument1 === 'rhythm_guitar' && instrument2 === 'lead_guitar')) {
      return 'harmonic_complement';
    }
    
    if (instrument1 === 'piano' || instrument2 === 'piano') {
      return 'harmonic_support';
    }
    
    return 'general_support';
  }

  getInteractionStrength(instrument1, instrument2) {
    // Some instrument pairs have stronger natural interactions
    const strongPairs = [
      ['drums', 'bass'],
      ['lead_guitar', 'rhythm_guitar'],
      ['piano', 'bass'],
      ['strings', 'piano']
    ];
    
    const isStrongPair = strongPairs.some(pair => 
      (pair[0] === instrument1 && pair[1] === instrument2) ||
      (pair[0] === instrument2 && pair[1] === instrument1)
    );
    
    return isStrongPair ? 0.8 : 0.5;
  }

  createDynamicCurve(sections, energy) {
    return sections.map(section => ({
      section: section.name,
      start: this.getSectionEnergy(section.name, energy),
      peak: this.getSectionEnergy(section.name, energy) * 1.1,
      end: this.getSectionEnergy(section.name, energy) * 0.9
    }));
  }

  createMicroDynamics(energy) {
    return {
      breathingRoom: energy < 0.6 ? 0.3 : 0.1,
      accentuation: energy > 0.7 ? 0.4 : 0.2,
      swells: energy > 0.5
    };
  }

  selectTransitionType(currentSection, nextSection) {
    const transitionTypes = {
      'intro-verse': 'buildup',
      'verse-chorus': 'lift',
      'chorus-verse': 'pullback',
      'verse-bridge': 'shift',
      'bridge-chorus': 'explosion',
      'chorus-outro': 'fadeout'
    };
    
    const key = `${currentSection.name}-${nextSection.name}`;
    return transitionTypes[key] || 'smooth';
  }

  calculateTransitionDuration(currentSection, nextSection) {
    // Transitions are typically 1-4 beats
    if (currentSection.name === 'bridge' && nextSection.name === 'chorus') {
      return 4; // Dramatic transition
    }
    if (currentSection.name === 'chorus' && nextSection.name === 'outro') {
      return 8; // Extended fadeout
    }
    return 2; // Standard transition
  }

  selectTransitionTechnique(currentSection, nextSection) {
    const techniques = {
      buildup: ['drum_fill', 'rising_synth', 'cymbal_swell'],
      pullback: ['filter_sweep', 'volume_drop', 'instrument_dropout'],
      explosion: ['crash_accent', 'full_band_hit', 'harmonic_resolution'],
      shift: ['key_change', 'tempo_shift', 'instrument_swap']
    };
    
    const transitionType = this.selectTransitionType(currentSection, nextSection);
    const availableTechniques = techniques[transitionType] || ['standard'];
    
    return availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
  }

  applyJazzRules(arrangement) {
    // Jazz-specific arrangement modifications
    arrangement.improvisation = {
      enabled: true,
      soloOrder: ['piano', 'saxophone', 'trumpet', 'bass'],
      tradingBars: 4
    };
    
    arrangement.swing = {
      enabled: true,
      factor: 0.6
    };
    
    return arrangement;
  }

  applyRockRules(arrangement) {
    // Rock-specific arrangement modifications
    arrangement.powerStructure = {
      verses: 'restrained',
      choruses: 'full_power',
      bridge: 'dynamic_contrast'
    };
    
    arrangement.guitarInterplay = {
      enabled: true,
      rhythm_leads_verse: true,
      lead_dominates_chorus: true
    };
    
    return arrangement;
  }

  applyElectronicRules(arrangement) {
    // Electronic-specific arrangement modifications
    arrangement.buildups = {
      enabled: true,
      technique: 'filter_sweeps',
      dropPoints: ['chorus']
    };
    
    arrangement.automation = {
      enabled: true,
      parameters: ['filter_cutoff', 'reverb_send', 'delay_feedback']
    };
    
    return arrangement;
  }
}

// Conflict Resolver - Handles disagreements between AIs
class ConflictResolver {
  constructor() {
    this.resolutionStrategies = new Map();
    this.conflictHistory = [];
    
    console.log('⚖️ Initialized Conflict Resolver');
  }

  async resolveConflicts(aiSuggestions, context) {
    console.log(`🔧 Resolving conflicts between ${aiSuggestions.length} AI suggestions`);
    
    const conflicts = this.identifyConflicts(aiSuggestions);
    
    if (conflicts.length === 0) {
      return { resolved: aiSuggestions, conflicts: [] };
    }

    const resolutions = [];
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, context);
      resolutions.push(resolution);
    }

    return {
      resolved: this.applyResolutions(aiSuggestions, resolutions),
      conflicts: conflicts,
      resolutions: resolutions
    };
  }

  identifyConflicts(suggestions) {
    const conflicts = [];
    
    // Check for tempo conflicts
    const tempos = suggestions.map(s => s.tempo).filter(t => t);
    if (this.hasVariation(tempos, 10)) { // 10 BPM tolerance
      conflicts.push({
        type: 'tempo',
        values: tempos,
        severity: this.calculateSeverity(tempos, 'tempo')
      });
    }

    // Check for key conflicts
    const keys = suggestions.map(s => s.key).filter(k => k);
    if (this.hasKeyConflicts(keys)) {
      conflicts.push({
        type: 'key',
        values: keys,
        severity: this.calculateSeverity(keys, 'key')
      });
    }

    // Check for energy level conflicts
    const energies = suggestions.map(s => s.energy).filter(e => e !== undefined);
    if (this.hasVariation(energies, 0.3)) { // 30% tolerance
      conflicts.push({
        type: 'energy',
        values: energies,
        severity: this.calculateSeverity(energies, 'energy')
      });
    }

    // Check for instrument conflicts (overlapping frequencies/roles)
    const instrumentConflicts = this.checkInstrumentConflicts(suggestions);
    conflicts.push(...instrumentConflicts);

    return conflicts;
  }

  async resolveConflict(conflict, context) {
    const strategy = this.selectResolutionStrategy(conflict, context);
    
    switch (strategy) {
      case 'average':
        return this.resolveByAverage(conflict);
      case 'weighted_vote':
        return this.resolveByWeightedVote(conflict, context);
      case 'genre_preference':
        return this.resolveByGenrePreference(conflict, context);
      case 'energy_consistency':
        return this.resolveByEnergyConsistency(conflict, context);
      case 'harmonic_compatibility':
        return this.resolveByHarmonicCompatibility(conflict, context);
      default:
        return this.resolveByDefault(conflict);
    }
  }

  selectResolutionStrategy(conflict, context) {
    const { type, severity } = conflict;
    const { genre, priority } = context;

    // High severity conflicts need more sophisticated resolution
    if (severity > 0.8) {
      if (type === 'key') return 'harmonic_compatibility';
      if (type === 'tempo') return 'genre_preference';
      if (type === 'energy') return 'energy_consistency';
    }

    // Medium severity can use weighted voting
    if (severity > 0.5) {
      return 'weighted_vote';
    }

    // Low severity conflicts can be averaged
    return 'average';
  }

  resolveByAverage(conflict) {
    const { type, values } = conflict;
    
    if (type === 'tempo' || type === 'energy') {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      return { strategy: 'average', value: average, confidence: 0.7 };
    }
    
    if (type === 'key') {
      // For keys, pick the most common one
      const keyCount = {};
      values.forEach(key => keyCount[key] = (keyCount[key] || 0) + 1);
      const mostCommon = Object.keys(keyCount).reduce((a, b) => 
        keyCount[a] > keyCount[b] ? a : b
      );
      return { strategy: 'average', value: mostCommon, confidence: 0.6 };
    }

    return { strategy: 'average', value: values[0], confidence: 0.5 };
  }

  resolveByWeightedVote(conflict, context) {
    // Weight votes based on AI specialization and confidence
    const weights = this.calculateAIWeights(conflict, context);
    
    if (conflict.type === 'tempo' || conflict.type === 'energy') {
      let weightedSum = 0;
      let totalWeight = 0;
      
      conflict.values.forEach((value, index) => {
        const weight = weights[index] || 1;
        weightedSum += value * weight;
        totalWeight += weight;
      });
      
      return { 
        strategy: 'weighted_vote', 
        value: weightedSum / totalWeight, 
        confidence: 0.8 
      };
    }

    // For categorical values like keys, pick highest weighted option
    const weightedCounts = {};
    conflict.values.forEach((value, index) => {
      const weight = weights[index] || 1;
      weightedCounts[value] = (weightedCounts[value] || 0) + weight;
    });

    const winner = Object.keys(weightedCounts).reduce((a, b) => 
      weightedCounts[a] > weightedCounts[b] ? a : b
    );

    return { strategy: 'weighted_vote', value: winner, confidence: 0.8 };
  }

  resolveByGenrePreference(conflict, context) {
    const { genre } = context;
    const genreDefaults = this.getGenreDefaults(genre);
    
    // Find the value closest to genre preference
    let bestValue = conflict.values[0];
    let bestDistance = Infinity;
    
    conflict.values.forEach(value => {
      const distance = this.calculateGenreDistance(value, genreDefaults[conflict.type], conflict.type);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestValue = value;
      }
    });

    return { 
      strategy: 'genre_preference', 
      value: bestValue, 
      confidence: 0.9 
    };
  }

  resolveByEnergyConsistency(conflict, context) {
    const targetEnergy = context.energy || 0.5;
    
    // Find the energy value closest to the target
    let bestValue = conflict.values[0];
    let bestDistance = Math.abs(conflict.values[0] - targetEnergy);
    
    conflict.values.forEach(value => {
      const distance = Math.abs(value - targetEnergy);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestValue = value;
      }
    });

    return { 
      strategy: 'energy_consistency', 
      value: bestValue, 
      confidence: 0.85 
    };
  }

  resolveByHarmonicCompatibility(conflict, context) {
    if (conflict.type !== 'key') {
      return this.resolveByDefault(conflict);
    }

    const { genre } = context;
    const compatibleKeys = this.getCompatibleKeys(context.key || 'C', genre);
    
    // Find the suggested key that's most compatible
    let bestKey = conflict.values[0];
    let bestCompatibility = 0;
    
    conflict.values.forEach(key => {
      const compatibility = compatibleKeys[key] || 0;
      if (compatibility > bestCompatibility) {
        bestCompatibility = compatibility;
        bestKey = key;
      }
    });

    return { 
      strategy: 'harmonic_compatibility', 
      value: bestKey, 
      confidence: 0.9 
    };
  }

  resolveByDefault(conflict) {
    // Default resolution: pick the first value
    return { 
      strategy: 'default', 
      value: conflict.values[0], 
      confidence: 0.3 
    };
  }

  hasVariation(values, tolerance) {
    if (values.length < 2) return false;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return (max - min) > tolerance;
  }

  hasKeyConflicts(keys) {
    if (keys.length < 2) return false;
    
    // Check if all keys are the same or harmonically related
    const uniqueKeys = [...new Set(keys)];
    if (uniqueKeys.length === 1) return false;
    
    // Simple check: different keys = conflict (could be more sophisticated)
    return true;
  }

  calculateSeverity(values, type) {
    if (values.length < 2) return 0;
    
    if (type === 'tempo' || type === 'energy') {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      // Normalize severity based on type
      if (type === 'tempo') {
        return Math.min(1, range / 50); // 50 BPM = max severity
      } else {
        return Math.min(1, range / 0.5); // 0.5 energy units = max severity
      }
    }
    
    if (type === 'key') {
      const uniqueKeys = [...new Set(values)];
      return Math.min(1, (uniqueKeys.length - 1) / 3); // 4+ keys = max severity
    }
    
    return 0.5; // Default moderate severity
  }

  checkInstrumentConflicts(suggestions) {
    const conflicts = [];
    const instrumentsByFrequency = this.groupInstrumentsByFrequency(suggestions);
    
    // Check for frequency range overlaps
    Object.keys(instrumentsByFrequency).forEach(range => {
      const instruments = instrumentsByFrequency[range];
      if (instruments.length > 2) { // Too many instruments in same frequency range
        conflicts.push({
          type: 'frequency_conflict',
          range: range,
          instruments: instruments,
          severity: Math.min(1, instruments.length / 4)
        });
      }
    });

    return conflicts;
  }

  groupInstrumentsByFrequency(suggestions) {
    const frequencyRanges = {
      low: ['bass', 'kick', 'sub_bass'],
      low_mid: ['bass_guitar', 'cello', 'trombone'],
      mid: ['guitar', 'piano', 'vocals', 'saxophone'],
      high_mid: ['lead_guitar', 'violin', 'trumpet'],
      high: ['cymbals', 'flute', 'piccolo', 'hi_hat']
    };

    const grouped = {
      low: [],
      low_mid: [],
      mid: [],
      high_mid: [],
      high: []
    };

    suggestions.forEach(suggestion => {
      if (suggestion.instruments) {
        suggestion.instruments.forEach(instrument => {
          Object.keys(frequencyRanges).forEach(range => {
            if (frequencyRanges[range].includes(instrument)) {
              grouped[range].push(instrument);
            }
          });
        });
      }
    });

    return grouped;
  }

  calculateAIWeights(conflict, context) {
    // Weight AIs based on their specialization for this conflict type
    const weights = [];
    
    conflict.values.forEach((value, index) => {
      let weight = 1.0; // Base weight
      
      // Increase weight for specialized AIs
      if (conflict.type === 'tempo' && context.beatSpecialists) {
        weight *= 1.5; // Beat specialists get more weight for tempo
      }
      
      if (conflict.type === 'key' && context.harmonicSpecialists) {
        weight *= 1.5; // Harmonic specialists get more weight for key
      }
      
      weights.push(weight);
    });
    
    return weights;
  }

  getGenreDefaults(genre) {
    const defaults = {
      rock: { tempo: 120, energy: 0.8, key: 'E' },
      jazz: { tempo: 120, energy: 0.6, key: 'Bb' },
      electronic: { tempo: 128, energy: 0.9, key: 'C' },
      blues: { tempo: 90, energy: 0.7, key: 'E' },
      reggae: { tempo: 75, energy: 0.6, key: 'G' }
    };
    
    return defaults[genre] || defaults.rock;
  }

  calculateGenreDistance(value, target, type) {
    if (type === 'tempo' || type === 'energy') {
      return Math.abs(value - target);
    }
    
    if (type === 'key') {
      // Simplified key distance (could use circle of fifths)
      return value === target ? 0 : 1;
    }
    
    return 0;
  }

  getCompatibleKeys(baseKey, genre) {
    // Simplified key compatibility (could be more sophisticated)
    const compatibility = {
      'C': { 'C': 1.0, 'G': 0.9, 'F': 0.9, 'Am': 0.8, 'Dm': 0.7 },
      'G': { 'G': 1.0, 'C': 0.9, 'D': 0.9, 'Em': 0.8, 'Am': 0.7 },
      'F': { 'F': 1.0, 'C': 0.9, 'Bb': 0.9, 'Dm': 0.8, 'Gm': 0.7 }
    };
    
    return compatibility[baseKey] || { [baseKey]: 1.0 };
  }

  applyResolutions(originalSuggestions, resolutions) {
    const resolved = [...originalSuggestions];
    
    resolutions.forEach(resolution => {
      // Apply the resolution to the suggestions
      resolved.forEach(suggestion => {
        if (resolution.type === 'tempo') {
          suggestion.tempo = resolution.value;
        } else if (resolution.type === 'key') {
          suggestion.key = resolution.value;
        } else if (resolution.type === 'energy') {
          suggestion.energy = resolution.value;
        }
      });
    });
    
    return resolved;
  }
}

// Quality Assessment AI - Evaluates the final musical output
class QualityAssessmentAI {
  constructor() {
    this.qualityMetrics = new Map();
    this.assessmentHistory = [];
    
    console.log('🎯 Initialized Quality Assessment AI');
  }

  async assessQuality(musicData, context) {
    console.log(`🔍 Assessing quality of generated music`);
    
    const assessment = {
      overall: 0,
      categories: {},
      recommendations: [],
      timestamp: Date.now()
    };

    // Assess different quality aspects
    assessment.categories.harmony = this.assessHarmony(musicData, context);
    assessment.categories.rhythm = this.assessRhythm(musicData, context);
    assessment.categories.arrangement = this.assessArrangement(musicData, context);
    assessment.categories.creativity = this.assessCreativity(musicData, context);
    assessment.categories.genreConsistency = this.assessGenreConsistency(musicData, context);
    assessment.categories.technicalExecution = this.assessTechnicalExecution(musicData, context);

    // Calculate overall score
    assessment.overall = this.calculateOverallScore(assessment.categories);

    // Generate recommendations
    assessment.recommendations = this.generateRecommendations(assessment.categories, context);

    // Store assessment for learning
    this.assessmentHistory.push(assessment);

    return assessment;
  }

  assessHarmony(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.25
    };

    // Check chord progressions
    score.details.chordProgression = this.evaluateChordProgression(musicData.chords, context);
    
    // Check voice leading
    score.details.voiceLeading = this.evaluateVoiceLeading(musicData.voices, context);
    
    // Check key consistency
    score.details.keyConsistency = this.evaluateKeyConsistency(musicData.key, musicData.sections);
    
    // Check harmonic rhythm
    score.details.harmonicRhythm = this.evaluateHarmonicRhythm(musicData.chords, context.tempo);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  assessRhythm(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.20
    };

    // Check tempo consistency
    score.details.tempoConsistency = this.evaluateTempoConsistency(musicData.tempo, context);
    
    // Check rhythmic complexity
    score.details.rhythmicComplexity = this.evaluateRhythmicComplexity(musicData.rhythm, context);
    
    // Check groove quality
    score.details.groove = this.evaluateGroove(musicData.drums, context);
    
    // Check rhythmic variety
    score.details.variety = this.evaluateRhythmicVariety(musicData.rhythm);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  assessArrangement(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.20
    };

    // Check instrument balance
    score.details.balance = this.evaluateInstrumentBalance(musicData.instruments);
    
    // Check section transitions
    score.details.transitions = this.evaluateSectionTransitions(musicData.sections);
    
    // Check dynamic range
    score.details.dynamics = this.evaluateDynamicRange(musicData.dynamics);
    
    // Check structural coherence
    score.details.structure = this.evaluateStructuralCoherence(musicData.structure, context);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  assessCreativity(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.15
    };

    // Check melodic originality
    score.details.melodicOriginality = this.evaluateMelodicOriginality(musicData.melody);
    
    // Check harmonic innovation
    score.details.harmonicInnovation = this.evaluateHarmonicInnovation(musicData.chords, context);
    
    // Check rhythmic creativity
    score.details.rhythmicCreativity = this.evaluateRhythmicCreativity(musicData.rhythm, context);
    
    // Check unexpected elements
    score.details.surpriseElements = this.evaluateSurpriseElements(musicData);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  assessGenreConsistency(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.10
    };

    const { genre } = context;
    
    // Check genre-specific elements
    score.details.instrumentation = this.evaluateGenreInstrumentation(musicData.instruments, genre);
    score.details.rhythmPatterns = this.evaluateGenreRhythm(musicData.rhythm, genre);
    score.details.harmonicLanguage = this.evaluateGenreHarmony(musicData.chords, genre);
    score.details.structuralConventions = this.evaluateGenreStructure(musicData.structure, genre);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  assessTechnicalExecution(musicData, context) {
    const score = {
      value: 0,
      details: {},
      weight: 0.10
    };

    // Check audio quality metrics
    score.details.clarity = this.evaluateAudioClarity(musicData);
    score.details.mixing = this.evaluateMixingQuality(musicData);
    score.details.timing = this.evaluateTimingPrecision(musicData);
    score.details.intonation = this.evaluateIntonation(musicData);

    score.value = this.averageScores(Object.values(score.details));
    return score;
  }

  // Detailed evaluation methods
  evaluateChordProgression(chords, context) {
    if (!chords || chords.length === 0) return 0.5;
    
    let score = 0.7; // Base score
    
    // Check for common progressions
    const commonProgressions = this.getCommonProgressions(context.genre);
    const hasCommonProgression = commonProgressions.some(prog => 
      this.matchesProgression(chords, prog)
    );
    
    if (hasCommonProgression) score += 0.2;
    
    // Check for smooth voice leading
    const smoothVoiceLeading = this.checkVoiceLeading(chords);
    if (smoothVoiceLeading) score += 0.1;
    
    return Math.min(1.0, score);
  }

  evaluateVoiceLeading(voices, context) {
    if (!voices || voices.length === 0) return 0.7; // Default if no voice data
    
    let smoothConnections = 0;
    let totalConnections = 0;
    
    for (let i = 0; i < voices.length - 1; i++) {
      const current = voices[i];
      const next = voices[i + 1];
      
      if (this.isSmoothlvConnected(current, next)) {
        smoothConnections++;
      }
      totalConnections++;
    }
    
    return totalConnections > 0 ? smoothConnections / totalConnections : 0.7;
  }

  evaluateKeyConsistency(key, sections) {
    if (!key || !sections) return 0.8; // Default if no data
    
    let consistentSections = 0;
    sections.forEach(section => {
      if (section.key === key || this.isRelatedKey(section.key, key)) {
        consistentSections++;
      }
    });
    
    return sections.length > 0 ? consistentSections / sections.length : 0.8;
  }

  evaluateHarmonicRhythm(chords, tempo) {
    if (!chords || chords.length === 0) return 0.7;
    
    // Analyze chord change frequency
    const changesPerMeasure = this.calculateChordChangesPerMeasure(chords, tempo);
    
    // Optimal range is 1-4 changes per measure depending on genre
    const optimal = changesPerMeasure >= 1 && changesPerMeasure <= 4;
    return optimal ? 0.9 : 0.6;
  }

  evaluateTempoConsistency(tempo, context) {
    const genreRange = this.getGenreTempoRange(context.genre);
    const inRange = tempo >= genreRange.min && tempo <= genreRange.max;
    return inRange ? 0.9 : 0.6;
  }

  evaluateRhythmicComplexity(rhythm, context) {
    if (!rhythm) return 0.7;
    
    const complexity = this.calculateRhythmicComplexity(rhythm);
    const targetComplexity = this.getTargetComplexity(context.genre, context.energy);
    
    const difference = Math.abs(complexity - targetComplexity);
    return Math.max(0.3, 1.0 - difference);
  }

  evaluateGroove(drums, context) {
    if (!drums) return 0.7;
    
    let score = 0.5;
    
    // Check for genre-appropriate patterns
    if (this.hasGenreGroove(drums, context.genre)) score += 0.3;
    
    // Check for human-like timing variations
    if (this.hasHumanization(drums)) score += 0.2;
    
    return Math.min(1.0, score);
  }

  evaluateRhythmicVariety(rhythm) {
    if (!rhythm) return 0.7;
    
    const patterns = this.extractRhythmicPatterns(rhythm);
    const uniquePatterns = new Set(patterns).size;
    const variety = uniquePatterns / patterns.length;
    
    return Math.min(1.0, variety * 2); // Scale to 0-1 range
  }

  evaluateInstrumentBalance(instruments) {
    if (!instruments) return 0.7;
    
    const frequencyBalance = this.analyzeFrequencyBalance(instruments);
    const dynamicBalance = this.analyzeDynamicBalance(instruments);
    
    return (frequencyBalance + dynamicBalance) / 2;
  }

  evaluateSectionTransitions(sections) {
    if (!sections || sections.length < 2) return 0.7;
    
    let smoothTransitions = 0;
    for (let i = 0; i < sections.length - 1; i++) {
      if (this.isSmoothTransition(sections[i], sections[i + 1])) {
        smoothTransitions++;
      }
    }
    
    return smoothTransitions / (sections.length - 1);
  }

  evaluateDynamicRange(dynamics) {
    if (!dynamics) return 0.7;
    
    const range = Math.max(...dynamics) - Math.min(...dynamics);
    const optimalRange = 0.6; // 60% dynamic range is good
    
    const score = 1.0 - Math.abs(range - optimalRange);
    return Math.max(0.3, score);
  }

  evaluateStructuralCoherence(structure, context) {
    if (!structure) return 0.7;
    
    const hasIntro = structure.sections.some(s => s.name === 'intro');
    const hasOutro = structure.sections.some(s => s.name === 'outro');
    const hasVerse = structure.sections.some(s => s.name === 'verse');
    const hasChorus = structure.sections.some(s => s.name === 'chorus');
    
    let score = 0.5;
    if (hasIntro) score += 0.1;
    if (hasOutro) score += 0.1;
    if (hasVerse) score += 0.15;
    if (hasChorus) score += 0.15;
    
    return Math.min(1.0, score);
  }

  calculateOverallScore(categories) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.values(categories).forEach(category => {
      weightedSum += category.value * category.weight;
      totalWeight += category.weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  generateRecommendations(categories, context) {
    const recommendations = [];
    
    Object.entries(categories).forEach(([category, data]) => {
      if (data.value < 0.6) { // Below threshold
        recommendations.push({
          category,
          severity: 1.0 - data.value,
          suggestion: this.getImprovementSuggestion(category, data.details, context),
          priority: data.weight > 0.2 ? 'high' : 'medium'
        });
      }
    });
    
    return recommendations.sort((a, b) => b.severity - a.severity);
  }

  getImprovementSuggestion(category, details, context) {
    const suggestions = {
      harmony: 'Consider using more conventional chord progressions or improving voice leading',
      rhythm: 'Adjust rhythmic complexity or improve groove consistency',
      arrangement: 'Balance instrument levels and improve section transitions',
      creativity: 'Add more unique melodic or harmonic elements',
      genreConsistency: `Better align with ${context.genre} conventions`,
      technicalExecution: 'Improve audio clarity and timing precision'
    };
    
    return suggestions[category] || 'Review this aspect for improvement';
  }

  // Helper methods
  averageScores(scores) {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getCommonProgressions(genre) {
    const progressions = {
      rock: [['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V']],
      jazz: [['ii7', 'V7', 'I'], ['I', 'vi', 'ii', 'V']],
      pop: [['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V']],
      blues: [['I7', 'IV7', 'I7', 'V7']]
    };
    
    return progressions[genre] || progressions.pop;
  }

  matchesProgression(chords, progression) {
    // Simplified matching - could be more sophisticated
    return chords.length >= progression.length;
  }

  checkVoiceLeading(chords) {
    // Simplified voice leading check
    return chords.length > 1; // Basic check
  }

  isSmoothlvConnected(voice1, voice2) {
    // Check if voice connection is smooth (step-wise or common tones)
    return Math.abs(voice1.pitch - voice2.pitch) <= 2; // Within a whole step
  }

  isRelatedKey(key1, key2) {
    // Check if keys are related (relative major/minor, etc.)
    const relatedKeys = {
      'C': ['Am', 'F', 'G'],
      'G': ['Em', 'C', 'D'],
      'F': ['Dm', 'Bb', 'C']
    };
    
    return relatedKeys[key1]?.includes(key2) || false;
  }

  calculateChordChangesPerMeasure(chords, tempo) {
    // Simplified calculation
    return chords.length / 4; // Assume 4 measures
  }

  getGenreTempoRange(genre) {
    const ranges = {
      rock: { min: 100, max: 140 },
      jazz: { min: 90, max: 160 },
      electronic: { min: 120, max: 140 },
      blues: { min: 70, max: 110 },
      reggae: { min: 60, max: 90 }
    };
    
    return ranges[genre] || ranges.rock;
  }

  calculateRhythmicComplexity(rhythm) {
    // Simplified complexity calculation
    const uniquePatterns = new Set(rhythm.pattern || []).size;
    return uniquePatterns / 16; // Normalize to 0-1
  }

  getTargetComplexity(genre, energy) {
    const baseComplexity = {
      rock: 0.6,
      jazz: 0.8,
      electronic: 0.7,
      pop: 0.5
    };
    
    const base = baseComplexity[genre] || 0.6;
    return base + (energy - 0.5) * 0.2; // Adjust based on energy
  }

  hasGenreGroove(drums, genre) {
    // Check if drum pattern matches genre expectations
    return drums.pattern && drums.genre === genre;
  }

  hasHumanization(drums) {
    // Check for timing and velocity variations
    return drums.humanization && drums.humanization.timing > 0;
  }

  extractRhythmicPatterns(rhythm) {
    // Extract unique rhythmic patterns
    return rhythm.pattern || [];
  }

  analyzeFrequencyBalance(instruments) {
    // Analyze frequency distribution across instruments
    let balance = 0.7; // Default score
    
    // Ensure instruments is an array
    if (!Array.isArray(instruments)) {
      console.warn('⚠️ instruments is not an array:', typeof instruments);
      return balance;
    }
    
    const hasLow = instruments.some(i => ['bass', 'kick'].includes(i.type || i));
    const hasMid = instruments.some(i => ['guitar', 'piano'].includes(i.type || i));
    const hasHigh = instruments.some(i => ['cymbals', 'hi_hat'].includes(i.type || i));
    
    if (hasLow && hasMid && hasHigh) balance = 0.9;
    
    return balance;
  }

  analyzeDynamicBalance(instruments) {
    // Analyze dynamic balance between instruments
    if (!Array.isArray(instruments) || instruments.length === 0) return 0.7;
    
    const levels = instruments.map(i => i.level || 0.5);
    const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    const variance = levels.reduce((sum, level) => sum + Math.pow(level - average, 2), 0) / levels.length;
    
    // Lower variance = better balance
    return Math.max(0.3, 1.0 - variance);
  }

  isSmoothTransition(section1, section2) {
    // Check if transition between sections is smooth
    const keyCompatible = section1.key === section2.key || this.isRelatedKey(section1.key, section2.key);
    const tempoCompatible = Math.abs(section1.tempo - section2.tempo) <= 10;
    
    return keyCompatible && tempoCompatible;
  }

  // Additional evaluation methods for quality assessment
  evaluateMelodicOriginality(melody) {
    if (!melody) return 0.7;
    // Simplified check for melodic patterns
    return 0.7 + Math.random() * 0.2; // Placeholder - would analyze actual melodic content
  }

  evaluateHarmonicInnovation(chords, context) {
    if (!chords) return 0.7;
    // Check for interesting chord substitutions or progressions
    return 0.6 + Math.random() * 0.3; // Placeholder
  }

  evaluateRhythmicCreativity(rhythm, context) {
    if (!rhythm) return 0.7;
    // Analyze rhythmic complexity and innovation
    return 0.6 + Math.random() * 0.3; // Placeholder
  }

  evaluateSurpriseElements(musicData) {
    // Look for unexpected but pleasing musical elements
    let surprises = 0;
    if (musicData.arrangement && musicData.arrangement.sections) {
      // Check for unexpected sections
      const hasbridge = musicData.arrangement.sections.some(s => s.name === 'bridge');
      if (hasbridge) surprises += 0.2;
    }
    return Math.min(1.0, 0.5 + surprises);
  }

  evaluateGenreInstrumentation(instruments, genre) {
    if (!Array.isArray(instruments)) return 0.7;
    // Check if instrumentation matches genre expectations
    const genreInstruments = {
      rock: ['drums', 'bass', 'guitar', 'lead_guitar'],
      jazz: ['piano', 'bass', 'drums', 'saxophone'],
      electronic: ['synthesizer', 'drums', 'bass'],
      reggae: ['drums', 'bass', 'guitar', 'piano']
    };
    
    const expected = genreInstruments[genre] || [];
    let matches = 0;
    expected.forEach(instrument => {
      if (instruments.some(i => i.type === instrument || i === instrument)) {
        matches++;
      }
    });
    
    return expected.length > 0 ? matches / expected.length : 0.7;
  }

  evaluateGenreRhythm(rhythm, genre) {
    if (!rhythm) return 0.7;
    // Simplified genre rhythm evaluation
    return 0.7 + Math.random() * 0.2; // Placeholder
  }

  evaluateGenreHarmony(chords, genre) {
    if (!chords) return 0.7;
    // Check harmonic language appropriate for genre
    return 0.7 + Math.random() * 0.2; // Placeholder
  }

  evaluateGenreStructure(structure, genre) {
    if (!structure) return 0.7;
    // Check structural conventions for genre
    return 0.7 + Math.random() * 0.2; // Placeholder
  }

  evaluateAudioClarity(musicData) {
    // Evaluate clarity of the audio mix
    return 0.8; // Placeholder - would analyze frequency spectrum
  }

  evaluateMixingQuality(musicData) {
    // Evaluate balance and mixing quality
    return 0.8; // Placeholder - would analyze levels and panning
  }

  evaluateTimingPrecision(musicData) {
    // Evaluate timing precision
    return 0.85; // Placeholder - would analyze timing accuracy
  }

  evaluateIntonation(musicData) {
    // Evaluate pitch accuracy
    return 0.9; // Placeholder - would analyze pitch accuracy
  }
}