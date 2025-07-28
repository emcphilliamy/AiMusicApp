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

// Create directories if they don't exist
['uploads', 'generated'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Music pattern database - simulates a vast music database
const musicPatterns = {
  pop: {
    basslines: [
      [60, 64, 67, 64], // C-E-G-E
      [60, 62, 64, 62], // C-D-E-D
      [57, 60, 64, 67], // A-C-E-G
    ],
    melodies: [
      [72, 74, 76, 74, 72, 69, 67], // Happy melody
      [67, 69, 71, 72, 74, 72, 69], // Uplifting melody
      [72, 71, 69, 67, 69, 71, 72], // Pop hook
    ],
    chords: [
      [[60, 64, 67], [65, 69, 72], [62, 65, 69], [67, 71, 74]], // C-F-Dm-G
      [[60, 64, 67], [57, 60, 64], [62, 65, 69], [67, 71, 74]], // C-Am-Dm-G
    ],
    rhythms: [
      [1, 0, 1, 0, 1, 0, 1, 0], // Basic 4/4
      [1, 0, 0, 1, 0, 1, 0, 0], // Syncopated
    ]
  },
  rock: {
    basslines: [
      [40, 40, 47, 40], // Power chord bass
      [40, 42, 47, 45], // Rock progression
    ],
    melodies: [
      [67, 69, 72, 74, 76, 74, 72], // Rock anthem
      [72, 69, 67, 65, 67, 69, 72], // Power melody
    ],
    chords: [
      [[40, 47, 52], [42, 49, 54], [47, 54, 59], [45, 52, 57]], // Power chords
    ],
    rhythms: [
      [1, 0, 1, 1, 0, 1, 0, 1], // Rock beat
      [1, 1, 0, 1, 1, 0, 1, 0], // Heavy rock
    ]
  },
  jazz: {
    basslines: [
      [60, 55, 58, 53], // Jazz walking bass
      [60, 56, 62, 65], // Sophisticated bass
    ],
    melodies: [
      [72, 71, 69, 68, 66, 65, 67], // Jazz scale
      [67, 70, 72, 74, 73, 71, 69], // Swing melody
    ],
    chords: [
      [[60, 64, 67, 71], [65, 69, 72, 76], [62, 66, 69, 73]], // Jazz 7ths
    ],
    rhythms: [
      [1, 0, 0, 1, 0, 0, 1, 0], // Swing rhythm
    ]
  },
  electronic: {
    basslines: [
      [36, 36, 43, 43], // EDM bass
      [38, 38, 45, 45], // Synth bass
    ],
    melodies: [
      [84, 83, 81, 79, 81, 83, 84], // Synth lead
      [79, 81, 83, 84, 86, 84, 81], // Electronic hook
    ],
    chords: [
      [[60, 64, 67, 72], [62, 66, 69, 74]], // Synth pads
    ],
    rhythms: [
      [1, 0, 1, 0, 1, 0, 1, 0], // Four-on-floor
      [1, 1, 0, 1, 0, 1, 1, 0], // EDM pattern
    ]
  }
};

// Instrument sound generators
class InstrumentGenerator {
  static generateBass(frequency, time, sampleRate) {
    const t = time / sampleRate;
    return Math.sin(2 * Math.PI * frequency * t) * 0.8 + 
           Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
  }

  static generateLead(frequency, time, sampleRate) {
    const t = time / sampleRate;
    return Math.sin(2 * Math.PI * frequency * t) * 0.6 +
           Math.sin(2 * Math.PI * frequency * 3 * t) * 0.3 +
           Math.sin(2 * Math.PI * frequency * 5 * t) * 0.1;
  }

  static generatePad(frequencies, time, sampleRate) {
    const t = time / sampleRate;
    let sample = 0;
    frequencies.forEach(freq => {
      sample += Math.sin(2 * Math.PI * freq * t) * 0.3;
    });
    return sample;
  }

  static generateDrum(type, time, sampleRate) {
    const t = time / sampleRate;
    switch(type) {
      case 'kick':
        return Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 20) * 2;
      case 'snare':
        return (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.8;
      case 'hihat':
        return (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.4;
      default:
        return 0;
    }
  }
}

// Advanced music generation with real-time status
async function generateAdvancedMusic(prompt, genre, tempo, key, socketId) {
  const socket = io.sockets.sockets.get(socketId);
  
  // Step 1: Analyze prompt
  socket?.emit('generation_status', { 
    step: 'analyzing', 
    message: 'Analyzing your prompt and musical preferences...',
    progress: 10
  });
  await sleep(1000);

  // Step 2: Search pattern database
  socket?.emit('generation_status', { 
    step: 'searching', 
    message: 'Searching music pattern database...',
    progress: 20
  });
  await sleep(800);

  const patterns = musicPatterns[genre] || musicPatterns.pop;
  const selectedBass = patterns.basslines[Math.floor(Math.random() * patterns.basslines.length)];
  const selectedMelody = patterns.melodies[Math.floor(Math.random() * patterns.melodies.length)];
  const selectedChords = patterns.chords[Math.floor(Math.random() * patterns.chords.length)];
  const selectedRhythm = patterns.rhythms[Math.floor(Math.random() * patterns.rhythms.length)];

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
  const buffer = Buffer.alloc(numSamples * 4); // 32-bit float
  
  const baseFreq = getFrequencyFromKey(key);
  const beatsPerSecond = tempo / 60;
  const samplesPerBeat = sampleRate / beatsPerSecond;

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    const beatIndex = Math.floor(i / samplesPerBeat) % selectedRhythm.length;
    const chordIndex = Math.floor(i / (samplesPerBeat * 4)) % selectedChords.length;
    const bassIndex = Math.floor(i / (samplesPerBeat * 2)) % selectedBass.length;
    const melodyIndex = Math.floor(i / (samplesPerBeat * 0.5)) % selectedMelody.length;

    let sample = 0;

    // Bass line
    if (selectedRhythm[beatIndex]) {
      const bassNote = selectedBass[bassIndex];
      const bassFreq = midiToFreq(bassNote, baseFreq);
      sample += InstrumentGenerator.generateBass(bassFreq, i, sampleRate) * 0.4;
    }

    // Chord progression (pads)
    const chordFreqs = selectedChords[chordIndex].map(note => midiToFreq(note, baseFreq));
    sample += InstrumentGenerator.generatePad(chordFreqs, i, sampleRate) * 0.3;

    // Melody
    const melodyNote = selectedMelody[melodyIndex];
    const melodyFreq = midiToFreq(melodyNote, baseFreq);
    const melodyEnvelope = Math.sin(time * beatsPerSecond * Math.PI) * 0.5 + 0.5;
    sample += InstrumentGenerator.generateLead(melodyFreq, i, sampleRate) * melodyEnvelope * 0.4;

    // Drums
    if (selectedRhythm[beatIndex]) {
      if (beatIndex % 4 === 0) {
        sample += InstrumentGenerator.generateDrum('kick', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.6;
      }
      if (beatIndex % 4 === 2) {
        sample += InstrumentGenerator.generateDrum('snare', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.5;
      }
      if (beatIndex % 2 === 1) {
        sample += InstrumentGenerator.generateDrum('hihat', (i % samplesPerBeat) / sampleRate, sampleRate) * 0.3;
      }
    }

    // Apply some dynamics
    const dynamicEnvelope = 0.7 + 0.3 * Math.sin(time * 0.5);
    sample *= dynamicEnvelope;

    // Prevent clipping
    sample = Math.max(-1, Math.min(1, sample));
    
    // Convert to 32-bit integer
    const intSample = Math.round(sample * 2147483647);
    buffer.writeInt32LE(intSample, i * 4);
  }

  // Create WAV file
  const timestamp = Date.now();
  const filename = `generated-${timestamp}.wav`;
  const filepath = path.join('generated', filename);
  
  const wavHeader = createWavHeader(buffer.length, sampleRate, 32);
  const wavFile = Buffer.concat([wavHeader, buffer]);
  
  fs.writeFileSync(filepath, wavFile);

  socket?.emit('generation_status', { 
    step: 'complete', 
    message: 'Music generation complete!',
    progress: 100
  });

  return {
    filename,
    filepath,
    url: `/generated/${filename}`
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

function createWavHeader(dataSize, sampleRate, bitsPerSample = 32) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * (bitsPerSample / 8);
  
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(bitsPerSample === 32 ? 3 : 1, 20); // Float32 or PCM
  header.writeUInt16LE(1, 22);
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

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Music Creator API is running!',
    features: ['Advanced Music Generation', 'Real-time Status', 'Multi-instrument Composition']
  });
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
  const { prompt, genre, tempo, key, socketId } = req.body;
  
  console.log(`🎵 Generating advanced music: "${prompt}" | Genre: ${genre} | Tempo: ${tempo} | Key: ${key}`);
  
  try {
    const result = await generateAdvancedMusic(prompt, genre, tempo, key, socketId);
    
    console.log(`✅ Advanced music generated: ${result.filename}`);
    
    res.json({
      success: true,
      track: {
        id: Date.now(),
        name: `${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        url: result.url,
        type: 'generated',
        prompt,
        genre,
        tempo,
        key,
        duration: '0:30',
        instruments: ['bass', 'drums', 'melody', 'chords']
      }
    });
  } catch (error) {
    console.error('❌ Advanced music generation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate music' 
    });
  }
});

server.listen(PORT, () => {
  console.log(`🎵 Advanced AI Music Creator backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🎼 Generated music directory: ${path.resolve('generated')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  console.log(`🚀 Features: Multi-instrument composition, Real-time status, Pattern database`);
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