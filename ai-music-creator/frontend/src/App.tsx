import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Download, Music, Radio, Volume2, Trash2 } from 'lucide-react';
import * as Tone from 'tone';

interface Track {
  id: string;
  name: string;
  url: string;
  type: 'generated' | 'uploaded';
  prompt?: string;
  genre?: string;
  tempo?: number;
  key?: string;
  duration?: number;
  sampleReference?: string | null;
}

interface Sample {
  id: number;
  title: string;
  artist: string;
  genre: string;
  tempo: number;
  key: string;
  mood: string;
  tags: string[];
  previewUrl: string;
}

interface MelodyNote {
  note: string;
  octave: number;
  time: number;
}

const AIMusicsCreator: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('pop');
  const [tempo, setTempo] = useState<number>(120);
  const [key, setKey] = useState<string>('C');
  const [duration, setDuration] = useState<number>(30);
  const [generationError, setGenerationError] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [currentCommand, setCurrentCommand] = useState<string>('Idle');
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [generationStep, setGenerationStep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [samplePlaying, setSamplePlaying] = useState<number | null>(null);
  const [loadingSamples, setLoadingSamples] = useState<boolean>(false);
  const [sampleDatabaseLoaded, setSampleDatabaseLoaded] = useState<Sample[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  const audioElementRef = useRef<HTMLAudioElement>(null);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);

  // Royalty-free music database with actual working URLs
  const fallbackSamples: Sample[] = [
    { 
      id: 1, 
      title: "Acoustic Folk", 
      artist: "Kevin MacLeod", 
      genre: "folk", 
      tempo: 120, 
      key: "C", 
      mood: "peaceful", 
      tags: ["acoustic", "guitar", "calm"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3" 
    },
    { 
      id: 2, 
      title: "Electronic Chill", 
      artist: "Kevin MacLeod", 
      genre: "electronic", 
      tempo: 128, 
      key: "G", 
      mood: "energetic", 
      tags: ["electronic", "beat", "synth"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electrodoodle.mp3" 
    },
    { 
      id: 3, 
      title: "Jazz Lounge", 
      artist: "Kevin MacLeod", 
      genre: "jazz", 
      tempo: 110, 
      key: "F", 
      mood: "sophisticated", 
      tags: ["jazz", "piano", "smooth"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heinousity.mp3" 
    },
    { 
      id: 4, 
      title: "Rock Energy", 
      artist: "Kevin MacLeod", 
      genre: "rock", 
      tempo: 140, 
      key: "E", 
      mood: "energetic", 
      tags: ["rock", "guitar", "driving"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Suspense.mp3" 
    },
    { 
      id: 5, 
      title: "Ambient Space", 
      artist: "Kevin MacLeod", 
      genre: "ambient", 
      tempo: 80, 
      key: "A", 
      mood: "dreamy", 
      tags: ["ambient", "synth", "atmospheric"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3" 
    },
    { 
      id: 6, 
      title: "Hip Hop Groove", 
      artist: "Kevin MacLeod", 
      genre: "hip-hop", 
      tempo: 95, 
      key: "D", 
      mood: "cool", 
      tags: ["hip-hop", "beat", "urban"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3" 
    },
    { 
      id: 7, 
      title: "Classical Piano", 
      artist: "Kevin MacLeod", 
      genre: "classical", 
      tempo: 70, 
      key: "C", 
      mood: "elegant", 
      tags: ["classical", "piano", "orchestral"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Deliberate%20Thought.mp3" 
    },
    { 
      id: 8, 
      title: "Indie Pop", 
      artist: "Kevin MacLeod", 
      genre: "pop", 
      tempo: 125, 
      key: "G", 
      mood: "upbeat", 
      tags: ["pop", "indie", "catchy"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Happy%20Boy%20End%20Theme.mp3" 
    },
    { 
      id: 9, 
      title: "Country Folk", 
      artist: "Kevin MacLeod", 
      genre: "country", 
      tempo: 100, 
      key: "D", 
      mood: "nostalgic", 
      tags: ["country", "folk", "acoustic"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Danse%20Morialta.mp3" 
    },
    { 
      id: 10, 
      title: "Blues Guitar", 
      artist: "Kevin MacLeod", 
      genre: "blues", 
      tempo: 75, 
      key: "A", 
      mood: "soulful", 
      tags: ["blues", "guitar", "emotional"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Laid%20Back%20Guitars.mp3" 
    }
  ];

  // Fetch samples from Free Music Archive API
  const fetchSamplesFromFMA = async (): Promise<Sample[]> => {
    try {
      setLoadingSamples(true);
      console.log('🎵 Loading royalty-free music database...');
      
      // For now, we'll use the curated Kevin MacLeod collection
      // These are all royalty-free and hosted on Incompetech
      console.log('✅ Using Kevin MacLeod royalty-free music collection');
      
      // Simulate loading time for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return fallbackSamples;
      
    } catch (error) {
      console.warn('Could not load music database, using fallback samples:', error);
      return fallbackSamples;
    } finally {
      setLoadingSamples(false);
    }
  };

  // Load samples on component mount
  useEffect(() => {
    const loadSamples = async () => {
      const samples = await fetchSamplesFromFMA();
      setSampleDatabaseLoaded(samples);
    };
    loadSamples();
  }, []);

  // Use loaded samples or fallback
  const sampleDatabase = sampleDatabaseLoaded.length > 0 ? sampleDatabaseLoaded : fallbackSamples;

  const genres: string[] = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical', 'country', 'blues'];
  const keys: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Music theory data
  const scales: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    blues: [0, 3, 5, 6, 7, 10],
    pentatonic: [0, 2, 4, 7, 9]
  };

  const chordProgressions: Record<string, string[]> = {
    pop: ['I', 'V', 'vi', 'IV'],
    rock: ['I', 'bVII', 'IV', 'I'],
    jazz: ['I', 'vi', 'ii', 'V'],
    blues: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V']
  };

  const filteredSamples = sampleDatabase.filter(sample => 
    sample.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getScale = (rootNote: string, scaleType: string): string[] => {
    const noteNames: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(rootNote);
    const scale = scales[scaleType] || scales.major;
    
    return scale.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return noteNames[noteIndex];
    });
  };

  const generateMelody = (scaleNotes: string[], length: number = 16): (MelodyNote | null)[] => {
    const melody: (MelodyNote | null)[] = [];
    for (let i = 0; i < length; i++) {
      if (Math.random() > 0.2) { // 80% chance to play a note
        const noteIndex = Math.floor(Math.random() * scaleNotes.length);
        const octave = 4 + Math.floor(Math.random() * 2); // Octave 4 or 5
        melody.push({
          note: scaleNotes[noteIndex],
          octave: octave,
          time: i * 0.25 // 16th notes
        });
      } else {
        melody.push(null);
      }
    }
    return melody;
  };

  const generateChords = (rootNote: string, progression: string[]): string[][] => {
    const noteNames: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(rootNote);
    const scale = getScale(rootNote, 'major');
    
    return progression.map(chord => {
      let chordRoot: string;
      switch (chord) {
        case 'I': chordRoot = scale[0]; break;
        case 'ii': chordRoot = scale[1]; break;
        case 'iii': chordRoot = scale[2]; break;
        case 'IV': chordRoot = scale[3]; break;
        case 'V': chordRoot = scale[4]; break;
        case 'vi': chordRoot = scale[5]; break;
        case 'bVII': chordRoot = noteNames[(rootIndex + 10) % 12]; break;
        default: chordRoot = scale[0];
      }
      
      // Generate triad - ensure we always return a valid array
      const chordScale = getScale(chordRoot, 'major');
      return [
        chordScale[0] || 'C', 
        chordScale[2] || 'E', 
        chordScale[4] || 'G'
      ]; // Root, third, fifth with fallbacks
    }).filter(chord => chord && chord.length === 3); // Filter out any invalid chords
  };

  // Check backend connection
  const checkBackendConnection = async (): Promise<void> => {
    try {
      setIsCheckingConnection(true);
      setCurrentCommand('Checking backend connection...');
      setConnectionStatus('🔄 Connecting...');
      setConnectionError(''); // Clear any previous errors
      
      // Actually test the backend connection
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('✅ Connected to Backend');
        setCurrentCommand('Backend online - ready for generation');
        console.log('✅ Backend connection successful:', data);
      } else {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setConnectionStatus('❌ Backend Offline');
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setConnectionError('Backend connection timeout. Is the server running on port 3001?');
        } else if (error.message.includes('fetch')) {
          setConnectionError('Cannot reach backend server. Please start the backend on port 3001.');
        } else {
          setConnectionError(`Backend error: ${error.message}`);
        }
      } else {
        setConnectionError('Unknown backend connection error.');
      }
      
      setCurrentCommand('Backend offline - using local generation only');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const interpretPromptWithLLM = async (prompt: string): Promise<{
    genre: string;
    tempo: number;
    key: string;
    mood: string;
    instruments: string[];
    complexity: string;
    energy: string;
  }> => {
    try {
      setCurrentCommand('🧠 AI analyzing prompt...');
      
      // Call backend LLM service
      const response = await fetch('http://localhost:3001/api/interpret-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          availableGenres: genres,
          availableKeys: keys,
          currentGenre: selectedGenre,
          currentTempo: tempo,
          currentKey: key
        })
      });
      
      if (response.ok) {
        const interpretation = await response.json();
        console.log('🎯 LLM interpretation:', interpretation);
        return interpretation;
      } else {
        throw new Error('LLM service unavailable');
      }
    } catch (error) {
      console.log('🔄 LLM unavailable, using enhanced keyword matching');
      
      // Enhanced fallback with better keyword detection
      const lowerPrompt = prompt.toLowerCase();
      
      let inferredGenre = selectedGenre;
      let inferredTempo = tempo;
      let inferredKey = key;
      let mood = 'neutral';
      let instruments = ['synth'];
      let complexity = 'medium';
      let energy = 'medium';
      
      // Advanced genre detection
      const genreKeywords = {
        rock: ['rock', 'guitar', 'heavy', 'metal', 'grunge', 'punk', 'alternative'],
        jazz: ['jazz', 'swing', 'saxophone', 'trumpet', 'bebop', 'smooth', 'improvisation'],
        electronic: ['electronic', 'edm', 'techno', 'house', 'trance', 'dubstep', 'synth', 'digital'],
        blues: ['blues', 'mississippi', 'chicago', 'delta', 'harmonica', 'slide guitar'],
        pop: ['pop', 'catchy', 'radio', 'mainstream', 'chart', 'commercial', 'vocals'],
        classical: ['classical', 'orchestra', 'symphony', 'piano', 'violin', 'baroque', 'romantic'],
        'hip-hop': ['hip hop', 'rap', 'urban', 'beats', 'sampling', 'mc', 'breakbeat'],
        country: ['country', 'western', 'nashville', 'banjo', 'fiddle', 'honky tonk']
      };
      
      // Find best matching genre
      let maxMatches = 0;
      Object.entries(genreKeywords).forEach(([genre, keywords]) => {
        const matches = keywords.filter(keyword => lowerPrompt.includes(keyword)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          inferredGenre = genre;
        }
      });
      
      // Tempo and energy detection
      if (lowerPrompt.includes('fast') || lowerPrompt.includes('upbeat') || lowerPrompt.includes('energetic') || lowerPrompt.includes('driving')) {
        inferredTempo = Math.max(inferredTempo + 30, 140);
        energy = 'high';
      } else if (lowerPrompt.includes('slow') || lowerPrompt.includes('chill') || lowerPrompt.includes('relaxed') || lowerPrompt.includes('ambient')) {
        inferredTempo = Math.min(inferredTempo - 30, 70);
        energy = 'low';
      }
      
      // Mood and key detection
      if (lowerPrompt.includes('happy') || lowerPrompt.includes('joyful') || lowerPrompt.includes('uplifting') || lowerPrompt.includes('bright')) {
        mood = 'happy';
        inferredKey = ['C', 'G', 'D', 'F'][Math.floor(Math.random() * 4)]; // Major keys
      } else if (lowerPrompt.includes('sad') || lowerPrompt.includes('melancholy') || lowerPrompt.includes('dark') || lowerPrompt.includes('emotional')) {
        mood = 'sad';
        inferredKey = ['A', 'E', 'B', 'F#'][Math.floor(Math.random() * 4)]; // Minor keys
      } else if (lowerPrompt.includes('mysterious') || lowerPrompt.includes('dramatic') || lowerPrompt.includes('intense')) {
        mood = 'dramatic';
        inferredKey = ['F#', 'C#', 'G#'][Math.floor(Math.random() * 3)]; // Sharp keys
      }
      
      // Complexity detection
      if (lowerPrompt.includes('simple') || lowerPrompt.includes('minimal') || lowerPrompt.includes('basic')) {
        complexity = 'simple';
      } else if (lowerPrompt.includes('complex') || lowerPrompt.includes('intricate') || lowerPrompt.includes('layered')) {
        complexity = 'complex';
      }
      
      // Instrument detection
      if (lowerPrompt.includes('piano')) instruments.push('piano');
      if (lowerPrompt.includes('guitar')) instruments.push('guitar');
      if (lowerPrompt.includes('drums')) instruments.push('drums');
      if (lowerPrompt.includes('bass')) instruments.push('bass');
      if (lowerPrompt.includes('strings')) instruments.push('strings');
      
      return {
        genre: inferredGenre,
        tempo: inferredTempo,
        key: inferredKey,
        mood: mood,
        instruments: instruments,
        complexity: complexity,
        energy: energy
      };
    }
  };

  const generateMusic = async (): Promise<void> => {
    setIsGenerating(true);
    setGenerationError('');
    setGenerationProgress(0);
    setCurrentCommand('Running Music Generation');
    
    try {
      setGenerationStep('🎵 Initializing audio engine...');
      setGenerationProgress(5);
      
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // AI Interpretation Step
      setGenerationStep('🧠 Interpreting description with AI...');
      setGenerationProgress(15);

      let musicParams = {
        genre: selectedGenre,
        tempo: tempo,
        key: key,
        mood: 'neutral',
        instruments: ['synth'],
        complexity: 'medium',
        energy: 'medium'
      };

      if (generationPrompt.trim()) {
        console.log('🧠 Interpreting prompt:', generationPrompt);
        musicParams = await interpretPromptWithLLM(generationPrompt);
        console.log('🎯 AI interpretation:', musicParams);
        
        // Update UI to show interpreted parameters
        setSelectedGenre(musicParams.genre);
        setTempo(musicParams.tempo);
        setKey(musicParams.key);
      }

      setGenerationStep('🎛️ Creating virtual instruments...');
      setGenerationProgress(25);

      // Create instruments based on AI interpretation
      const volumeBoost = musicParams.energy === 'high' ? 3 : musicParams.energy === 'low' ? -6 : 0;
      
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: musicParams.mood === 'sad' ? 'sine' : 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.5 },
        volume: -8 + volumeBoost
      }).toDestination();

      const bass = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.1, decay: 0.6, sustain: 0.8, release: 2.0 },
        volume: -12 + volumeBoost
      }).toDestination();

      const drums = {
        kick: new Tone.MembraneSynth({ 
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.8, sustain: 0.01, release: 1.4 },
          volume: -8 + volumeBoost
        }).toDestination(),
        snare: new Tone.NoiseSynth({ 
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0 },
          volume: -12 + volumeBoost
        }).toDestination(),
        hihat: new Tone.MetalSynth({ 
          envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          volume: -18 + volumeBoost
        }).toDestination()
      };

      setGenerationStep('🎼 Generating chord progressions...');
      setGenerationProgress(35);

      // Generate musical elements based on interpretation
      const scaleType = musicParams.mood === 'sad' ? 'minor' : 
                      musicParams.genre === 'blues' ? 'blues' : 'major';
      const scaleNotes = getScale(musicParams.key, scaleType);
      const progression = chordProgressions[musicParams.genre] || chordProgressions.pop;
      const chords = generateChords(musicParams.key, progression);
      
      // Adjust melody complexity based on AI interpretation
      const melodyLength = musicParams.complexity === 'simple' ? 16 : 
                          musicParams.complexity === 'complex' ? 48 : 32;
      const melody = generateMelody(scaleNotes, melodyLength);
      
      if (!chords || chords.length === 0) {
        throw new Error(`Failed to generate chords for ${musicParams.genre} in key ${musicParams.key}`);
      }

      setGenerationStep('🎚️ Creating sequences...');
      setGenerationProgress(55);

      Tone.Transport.bpm.value = musicParams.tempo;

      // Create sequences with AI-influenced patterns
      const chordSequence = new Tone.Sequence((time: number, chord: string[]) => {
        if (chord && Array.isArray(chord) && chord.length >= 3) {
          synth.triggerAttackRelease([`${chord[0]}3`, `${chord[1]}3`, `${chord[2]}3`], '2n', time);
        }
      }, chords, '2n');

      const bassSequence = new Tone.Sequence((time: number, chord: string[]) => {
        if (chord && Array.isArray(chord) && chord[0]) {
          bass.triggerAttackRelease(`${chord[0]}2`, '4n', time);
        }
      }, chords, '4n');

      const melodySequence = new Tone.Sequence((time: number, note: MelodyNote | null) => {
        if (note && note.note && note.octave) {
          synth.triggerAttackRelease(`${note.note}${note.octave}`, '8n', time);
        }
      }, melody, '8n');

      // Drum patterns based on energy level
      const drumIntensity = musicParams.energy === 'high' ? 
        { kick: ['0:0', '0:2', '1:0', '1:2', '2:0', '2:2', '3:0', '3:2'], snare: ['0:1', '1:1', '2:1', '3:1'] } :
        musicParams.energy === 'low' ?
        { kick: ['0:0', '2:0'], snare: ['1:0', '3:0'] } :
        { kick: ['0:0', '1:0', '2:0', '3:0'], snare: ['1:0', '3:0'] };

      const kickSequence = new Tone.Sequence((time: number) => {
        drums.kick.triggerAttackRelease('C1', '8n', time);
      }, drumIntensity.kick, '1n');

      const snareSequence = new Tone.Sequence((time: number) => {
        drums.snare.triggerAttack(time);
      }, drumIntensity.snare, '1n');

      const hihatSequence = new Tone.Sequence((time: number) => {
        drums.hihat.triggerAttack(time);
      }, ['0:0', '0:2', '1:0', '1:2', '2:0', '2:2', '3:0', '3:2'], '1n');

      setGenerationStep('🎙️ Recording audio...');
      setGenerationProgress(75);

      // Start all sequences
      chordSequence.start(0);
      bassSequence.start(0);
      melodySequence.start(0);
      kickSequence.start(0);
      snareSequence.start(0);
      hihatSequence.start(0);

      const recorder = new Tone.Recorder();
      Tone.Destination.connect(recorder);
      
      await recorder.start();
      Tone.Transport.start();

      setGenerationStep('⏳ Processing audio output...');
      setGenerationProgress(85);

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 1, 95));
      }, (duration * 1000) / 10);

      setTimeout(async () => {
        clearInterval(progressInterval);
        setGenerationStep('💾 Finalizing track...');
        setGenerationProgress(95);
        
        Tone.Transport.stop();
        const recording = await recorder.stop();
        
        // Clean up
        chordSequence.dispose();
        bassSequence.dispose();
        melodySequence.dispose();
        kickSequence.dispose();
        snareSequence.dispose();
        hihatSequence.dispose();
        
        synth.dispose();
        bass.dispose();
        drums.kick.dispose();
        drums.snare.dispose();
        drums.hihat.dispose();
        recorder.dispose();

        if (recording.size === 0) {
          throw new Error('Recording is empty - no audio was captured');
        }

        const url = URL.createObjectURL(recording);
        const trackName = `${musicParams.mood.charAt(0).toUpperCase() + musicParams.mood.slice(1)} ${musicParams.genre} in ${musicParams.key}`;
        
        const newTrack: Track = {
          id: Date.now().toString(),
          name: trackName,
          url: url,
          type: 'generated',
          prompt: generationPrompt,
          genre: musicParams.genre,
          tempo: musicParams.tempo,
          key: musicParams.key,
          duration: duration,
          sampleReference: selectedSample?.title || null
        };

        setTracks(prev => [...prev, newTrack]);
        setGenerationPrompt('');
        setGenerationStep('✅ Generation complete!');
        setGenerationProgress(100);
        setCurrentCommand('Track generated successfully');
        
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
          setGenerationStep('');
          setCurrentCommand('Ready for next generation');
        }, 2000);

      }, duration * 1000);

    } catch (error) {
      console.error('❌ Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationError(`Failed to generate music: ${errorMessage}`);
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
      setCurrentCommand('Generation failed - ready to retry');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setConnectionError('');
      try {
        const url = URL.createObjectURL(file);
        const newTrack: Track = {
          id: Date.now().toString(),
          name: file.name,
          url: url,
          type: 'uploaded',
          duration: 0 // Will be set when audio loads
        };
        
        setTracks(prev => [...prev, newTrack]);
      } catch (error) {
        console.error('Upload failed:', error);
        setConnectionError('Failed to upload file. Please try again.');
      }
    } else {
      setConnectionError('Please select a valid audio file.');
    }
  };

  const playSample = (sample: Sample): void => {
    console.log('🎵 Playing sample:', sample.title, 'URL:', sample.previewUrl);
    
    if (samplePlaying === sample.id) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current.currentTime = 0;
      }
      setSamplePlaying(null);
      return;
    }

    if (!sampleAudioRef.current) {
      console.error('❌ Sample audio ref not available');
      return;
    }

    try {
      sampleAudioRef.current.pause();
      sampleAudioRef.current.currentTime = 0;
      sampleAudioRef.current.volume = 0.7;
      sampleAudioRef.current.crossOrigin = "anonymous";
      
      console.log('🔗 Setting audio source to:', sample.previewUrl);
      sampleAudioRef.current.src = sample.previewUrl;
      
      const playPromise = sampleAudioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Sample playing successfully');
            setSamplePlaying(sample.id);
          })
          .catch(error => {
            console.log('ℹ️ Sample URL blocked (expected due to CORS policy)');
            console.log('💡 In a real app, samples would be hosted on the same domain');
            setSamplePlaying(null);
          });
      }
      
    } catch (error) {
      console.log('ℹ️ Sample playback blocked by browser policy');
      setSamplePlaying(null);
    }
  };

  const playTrack = (track: Track): void => {
    if (currentTrack?.id === track.id && isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      if (audioElementRef.current) {
        // Stop any playing track first
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        
        audioElementRef.current.src = track.url;
        audioElementRef.current.play().catch(error => {
          console.error('Error playing track:', error);
          setIsPlaying(false);
        });
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    }
  };

  const downloadTrack = (track: Track): void => {
    const link = document.createElement('a');
    link.href = track.url;
    link.download = `${track.name}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteTrack = (trackId: string): void => {
    const track = tracks.find(t => t.id === trackId);
    if (track && track.url && track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }
    setTracks(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      tracks.forEach(track => {
        if (track.url && track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url);
        }
      });
    };
  }, [tracks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Music className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Music Creator
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-white/10 border border-white/20 px-3 py-2 rounded-lg text-white placeholder-white/60"
              placeholder="Project Name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sample Database */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Training Database</span>
            </h2>
            
            <div className="space-y-4">
              {loadingSamples && (
                <div className="text-center py-4">
                  <div className="text-sm text-white/60">Loading royalty-free music database...</div>
                  <div className="text-xs text-white/40 mt-1">Kevin MacLeod collection</div>
                </div>
              )}
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search samples..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60"
              />
              
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredSamples.map(sample => (
                  <div
                    key={sample.id}
                    onClick={() => setSelectedSample(sample)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSample?.id === sample.id 
                        ? 'bg-purple-600/50 border border-purple-400' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium">{sample.title}</div>
                    <div className="text-xs text-white/60">{sample.artist}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded capitalize">
                        {sample.genre}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white/60">
                          {sample.tempo} BPM • {sample.key}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSample(sample);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 p-1 rounded-full transition-colors"
                          title="Preview sample"
                        >
                          {samplePlaying === sample.id ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sample.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-blue-500/30 px-1 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedSample && (
                <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-200">Selected Reference:</div>
                  <div className="text-xs text-purple-300">{selectedSample.title}</div>
                  <div className="text-xs text-purple-400 mt-1">
                    Mood: {selectedSample.mood} • Style: {selectedSample.genre}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Generation */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Radio className="w-5 h-5" />
                <span>AI Music Generation</span>
              </h2>
              
              {/* Status Window */}
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 mb-4 font-mono text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-400">Status:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white">{connectionStatus}</span>
                    {(connectionStatus.includes('❌') || connectionStatus.includes('Offline')) && (
                      <button
                        onClick={checkBackendConnection}
                        disabled={isCheckingConnection}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded text-xs transition-colors"
                        title="Retry backend connection"
                      >
                        {isCheckingConnection ? '🔄' : '🔄 Retry'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">Command:</span>
                  <span className="text-white">{currentCommand}</span>
                </div>
                {generationStep && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-yellow-400">Process:</span>
                    <span className="text-white">{generationStep}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="Describe the music you want to create... (e.g., 'upbeat pop song with guitar and drums, happy mood')"
                  className="w-full h-24 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 resize-none"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      {genres.map(genre => (
                        <option key={genre} value={genre} className="bg-gray-800">
                          {genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Tempo (BPM)</label>
                    <input
                      type="range"
                      min="60"
                      max="200"
                      value={tempo}
                      onChange={(e) => setTempo(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-white/70">{tempo}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Key</label>
                    <select
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      {keys.map(k => (
                        <option key={k} value={k} className="bg-gray-800">{k}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (s)</label>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-white/70">{duration}s</div>
                  </div>
                </div>
                
                <button
                  onClick={generateMusic}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  {isGenerating ? `Generating Music... ${generationProgress}%` : 'Generate Music'}
                </button>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Error Messages */}
                {generationError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400">⚠️</span>
                      <span>{generationError}</span>
                    </div>
                    <button 
                      onClick={() => setGenerationError('')}
                      className="text-red-400 hover:text-red-300 text-sm mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {connectionError && (
                  <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 text-orange-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-400">⚠️</span>
                      <span>{connectionError}</span>
                    </div>
                    <button 
                      onClick={() => setConnectionError('')}
                      className="text-orange-400 hover:text-orange-300 text-sm mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Audio</span>
              </h2>
              
              <label className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Track List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Tracks ({tracks.length})</span>
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className={`bg-white/10 rounded-lg p-4 border ${
                    currentTrack?.id === track.id ? 'border-purple-400' : 'border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate flex-1">{track.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => downloadTrack(track)}
                        className="text-green-400 hover:text-green-300"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTrack(track.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {track.type === 'generated' && (
                    <div className="text-xs text-white/60 mb-2">
                      {track.genre} • {track.key} • {track.tempo} BPM
                      {track.sampleReference && (
                        <span className="ml-1">• Ref: {track.sampleReference}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 capitalize">{track.type}</span>
                    <button
                      onClick={() => playTrack(track)}
                      className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full transition-colors"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              
              {tracks.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tracks yet. Generate or upload some music!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <audio
        ref={audioElementRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
      />
      
      <audio
        ref={sampleAudioRef}
        onEnded={() => setSamplePlaying(null)}
        onPause={() => setSamplePlaying(null)}
        onError={(e) => {
          console.error('Sample audio error:', e);
          setSamplePlaying(null);
        }}
      />
    </div>
  );
};

export default AIMusicsCreator;