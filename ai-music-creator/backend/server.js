require('dotenv').config();
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
  const trainingData = reggaeTraining.getTrainingData();
  
  // CRITICAL: Force debug logging to identify the problem
  console.log(`🔍 GENERATION DEBUG: Training data length = ${trainingData.length}`);
  console.log(`🔍 GENERATION DEBUG: Training cache size = ${reggaeTraining.cache ? reggaeTraining.cache.size() : 'no cache'}`);
  console.log(`🔍 GENERATION DEBUG: Training stats = ${JSON.stringify(reggaeTraining.getTrainingStats())}`);
  
  // Use Spotify-trained patterns if available, otherwise fallback to base patterns
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
    console.log(`⚠️ No Spotify training data available (${trainingData.length} tracks), using base reggae patterns`);
    selectedBass = enhancedPatterns.basslines[Math.floor(Math.random() * enhancedPatterns.basslines.length)];
    selectedMelody = enhancedPatterns.melodies[Math.floor(Math.random() * enhancedPatterns.melodies.length)];
    selectedChords = enhancedPatterns.chords[Math.floor(Math.random() * enhancedPatterns.chords.length)];
    selectedRhythm = enhancedPatterns.rhythms[Math.floor(Math.random() * enhancedPatterns.rhythms.length)];
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

app.post('/api/generate', async (req, res) => {
  // Check if user is connected to Spotify (allow generation if training data exists)
  const userStatus = spotifyAPI.getUserStatus();
  const trainingStats = reggaeTraining.getTrainingStats();
  
  if (!userStatus.connected && trainingStats.trackCount === 0) {
    return res.status(403).json({
      success: false,
      error: 'Spotify connection required for music generation',
      message: 'Please connect your Spotify account to generate authentic reggae music',
      requiresSpotify: true
    });
  }

  // Check if model has training data
  if (trainingStats.trackCount === 0) {
    return res.status(422).json({
      success: false,
      error: 'Training data not available',
      message: 'The AI model is still training on reggae tracks. Please wait for training to complete.',
      isTraining: reggaeTraining.isTraining
    });
  }

  const { prompt, tempo, key, duration } = req.body;
  
  // Force reggae genre
  const genre = 'reggae';
  const reggaeTempo = Math.max(60, Math.min(90, tempo || 75)); // Clamp to reggae tempo range
  const reggaeKey = reggaePatterns.keys.includes(key) ? key : 'G'; // Default to G if not reggae-friendly
  
  console.log(`🎵 Generating reggae music with ${trainingStats.trackCount} trained tracks: "${prompt}" | Tempo: ${reggaeTempo} | Key: ${reggaeKey}`);
  
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
        attemptNumber: result.attemptNumber,
        basedOnTracks: trainingStats.trackCount
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