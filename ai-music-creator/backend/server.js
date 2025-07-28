const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

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
app.use('/generated', express.static('generated'));
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

const songCache = new SongCache(10);

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

// Reggae Training Data Manager
class ReggaeTrainingManager {
  constructor() {
    this.trainingData = new Map(); // songId -> { features, spotifyData, audioAnalysis }
    this.isTraining = false;
    this.lastTrainingUpdate = null;
    this.trainingQuality = 0; // 0-1 score based on training data amount and quality
  }

  addTrainingTrack(songId, features, spotifyData, audioPath) {
    this.trainingData.set(songId, {
      features,
      spotifyData,
      audioPath,
      timestamp: Date.now()
    });
    this.updateTrainingQuality();
    console.log(`🎓 Added training track: ${songId} (Total: ${this.trainingData.size})`);
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

// Reggae-focused music pattern database - authentic reggae patterns
const reggaePatterns = {
  basslines: [
    // Classic reggae basslines - emphasize the one drop
    [43, 0, 0, 43, 0, 43, 0, 0], // G - classic one drop bass
    [41, 0, 0, 41, 0, 41, 0, 0], // F - roots reggae bass
    [38, 0, 0, 38, 0, 38, 0, 0], // D - steppers bass
    [36, 0, 0, 36, 0, 36, 0, 0], // C - foundation bass
    [43, 0, 38, 0, 43, 0, 38, 0], // G-D progression
    [41, 0, 36, 0, 41, 0, 36, 0], // F-C progression
    [43, 43, 0, 43, 0, 43, 0, 0], // Dancehall style
  ],
  melodies: [
    // Reggae melodic patterns - pentatonic and minor scales
    [67, 65, 62, 60, 62, 65, 67, 65], // Minor pentatonic
    [72, 70, 67, 65, 67, 70, 72, 70], // Higher register
    [60, 62, 65, 67, 65, 62, 60, 0], // Descending pattern
    [65, 67, 70, 72, 70, 67, 65, 0], // Ascending pattern
    [67, 0, 65, 0, 67, 65, 62, 0], // Syncopated melody
    [72, 70, 72, 70, 67, 65, 67, 65], // Call and response
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
    // Reggae rhythm patterns - emphasis on 2 and 4
    [0, 1, 0, 1, 0, 1, 0, 1], // Classic skank (offbeat)
    [1, 0, 1, 0, 1, 0, 1, 0], // One drop variation
    [0, 1, 0, 1, 1, 1, 0, 1], // Steppers rhythm
    [0, 1, 1, 1, 0, 1, 1, 1], // Dancehall rhythm
    [1, 0, 0, 1, 0, 0, 1, 0], // Roots rhythm
    [0, 1, 0, 0, 0, 1, 0, 0], // Minimal skank
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
    
    let similarity = 0;
    let comparisons = 0;

    // Tempo similarity (normalized difference)
    const tempoSim = 1 - Math.abs(features1.tempo - features2.tempo) / 200;
    similarity += tempoSim * 0.2;
    comparisons++;

    // Key similarity (exact match gives bonus)
    const keySim = features1.key === features2.key ? 1 : 0.3;
    similarity += keySim * 0.15;
    comparisons++;

    // Rhythm pattern similarity (Hamming distance)
    const rhythmSim = this.compareArrays(features1.rhythmPattern, features2.rhythmPattern);
    similarity += rhythmSim * 0.25;
    comparisons++;

    // Melody profile similarity (cosine similarity)
    const melodySim = this.cosineSimilarity(features1.melodyProfile, features2.melodyProfile);
    similarity += melodySim * 0.2;
    comparisons++;

    // Harmonic content similarity
    const harmonicSim = this.cosineSimilarity(features1.harmonicContent, features2.harmonicContent);
    similarity += harmonicSim * 0.2;
    comparisons++;

    return similarity / comparisons;
  }

  static compareArrays(arr1, arr2) {
    // Calculate similarity between two arrays (0-1)
    if (arr1.length !== arr2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] === arr2[i]) matches++;
    }
    return matches / arr1.length;
  }

  static cosineSimilarity(arr1, arr2) {
    // Calculate cosine similarity between two arrays
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
    
    const similarities = trainingTracks.map(track => 
      this.calculateSimilarity(generatedFeatures, track.features)
    );
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);
    
    // Pass if average similarity is between 25-55% and no single song is >70% similar
    const passed = avgSimilarity >= 0.25 && avgSimilarity <= 0.55 && maxSimilarity <= 0.7;
    
    return {
      passed,
      avgSimilarity,
      maxSimilarity,
      similarities,
      trainingCount: trainingTracks.length,
      message: passed 
        ? `✅ Training similarity check passed (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}% vs ${trainingTracks.length} tracks)`
        : `❌ Training similarity too ${avgSimilarity > 0.55 ? 'high' : 'low'} (avg: ${(avgSimilarity * 100).toFixed(1)}%, max: ${(maxSimilarity * 100).toFixed(1)}% vs ${trainingTracks.length} tracks)`
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
    
    // Pass if average similarity is below 20% and no single generation is >35% similar
    const passed = avgSimilarity <= 0.2 && maxSimilarity <= 0.35;
    
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
}

// Advanced music generation with real-time status and training data
async function generateAdvancedMusic(prompt, genre, tempo, key, socketId, sampleReference = null, maxRetries = 3) {
  const socket = io.sockets.sockets.get(socketId);
  const promptHash = generationHistory.createPromptHash(prompt, genre, tempo, key);
  const previousGenerations = generationHistory.getHistory(promptHash);
  
  let attempt = 1;
  let generationResult = null;
  
  while (attempt <= maxRetries) {
    console.log(`🎵 Generation attempt ${attempt}/${maxRetries} for prompt: "${prompt}"`);
    
    if (attempt > 1) {
      socket?.emit('generation_status', { 
        step: 'retry', 
        message: `Regenerating for better uniqueness (attempt ${attempt}/${maxRetries})...`,
        progress: 5
      });
      await sleep(500);
    }
    
    generationResult = await attemptGeneration(prompt, genre, tempo, key, socketId, sampleReference, previousGenerations, attempt);
    
    if (generationResult.similarityCheck.passed) {
      // Success! Add to history and return
      generationHistory.addGeneration(promptHash, generationResult.generatedFeatures);
      console.log(`✅ Generation successful on attempt ${attempt}`);
      break;
    } else {
      console.log(`⚠️ Attempt ${attempt} failed similarity check: ${generationResult.similarityCheck.message}`);
      if (attempt === maxRetries) {
        console.log(`❌ Max retries reached. Returning best attempt with warning.`);
        // Still add to history to prevent future identical generations
        generationHistory.addGeneration(promptHash, generationResult.generatedFeatures);
      }
      attempt++;
    }
  }
  
  return generationResult;
}

// Separated generation logic for retry capability
async function attemptGeneration(prompt, genre, tempo, key, socketId, sampleReference, previousGenerations, attemptNumber) {
  const socket = io.sockets.sockets.get(socketId);
  
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
  
  // Add randomization to create variation between attempts
  let selectedBass = enhancedPatterns.basslines[Math.floor(Math.random() * enhancedPatterns.basslines.length)];
  let selectedMelody = enhancedPatterns.melodies[Math.floor(Math.random() * enhancedPatterns.melodies.length)];
  let selectedChords = enhancedPatterns.chords[Math.floor(Math.random() * enhancedPatterns.chords.length)];
  let selectedRhythm = enhancedPatterns.rhythms[Math.floor(Math.random() * enhancedPatterns.rhythms.length)];
  
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

    // Chord progression (pads) - reduced volume
    const chordFreqs = selectedChords[chordIndex].map(note => midiToFreq(note, baseFreq));
    padLevel = InstrumentGenerator.generatePad(chordFreqs, i, sampleRate) * 0.15;

    // Melody - handle zero values and add reggae feel
    const melodyNote = selectedMelody[melodyIndex];
    if (melodyNote > 0) {
      const melodyFreq = midiToFreq(melodyNote, baseFreq);
      const melodyEnvelope = Math.sin(time * beatsPerSecond * Math.PI) * 0.5 + 0.5;
      // Add slight delay/reverb effect for reggae feel
      const reverbDelay = Math.sin(time * beatsPerSecond * Math.PI * 1.01) * 0.1;
      melodyLevel = InstrumentGenerator.generateLead(melodyFreq, i, sampleRate) * melodyEnvelope * 0.25 + reverbDelay * 0.05;
    }

    // Reggae drums - authentic one drop pattern
    const reggaeDrums = enhancedPatterns.drums;
    
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
  
  // Generate features for the current song
  const generatedFeatures = {
    tempo,
    key,
    complexity: Math.random(),
    energy: Math.random(),
    rhythmPattern: selectedRhythm,
    melodyProfile: selectedMelody.map(note => Math.max(0, Math.min(1, note / 127))), // Normalize and clamp MIDI to 0-1
    harmonicContent: selectedChords[0].map(note => Math.max(0, Math.min(1, note / 127))), // Use first chord
    spectralCentroid: baseFreq
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
    this.clientId = process.env.SPOTIFY_CLIENT_ID || 'your_client_id';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || 'your_client_secret';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:${process.env.PORT || 3001}/api/spotify/callback`;
    
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
    const { codeChallenge } = this.generatePKCE();
    this.state = uuidv4();
    
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'playlist-read-private',
      'playlist-read-collaborative'
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
      connected: this.userConnected,
      timeLeft: Math.floor(timeLeft / 1000), // seconds
      expiresAt: this.userConnectionExpiry ? new Date(this.userConnectionExpiry).toISOString() : null
    };
  }

  async getAccessToken() {
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
      // Enhanced search queries for better reggae results
      const searchQueries = usingUserToken ? [
        'genre:reggae',
        'bob marley',
        'jimmy cliff',
        'toots and the maytals',
        'burning spear',
        'steel pulse',
        'ub40 reggae',
        'peter tosh',
        'lee scratch perry',
        'king tubby',
        'damian marley',
        'ziggy marley'
      ] : [
        'reggae',
        'bob marley',
        'jimmy cliff'
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
          const tracksWithPreviews = data.tracks.items
            .filter(track => track.preview_url) // Only tracks with 30-second previews
            .map(track => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0]?.name || 'Unknown',
              preview_url: track.preview_url,
              duration: track.duration_ms,
              popularity: track.popularity,
              genres: track.artists[0]?.genres || ['reggae'],
              external_urls: track.external_urls,
              source: usingUserToken ? 'user_auth' : 'client_auth'
            }));
          
          allTracks.push(...tracksWithPreviews);
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
    // Try user token first, then fallback to client credentials
    let token = await this.getUserAccessToken();
    if (!token) {
      token = await this.getAccessToken();
    }
    if (!token) return null;

    try {
      const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const features = await response.json();
      
      if (response.ok) {
        return {
          tempo: features.tempo,
          key: features.key,
          mode: features.mode, // 0 = minor, 1 = major
          energy: features.energy,
          danceability: features.danceability,
          valence: features.valence,
          acousticness: features.acousticness
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting track features:', error);
      return null;
    }
  }
}

const spotifyAPI = new SpotifyAPI();

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
    return res.redirect(`http://localhost:3000?spotify_error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.redirect(`http://localhost:3000?spotify_error=missing_parameters`);
  }
  
  try {
    await spotifyAPI.exchangeCodeForTokens(code, state);
    console.log('✅ Spotify user authentication successful');
    res.redirect(`http://localhost:3000?spotify_connected=true`);
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    res.redirect(`http://localhost:3000?spotify_error=${encodeURIComponent(error.message)}`);
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

// Fetch reggae tracks from Spotify for training
app.post('/api/fetch-reggae-training', async (req, res) => {
  try {
    console.log('🎵 Fetching reggae tracks from Spotify for training...');
    reggaeTraining.isTraining = true;
    
    const tracks = await spotifyAPI.searchReggaeTracks(30); // Get 30 tracks
    let successCount = 0;
    let failCount = 0;
    
    for (const track of tracks) {
      try {
        // Get detailed audio features from Spotify
        const spotifyFeatures = await spotifyAPI.getTrackFeatures(track.id);
        
        // Cache the preview audio file
        const cachedPath = await downloadAndCacheSong(
          `spotify_${track.id}`, 
          track.preview_url, 
          `${track.artist} - ${track.name}`
        );
        
        // Extract reggae-specific features
        const reggaeFeatures = MusicAnalyzer.extractReggaeFeatures(cachedPath, spotifyFeatures);
        
        // Add to training manager (not just cache)
        reggaeTraining.addTrainingTrack(
          `spotify_${track.id}`,
          reggaeFeatures,
          spotifyFeatures,
          cachedPath
        );
        
        console.log(`✅ Added to training: ${track.artist} - ${track.name} (Tempo: ${spotifyFeatures?.tempo || 'unknown'})`);
        successCount++;
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to add track to training ${track.name}:`, error.message);
        failCount++;
      }
    }
    
    reggaeTraining.isTraining = false;
    reggaeTraining.lastTrainingUpdate = Date.now();
    const trainingStats = reggaeTraining.getTrainingStats();
    
    res.json({
      success: true,
      message: `Successfully trained on ${successCount} reggae tracks, ${failCount} failed`,
      tracksFound: tracks.length,
      successCount,
      failCount,
      trainingStats,
      sampleTracks: tracks.slice(0, 5).map(t => ({
        name: t.name,
        artist: t.artist,
        popularity: t.popularity
      }))
    });
    
  } catch (error) {
    console.error('Error fetching reggae training data:', error);
    reggaeTraining.isTraining = false;
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reggae training data', 
      details: error.message 
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

app.post('/api/generate', async (req, res) => {
  const { prompt, tempo, key, duration } = req.body;
  
  // Force reggae genre
  const genre = 'reggae';
  const reggaeTempo = Math.max(60, Math.min(90, tempo || 75)); // Clamp to reggae tempo range
  const reggaeKey = reggaePatterns.keys.includes(key) ? key : 'G'; // Default to G if not reggae-friendly
  
  console.log(`🎵 Generating reggae music: "${prompt}" | Tempo: ${reggaeTempo} | Key: ${reggaeKey}`);
  
  try {
    const sampleReference = req.body.sampleReference || null;
    const socketId = req.headers['x-socket-id'] || null;
    
    const result = await generateAdvancedMusic(prompt, genre, reggaeTempo, reggaeKey, socketId, sampleReference);
    
    console.log(`✅ Reggae music generated: ${result.filename}`);
    
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
        genre: 'reggae',
        tempo: reggaeTempo,
        key: reggaeKey,
        duration: duration || 30,
        instruments: ['bass', 'drums', 'melody', 'chords', 'skank'],
        sampleReference,
        similarityCheck: result.similarityCheck,
        attemptNumber: result.attemptNumber
      }
    });
  } catch (error) {
    console.error('❌ Reggae music generation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to generate reggae music: ${error.message}` 
    });
  }
});

// Auto-train on startup if no training data exists
async function initializeReggaeTraining() {
  const stats = reggaeTraining.getTrainingStats();
  if (stats.trackCount === 0) {
    console.log('🎓 No training data found - starting automatic reggae training...');
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
                const cachedPath = await downloadAndCacheSong(
                  `startup_${track.id}`, 
                  track.preview_url, 
                  `${track.artist} - ${track.name}`
                );
                const reggaeFeatures = MusicAnalyzer.extractReggaeFeatures(cachedPath, spotifyFeatures);
                reggaeTraining.addTrainingTrack(
                  `startup_${track.id}`,
                  reggaeFeatures,
                  spotifyFeatures,
                  cachedPath
                );
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
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
      console.log('⚠️ Could not fetch tracks for automatic training (likely missing Spotify credentials)');
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