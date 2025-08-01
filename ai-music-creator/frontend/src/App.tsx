import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Download, Music, Radio, Volume2, Trash2, Link, Unlink, Clock, Loader2 } from 'lucide-react';
import io from 'socket.io-client';

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

interface SpotifyStatus {
  connected: boolean;
  timeLeft: number;
  expiresAt: string | null;
  credentialsConfigured: boolean;
  setupRequired: boolean;
}

interface AIModel {
  id: string;
  name: string;
  type: 'instrument_focused' | 'holistic' | 'genre_specialist' | 'experimental' | 'basic';
  description: string;
  isActive: boolean;
  createdAt: number;
  lastUsed: number | null;
  generationCount: number;
  successRate: number;
  averageRating: number;
  config: any;
  trainingData?: any;
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
  
  // Spotify connection state
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>({ 
    connected: false, 
    timeLeft: 0, 
    expiresAt: null, 
    credentialsConfigured: true, // Assume configured by default
    setupRequired: false // Show connect button by default
  });
  const [spotifyConnecting, setSpotifyConnecting] = useState<boolean>(false);
  const [spotifyError, setSpotifyError] = useState<string>('');
  const [trainingMessage, setTrainingMessage] = useState<string>('');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<string>('');
  
  // AI Model Management State
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [showModelManager, setShowModelManager] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string>('');
  const [archivedModels, setArchivedModels] = useState<any[]>([]);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  const audioElementRef = useRef<HTMLAudioElement>(null);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);

  // Royalty-free music database with actual working URLs
  const fallbackSamples: Sample[] = [
    { 
      id: 1, 
      title: "Acoustic Folk", 
      artist: "Kevin MacLeod", 
      genre: "folk", 
      tempo: 90, 
      key: "C", 
      mood: "peaceful", 
      tags: ["acoustic", "guitar", "calm"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3" 
    },
    { 
      id: 2, 
      title: "Electronic Beat", 
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
      title: "Jazz Piano", 
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
      title: "Rock Guitar", 
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
      title: "Ambient Synth", 
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
      title: "Hip-Hop Beat", 
      artist: "Kevin MacLeod", 
      genre: "hip-hop", 
      tempo: 100, 
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
      title: "Pop Indie", 
      artist: "Kevin MacLeod", 
      genre: "pop", 
      tempo: 115, 
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
      tempo: 95, 
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
      tempo: 85, 
      key: "A", 
      mood: "soulful", 
      tags: ["blues", "guitar", "emotional"], 
      previewUrl: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Laid%20Back%20Guitars.mp3" 
    }
  ];

  // Fetch samples from Spotify-trained model
  const fetchTrainedSamples = async (): Promise<Sample[]> => {
    try {
      setLoadingSamples(true);
      console.log('🎵 Loading Spotify-trained samples...');
      
      const response = await fetch('http://localhost:3001/api/trained-samples');
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.samples.length > 0) {
          console.log(`✅ Loaded ${data.samples.length} Spotify-trained samples`);
          return data.samples;
        } else if (data.showEmptyState) {
          console.log('⚠️ Training not complete, showing empty state');
          return []; // Return empty array to show empty state
        } else {
          console.log('⚠️ No training data available, using fallback samples');
          return fallbackSamples;
        }
      } else {
        throw new Error(`Failed to fetch trained samples: ${response.status}`);
      }
      
    } catch (error) {
      console.warn('Could not load Spotify-trained samples, using fallback:', error);
      return fallbackSamples;
    } finally {
      setLoadingSamples(false);
    }
  };

  // Load samples on component mount
  useEffect(() => {
    const loadSamples = async () => {
      const samples = await fetchTrainedSamples();
      setSampleDatabaseLoaded(samples);
    };
    loadSamples();
    
    // Set up WebSocket connection for training updates
    const socket = io('http://localhost:3001');
    
    socket.on('training_start', (data: { message: string }) => {
      console.log('🎓 Training started:', data.message);
      setIsTraining(true);
      setTrainingProgress('Connecting to Spotify and searching for reggae tracks...');
      setTrainingMessage('');
    });
    
    socket.on('training_progress', (data: { message: string; current: number; total: number }) => {
      console.log('📊 Training progress:', data);
      setTrainingProgress(`Processing track ${data.current}/${data.total}: ${data.message}`);
    });
    
    socket.on('model_training_complete', (data: { modelId: string; success: boolean; result?: any; error?: string }) => {
      console.log('🤖 Model training completed:', data);
      if (data.success) {
        setTrainingMessage(`Model ${data.modelId} training completed successfully!`);
        // Refresh models list
        fetchModels();
      } else {
        setModelError(`Model training failed: ${data.error}`);
      }
    });
    
    socket.on('training_complete', (data: { success: boolean; tracksAdded: number; message: string }) => {
      console.log('✅ Training complete:', data);
      setIsTraining(false);
      setTrainingProgress('');
      setTrainingMessage(data.message);
      setTimeout(() => setTrainingMessage(''), 5000); // Clear after 5 seconds
      
      // Refresh samples to show newly trained tracks
      const refreshSamples = async () => {
        const samples = await fetchTrainedSamples();
        setSampleDatabaseLoaded(samples);
      };
      refreshSamples();
    });
    
    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Use loaded samples, show empty state, or fallback
  const sampleDatabase = sampleDatabaseLoaded.length > 0 ? sampleDatabaseLoaded : 
                         sampleDatabaseLoaded.length === 0 && !loadingSamples ? [] : 
                         fallbackSamples;

  const genres: string[] = ['pop', 'rock', 'jazz', 'electronic', 'hip-hop', 'classical', 'country', 'blues'];
  const keys: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const filteredSamples = sampleDatabase.filter(sample => 
    sample.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check backend connection
  const checkBackendConnection = async (): Promise<void> => {
    try {
      setIsCheckingConnection(true);
      setCurrentCommand('Checking backend connection...');
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
        setCurrentCommand('Backend Ready');
        console.log('🔗 Backend connection successful:', data);
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Backend connection failed:', error);
      
      if (error.name === 'TimeoutError') {
        setConnectionError('Backend connection timeout. Is the server running on port 3001?');
      } else if (error.message.includes('fetch')) {
        setConnectionError('Cannot reach backend server. Please start the backend on port 3001.');
      } else {
        setConnectionError(`Backend error: ${error.message}`);
      }
      
      setConnectionStatus('❌ Backend Offline');
      setConnectionError('Unknown backend connection error.');
      setCurrentCommand('Backend Connection Failed');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Model Management Functions
  const fetchModels = async (): Promise<void> => {
    try {
      setIsLoadingModels(true);
      setModelError('');
      
      const response = await fetch('http://localhost:3001/api/models');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        setCurrentModel(data.currentModel || null);
        console.log('🤖 Models loaded:', data);
      } else {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch models:', error);
      setModelError(`Failed to load models: ${error.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const switchModel = async (modelId: string): Promise<void> => {
    try {
      setModelError('');
      
      const response = await fetch('http://localhost:3001/api/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentModel(data.currentModel);
        console.log('🤖 Switched to model:', data.currentModel.name);
        setTrainingMessage(`Switched to ${data.currentModel.name}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch model');
      }
    } catch (error: any) {
      console.error('❌ Failed to switch model:', error);
      setModelError(`Failed to switch model: ${error.message}`);
    }
  };

  const createModel = async (type: string, name: string, description?: string): Promise<void> => {
    try {
      setModelError('');
      
      const response = await fetch('http://localhost:3001/api/models/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🤖 Model created:', data.model);
        setTrainingMessage(`Created new ${type} model: ${name}`);
        // Refresh models list
        await fetchModels();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create model');
      }
    } catch (error: any) {
      console.error('❌ Failed to create model:', error);
      setModelError(`Failed to create model: ${error.message}`);
    }
  };

  const trainModel = async (modelId: string, genre: string, trackCount: number = 20): Promise<void> => {
    try {
      setModelError('');
      setTrainingMessage(`Starting training for model ${modelId}...`);
      
      const response = await fetch(`http://localhost:3001/api/models/${modelId}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, trackCount })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🤖 Model training started:', data);
        setTrainingMessage(data.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start training');
      }
    } catch (error: any) {
      console.error('❌ Failed to start model training:', error);
      setModelError(`Failed to start training: ${error.message}`);
    }
  };

  const fetchArchivedModels = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/api/models/archive');
      if (response.ok) {
        const data = await response.json();
        setArchivedModels(data.archivedModels || []);
        console.log('📦 Archived models loaded:', data);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch archived models:', error);
    }
  };

  const archiveModel = async (modelId: string, archiveName: string): Promise<void> => {
    try {
      setModelError('');
      
      const response = await fetch(`http://localhost:3001/api/models/${modelId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archiveName })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Model archived:', data);
        setTrainingMessage(`Archived: ${data.archiveName}`);
        // Refresh both active and archived models
        await fetchModels();
        await fetchArchivedModels();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive model');
      }
    } catch (error: any) {
      console.error('❌ Failed to archive model:', error);
      setModelError(`Failed to archive model: ${error.message}`);
    }
  };

  const restoreArchivedModel = async (archiveId: string): Promise<void> => {
    try {
      setModelError('');
      
      const response = await fetch(`http://localhost:3001/api/models/archive/${archiveId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Model restored:', data);
        setTrainingMessage(`Restored: ${data.model.name}`);
        // Refresh both active and archived models
        await fetchModels();
        await fetchArchivedModels();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore model');
      }
    } catch (error: any) {
      console.error('❌ Failed to restore model:', error);
      setModelError(`Failed to restore model: ${error.message}`);
    }
  };

  // Check backend connection on mount and setup intervals
  useEffect(() => {
    checkBackendConnection();
    checkSpotifyStatus();
    fetchModels();
    fetchArchivedModels();
    
    // Check for Spotify callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_connected') === 'true') {
      setSpotifyError('');
      checkSpotifyStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('spotify_error')) {
      setSpotifyError(decodeURIComponent(urlParams.get('spotify_error') || ''));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Set up intervals for status updates
    const statusInterval = setInterval(checkSpotifyStatus, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Separate effect for Spotify countdown timer - updates every second
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    if (spotifyStatus.connected && spotifyStatus.timeLeft > 0) {
      countdownInterval = setInterval(() => {
        setSpotifyStatus(prev => {
          if (prev.timeLeft <= 1) {
            // Time expired, disconnect
            return {
              ...prev,
              connected: false,
              timeLeft: 0,
              expiresAt: null
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [spotifyStatus.connected, spotifyStatus.timeLeft]);

  // Spotify functions
  const checkSpotifyStatus = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/api/spotify/status');
      if (response.ok) {
        const status: SpotifyStatus = await response.json();
        console.log('📊 Spotify status:', status);
        setSpotifyStatus(status);
      } else {
        console.log('❌ Spotify status check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      // When backend is not available, assume setup is not required (fallback)
      setSpotifyStatus(prev => ({ 
        ...prev, 
        connected: false,
        setupRequired: false,
        credentialsConfigured: true
      }));
    }
  };

  const connectToSpotify = async (): Promise<void> => {
    try {
      setSpotifyConnecting(true);
      setSpotifyError('');
      
      const response = await fetch('http://localhost:3001/api/spotify/auth-url');
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      setSpotifyError(`Failed to connect: ${error.message}`);
      setSpotifyConnecting(false);
    }
  };

  const disconnectFromSpotify = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/api/spotify/disconnect', {
        method: 'POST'
      });
      if (response.ok) {
        setSpotifyStatus({ 
          connected: false, 
          timeLeft: 0, 
          expiresAt: null, 
          credentialsConfigured: true, 
          setupRequired: false 
        });
        setSpotifyError('');
      }
    } catch (error: any) {
      setSpotifyError(`Failed to disconnect: ${error.message}`);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playSample = async (sample: Sample): Promise<void> => {
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
      // Stop any currently playing sample
      sampleAudioRef.current.pause();
      sampleAudioRef.current.currentTime = 0;
      
      // For Spotify-trained samples, cache them for fast playback
      if (sample.previewUrl && !sample.previewUrl.startsWith('spotify:')) {
        console.log('📥 Caching Spotify-trained sample:', sample.title);
        const cacheResponse = await fetch('http://localhost:3001/api/cache-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            songId: `spotify_${sample.id}`,
            url: sample.previewUrl,
            title: `${sample.artist} - ${sample.title}`
          })
        });
        
        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          console.log('✅ Using cached Spotify sample:', cacheData.cachedUrl);
          
          sampleAudioRef.current.volume = 0.7;
          sampleAudioRef.current.src = cacheData.cachedUrl;
          
          const playPromise = sampleAudioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Spotify sample playing successfully');
                setSamplePlaying(sample.id);
              })
              .catch(error => {
                console.warn('⚠️ Spotify sample playback failed:', error);
                setSamplePlaying(null);
              });
          }
          return;
        }
      }
      
      // Fallback for other samples or if caching fails
      if (sample.previewUrl && !sample.previewUrl.startsWith('spotify:')) {
        console.log('🎵 Playing sample directly:', sample.previewUrl);
        sampleAudioRef.current.volume = 0.7;
        sampleAudioRef.current.crossOrigin = "anonymous";
        sampleAudioRef.current.src = sample.previewUrl;
        
        const playPromise = sampleAudioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Sample playing successfully');
              setSamplePlaying(sample.id);
            })
            .catch(() => {
              console.log('ℹ️ Sample URL blocked (expected due to CORS policy)');
              setSamplePlaying(null);
            });
        }
      } else {
        console.log('ℹ️ No playable preview URL available for this Spotify track');
        setSamplePlaying(null);
      }
      
    } catch (error) {
      console.error('❌ Error playing sample:', error);
      setSamplePlaying(null);
    }
  };

  const generateMusic = async (): Promise<void> => {
    setIsGenerating(true);
    setGenerationError('');
    setGenerationProgress(0);
    setCurrentCommand('Running AI Music Generation');
    
    try {
      setGenerationStep('🚀 Connecting to AI generation server...');
      setGenerationProgress(5);
      
      // Connect to socket for real-time music generation updates
      const socket = io('http://localhost:3001');
      
      socket.on('generation_status', (status: { message: string; progress: number; step: string }) => {
        setGenerationStep(status.message);
        setGenerationProgress(status.progress);
        setCurrentCommand(status.step);
      });
      
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-socket-id': socket.id || ''
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          genre: selectedGenre,
          tempo: tempo,
          key: key,
          duration: duration,
          sampleReference: selectedSample?.title || null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI generation complete:', result);
        
        const newTrack: Track = {
          id: Date.now().toString(),
          name: result.track?.name || `AI Generated ${selectedGenre}`,
          url: `http://localhost:3001${result.url}`,
          type: 'generated',
          prompt: generationPrompt,
          genre: selectedGenre,
          tempo: tempo,
          key: key,
          duration: duration,
          sampleReference: selectedSample?.title || null
        };
        
        setTracks(prev => [...prev, newTrack]);
        setGenerationPrompt('');
        setGenerationStep('✅ AI generation complete!');
        setGenerationProgress(100);
        setCurrentCommand('AI track generated successfully');
        
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
          setGenerationStep('');
          setCurrentCommand('Idle');
        }, 2000);
        
      } else {
        const errorData = await response.json();
        if (errorData.requiresSpotify) {
          setGenerationError('Please connect to Spotify first to generate authentic reggae music');
        } else if (errorData.isTraining !== undefined) {
          setGenerationError(errorData.message || 'The AI model is still training. Please wait...');
        } else {
          setGenerationError(errorData.error || `Server error: ${response.status}`);
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      socket.disconnect();
      
    } catch (error: any) {
      console.error('❌ AI generation failed:', error);
      setGenerationError(`AI generation failed: ${error.message}`);
      setGenerationStep('❌ Generation failed');
      setCurrentCommand('Generation Error');
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStep('');
        setCurrentCommand('Idle');
      }, 3000);
    }
  };

  const playTrack = (track: Track): void => {
    if (currentTrack?.id === track.id && isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    setCurrentTrack(track);
    
    if (audioElementRef.current) {
      audioElementRef.current.src = track.url;
      audioElementRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Error playing track:', error);
          setIsPlaying(false);
        });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const newTrack: Track = {
        id: Date.now().toString(),
        name: file.name,
        url: url,
        type: 'uploaded'
      };

      setTracks(prev => [...prev, newTrack]);
    }
  };

  const deleteTrack = (trackId: string): void => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Music className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              EMmusicGen
            </h1>
          </div>
          <p className="text-lg text-white/80 mb-4">Student practice with first-time music generation</p>
          
          {/* Prominent Training Status Banner */}
          {isTraining && (
            <div className="mb-4 mx-auto max-w-lg">
              <div className="bg-gradient-to-r from-blue-600/40 to-purple-600/40 border-2 border-blue-400/50 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin mr-4 text-blue-300" />
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-200">🎓 AI Model Training in Progress</div>
                    <div className="text-blue-300 text-sm mt-1">{trainingProgress || 'Initializing training...'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className={`px-3 py-1 rounded-full ${connectionStatus.includes('✅') ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {connectionStatus}
            </span>
            <button 
              onClick={checkBackendConnection}
              disabled={isCheckingConnection}
              className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full hover:bg-blue-600/30 transition-colors"
              title="Retry backend connection"
            >
              {isCheckingConnection ? 'Checking...' : 'Retry Connection'}
            </button>
          </div>
          
          {/* Spotify Connection Status */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            {spotifyStatus.setupRequired ? (
              <div className="bg-blue-600/20 text-blue-300 border border-blue-600/30 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4" />
                  <span>Spotify Setup Required</span>
                </div>
                <div className="text-xs mt-1 text-blue-400">
                  Configure SPOTIFY_CLIENT_ID in .env for enhanced features
                </div>
              </div>
            ) : (
              <>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  spotifyStatus.connected 
                    ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                    : 'bg-orange-600/20 text-orange-300 border border-orange-600/30'
                }`}>
                  {spotifyStatus.connected ? (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Spotify Connected</span>
                      {spotifyStatus.timeLeft > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeLeft(spotifyStatus.timeLeft)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4" />
                      <span>Spotify Disconnected</span>
                    </>
                  )}
                </div>
                
                {spotifyStatus.connected ? (
                  <button
                    onClick={disconnectFromSpotify}
                    className="px-3 py-1 bg-red-600/20 text-red-300 rounded-full hover:bg-red-600/30 transition-colors border border-red-600/30"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={connectToSpotify}
                    disabled={spotifyConnecting}
                    className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full hover:bg-green-600/30 transition-colors border border-green-600/30 disabled:opacity-50"
                  >
                    {spotifyConnecting ? 'Connecting...' : 'Connect Spotify'}
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* AI Model Selector */}
          <div className="mb-4 mx-auto max-w-4xl">
            <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border-2 border-indigo-400/50 rounded-xl p-4 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-indigo-200">🤖 AI Generation Model</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModelManager(!showModelManager)}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full hover:bg-indigo-600/30 transition-colors border border-indigo-600/30 text-sm"
                  >
                    {showModelManager ? 'Hide' : 'Manage Models'}
                  </button>
                  <button
                    onClick={() => setShowArchive(!showArchive)}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full hover:bg-purple-600/30 transition-colors border border-purple-600/30 text-sm"
                  >
                    Archive ({archivedModels.length})
                  </button>
                </div>
              </div>
              
              {currentModel && (
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="text-sm text-indigo-300">Current:</div>
                    <div className="ml-2 font-semibold text-white">{currentModel.name}</div>
                    <div className="ml-2 px-2 py-1 bg-indigo-600/30 text-indigo-200 rounded text-xs">
                      {currentModel.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-xs text-indigo-400">
                    {currentModel.generationCount} generations • {(currentModel.successRate * 100).toFixed(1)}% success
                  </div>
                </div>
              )}
              
              {showModelManager && (
                <div className="mt-4 space-y-3">
                  {isLoadingModels ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-indigo-300">Loading models...</div>
                    </div>
                  ) : (
                    <>
                      {/* Quick Create Buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => createModel('instrument_focused', `Instrument Focus ${Date.now()}`)}
                          className="px-3 py-1 bg-green-600/20 text-green-300 rounded hover:bg-green-600/30 transition-colors text-sm"
                        >
                          + Instrument Focused
                        </button>
                        <button
                          onClick={() => createModel('holistic', `Holistic ${Date.now()}`)}
                          className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition-colors text-sm"
                        >
                          + Holistic
                        </button>
                        <button
                          onClick={() => createModel('genre_specialist', `Genre Specialist ${Date.now()}`)}
                          className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/30 transition-colors text-sm"
                        >
                          + Genre Specialist
                        </button>
                        <button
                          onClick={() => createModel('experimental', `Experimental ${Date.now()}`)}
                          className="px-3 py-1 bg-orange-600/20 text-orange-300 rounded hover:bg-orange-600/30 transition-colors text-sm"
                        >
                          + Experimental
                        </button>
                      </div>
                      
                      {/* Models List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {availableModels.map(model => (
                          <div
                            key={model.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              currentModel?.id === model.id
                                ? 'bg-indigo-600/30 border-indigo-400/50 shadow-lg'
                                : 'bg-black/20 border-gray-600/30 hover:bg-black/30'
                            }`}
                            onClick={() => switchModel(model.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-sm text-white">{model.name}</div>
                              <div className="flex items-center space-x-1">
                                {currentModel?.id === model.id && (
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                )}
                                <div className="px-2 py-0.5 bg-gray-600/30 text-gray-300 rounded text-xs">
                                  {model.type.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mb-2">{model.description}</div>
                            <div className="text-xs text-gray-500 flex justify-between">
                              <span>{model.generationCount} uses</span>
                              <span>{(model.successRate * 100).toFixed(0)}% success</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {modelError && (
                    <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded p-2">
                      ⚠️ {modelError}
                    </div>
                  )}
                </div>
              )}

              {/* Archive Management */}
              {showArchive && (
                <div className="mt-4 space-y-3">
                  <div className="border-t border-indigo-600/30 pt-3">
                    <h4 className="text-sm font-semibold text-purple-200 mb-3">📦 Model Archive ({archivedModels.length})</h4>
                    
                    {/* Archive Current Model */}
                    {currentModel && (
                      <div className="mb-4 p-3 bg-purple-600/20 rounded-lg border border-purple-600/30">
                        <div className="text-sm text-purple-200 mb-2">Complete Development & Archive Current Model:</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Archive name for "${currentModel.name}"`}
                            className="flex-1 px-3 py-1 bg-black/30 border border-purple-600/30 rounded text-white text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  archiveModel(currentModel.id, input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input.value.trim()) {
                                archiveModel(currentModel.id, input.value.trim());
                                input.value = '';
                              }
                            }}
                            className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded hover:bg-purple-600/40 transition-colors text-sm"
                          >
                            📦 Archive
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Archived Models List */}
                    {archivedModels.length === 0 ? (
                      <div className="text-center py-4 text-purple-400 text-sm">
                        No archived models yet. Complete development and archive your current model to start building your AI collection.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {archivedModels.map(archive => (
                          <div
                            key={archive.archiveId}
                            className="p-3 rounded-lg border bg-purple-900/20 border-purple-600/30 hover:bg-purple-900/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm text-white">{archive.name}</div>
                              <div className="px-2 py-0.5 bg-purple-600/30 text-purple-200 rounded text-xs">
                                {archive.type.replace('_', ' ')}
                              </div>
                            </div>
                            <div className="text-xs text-purple-400 mb-2">{archive.description}</div>
                            <div className="text-xs text-purple-500 mb-3">
                              Archived: {new Date(archive.archivedAt).toLocaleDateString()}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-purple-500">
                                {archive.finalStats?.generationsCount || 0} generations
                              </div>
                              <button
                                onClick={() => restoreArchivedModel(archive.archiveId)}
                                className="px-2 py-1 bg-green-600/20 text-green-300 rounded hover:bg-green-600/30 transition-colors text-xs"
                              >
                                🔄 Restore
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {connectionError && (
            <div className="mt-2 text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
              ⚠️ {connectionError}
            </div>
          )}
          
          {spotifyError && (
            <div className="mt-2 text-orange-400 text-sm bg-orange-900/20 border border-orange-600/30 rounded-lg p-3">
              🎵 Spotify: {spotifyError}
            </div>
          )}
          
          {!spotifyStatus.connected && !spotifyStatus.setupRequired && (
            <div className="mt-2 text-blue-400 text-sm bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              💡 Connect your Spotify account to access better reggae training data from your music library
            </div>
          )}
          
          {spotifyStatus.setupRequired && (
            <div className="mt-2 text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
              ⚙️ <strong>Optional:</strong> For enhanced music generation, see SPOTIFY_SETUP.md for Spotify integration setup
            </div>
          )}
          
          {isTraining && (
            <div className="mt-2 text-blue-400 text-sm bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 flex items-center">
              <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-400" style={{
                animation: 'spin 1s linear infinite'
              }} />
              <div className="flex-1">
                <div className="font-semibold flex items-center">
                  🎓 Training AI Model...
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
                <div className="text-blue-300 text-xs mt-1">{trainingProgress}</div>
              </div>
            </div>
          )}
          
          {trainingMessage && !isTraining && (
            <div className="mt-2 text-green-400 text-sm bg-green-900/20 border border-green-600/30 rounded-lg p-3">
              🎓 {trainingMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sample Database */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Training Samples</span>
            </h2>
            
            <div className="space-y-4">
              {loadingSamples && (
                <div className="text-center py-4">
                  <div className="text-sm text-white/60">Loading Spotify-trained samples...</div>
                  <div className="text-xs text-white/40 mt-1">Training data from connected Spotify account</div>
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
                {filteredSamples.length === 0 && !loadingSamples ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">No training samples available</p>
                    <p className="text-white/40 text-xs mt-1">
                      {!spotifyStatus.connected 
                        ? 'Connect to Spotify to train the model'
                        : 'Training in progress...'
                      }
                    </p>
                  </div>
                ) : (
                  filteredSamples.map(sample => (
                  <div
                    key={sample.id}
                    onClick={() => setSelectedSample(sample)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSample?.id === sample.id 
                        ? 'bg-purple-600/50 border border-purple-400' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{sample.title}</div>
                        <div className="text-xs text-white/60">{sample.artist}</div>
                        <div className="text-xs text-white/50 mt-1">
                          {sample.genre} • {sample.tempo} BPM • {sample.key}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSample(sample);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 p-1 rounded-full transition-colors"
                          title="Preview sample"
                        >
                          {samplePlaying === sample.id ? (
                            <Pause className="w-3 h-3 text-white" />
                          ) : (
                            <Play className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sample.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  ))
                )}
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

          {/* Generation Controls */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Radio className="w-5 h-5" />
              <span>AI Music Generation</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Describe your music
                </label>
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="e.g., 'Upbeat electronic dance music with heavy bass and energetic synths'"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 resize-none h-20"
                  disabled={isGenerating}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    disabled={isGenerating}
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre} className="bg-gray-800 text-white">
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Key</label>
                  <select
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    disabled={isGenerating}
                  >
                    {keys.map(k => (
                      <option key={k} value={k} className="bg-gray-800 text-white">{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Tempo: {tempo} BPM
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="180"
                    value={tempo}
                    onChange={(e) => setTempo(parseInt(e.target.value))}
                    className="w-full"
                    disabled={isGenerating}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Duration: {duration}s
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-white/70">{duration}s</div>
                </div>
              </div>
              
              <button
                onClick={generateMusic}
                disabled={isGenerating || !spotifyStatus.connected || sampleDatabase.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                {isGenerating ? `AI Generating... ${generationProgress}%` : 
                 !spotifyStatus.connected ? 'Connect Spotify to Generate' :
                 sampleDatabase.length === 0 ? 'Waiting for Training...' :
                 'Generate with AI'}
              </button>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              )}
              
              {/* Generation Step */}
              {generationStep && (
                <div className="text-center text-sm text-white/80 bg-white/5 rounded-lg p-2">
                  {generationStep}
                </div>
              )}
              
              {/* Generation Error */}
              {generationError && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                  ⚠️ {generationError}
                </div>
              )}
            </div>
          </div>

          {/* Track List & Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Tracks</span>
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tracks.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <Music className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p>No tracks yet</p>
                  <p className="text-sm">Generate or upload music to get started</p>
                </div>
              ) : (
                tracks.map(track => (
                  <div
                    key={track.id}
                    className={`p-3 rounded-lg border transition-all ${
                      currentTrack?.id === track.id 
                        ? 'bg-purple-600/30 border-purple-400' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{track.name}</div>
                        <div className="text-xs text-white/60 flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            track.type === 'generated' ? 'bg-green-600/20 text-green-300' : 'bg-blue-600/20 text-blue-300'
                          }`}>
                            {track.type === 'generated' ? 'AI Generated' : 'Uploaded'}
                          </span>
                          {track.genre && <span>{track.genre}</span>}
                          {track.tempo && <span>{track.tempo} BPM</span>}
                          {track.key && <span>{track.key}</span>}
                        </div>
                        {track.prompt && (
                          <div className="text-xs text-white/50 mt-1 truncate">
                            "{track.prompt}"
                          </div>
                        )}
                        {track.sampleReference && (
                          <div className="text-xs text-purple-300 mt-1">
                            Referenced: {track.sampleReference}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3">
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
                        
                        <button
                          onClick={() => deleteTrack(track.id)}
                          className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* File Upload */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <label className="flex items-center justify-center w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                <span className="text-sm">Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="mt-8 text-center">
          <div className="text-sm text-white/60">
            Status: <span className="text-white/80">{currentCommand}</span>
          </div>
        </div>
      </div>
      
      {/* Audio Elements */}
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