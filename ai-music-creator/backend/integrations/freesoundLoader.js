/**
 * Freesound Sample Loader
 * Loads and manages Freesound samples similar to NSynth format
 */

const fs = require('fs');
const path = require('path');

class FreesoundLoader {
  constructor() {
    this.samplesDir = './freesound-data';
    this.sampleCache = new Map();
    this.instrumentFolders = this.initializeInstrumentFolders();
  }

  /**
   * Initialize instrument folders similar to NSynth structure
   */
  initializeInstrumentFolders() {
    return {
      drums: 'drumsNsynth',
      piano: 'pianoNsynth', 
      claps: 'clapsNsynth',
      synth_lead: 'synth_leadNsynth',
      brass: 'brassNsynth'
    };
  }

  /**
   * Check if Freesound samples are available for an instrument
   */
  isInstrumentAvailable(instrumentFamily) {
    const folderName = this.instrumentFolders[instrumentFamily];
    if (!folderName) return false;
    
    const instrumentDir = path.join(this.samplesDir, folderName);
    return fs.existsSync(instrumentDir) && this.getSampleFiles(instrumentDir).length > 0;
  }

  /**
   * Get instrument notes similar to NSynth format
   */
  getInstrumentNotes(instrumentFamily) {
    const folderName = this.instrumentFolders[instrumentFamily];
    if (!folderName) return [];
    
    const instrumentDir = path.join(this.samplesDir, folderName);
    if (!fs.existsSync(instrumentDir)) return [];
    
    const sampleFiles = this.getSampleFiles(instrumentDir);
    
    return sampleFiles.map(file => {
      const baseName = path.basename(file, path.extname(file));
      const parts = baseName.split('-');
      const pitch = parseInt(parts[0]);
      const velocity = parseInt(parts[1]);
      
      return {
        pitch: pitch,
        velocity: velocity,
        path: path.join(instrumentDir, file),
        instrumentFamily: instrumentFamily
      };
    }).filter(note => !isNaN(note.pitch) && !isNaN(note.velocity));
  }

  /**
   * Get available samples for an instrument family
   */
  getInstrumentSamples(instrumentFamily) {
    const folderName = this.instrumentFolders[instrumentFamily];
    if (!folderName) return [];
    
    const instrumentDir = path.join(this.samplesDir, folderName);
    if (!fs.existsSync(instrumentDir)) return [];
    
    const sampleFiles = this.getSampleFiles(instrumentDir);
    return sampleFiles.map(file => ({
      path: path.join(instrumentDir, file),
      name: path.basename(file, path.extname(file)),
      instrumentFamily: instrumentFamily
    }));
  }

  /**
   * Get specific sample for a note/drum type
   */
  getSampleForNote(instrumentFamily, noteType) {
    const notes = this.getInstrumentNotes(instrumentFamily);
    if (notes.length === 0) return null;
    
    // For drums, map note types to MIDI note ranges
    if (instrumentFamily === 'drums') {
      const drumMidiMap = {
        'kick': [35, 36], // B1, C2
        'snare': [38, 40], // D2, E2  
        'hihat': [42, 44, 46], // F#2, G#2, A#2
        'tom': [41, 43, 45, 47, 48, 50], // F2-D3
        'ride': [51, 53, 59], // D#3, F3, B3
        'crash': [49, 52, 55, 57] // C#3, E3, G3, A3
      };
      
      const targetMidiNotes = drumMidiMap[noteType];
      if (targetMidiNotes) {
        // Find samples with matching MIDI notes
        const matchingSamples = notes.filter(note => 
          targetMidiNotes.includes(note.pitch)
        );
        
        if (matchingSamples.length > 0) {
          // Return highest velocity sample
          const bestSample = matchingSamples.sort((a, b) => b.velocity - a.velocity)[0];
          return {
            path: bestSample.path,
            name: path.basename(bestSample.path, path.extname(bestSample.path)),
            instrumentFamily: instrumentFamily,
            noteType: noteType,
            pitch: bestSample.pitch,
            velocity: bestSample.velocity
          };
        }
      }
    }
    
    // For other instruments or fallback, return any available sample
    if (notes.length > 0) {
      const randomSample = notes[Math.floor(Math.random() * notes.length)];
      return {
        path: randomSample.path,
        name: path.basename(randomSample.path, path.extname(randomSample.path)),
        instrumentFamily: instrumentFamily,
        noteType: noteType,
        pitch: randomSample.pitch,
        velocity: randomSample.velocity
      };
    }
    
    return null;
  }

  /**
   * Load audio data from a Freesound sample file
   */
  async loadSampleFile(filePath) {
    try {
      // Check cache first
      if (this.sampleCache.has(filePath)) {
        return this.sampleCache.get(filePath);
      }

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Freesound sample not found: ${filePath}`);
        return null;
      }

      // For now, return a placeholder - in a real implementation,
      // you'd decode the MP3/WAV file to audio data
      // This would require additional libraries like node-ffmpeg or similar
      const audioData = await this.decodeAudioFile(filePath);
      
      // Cache the loaded sample
      this.sampleCache.set(filePath, audioData);
      
      return audioData;
      
    } catch (error) {
      console.error(`❌ Error loading Freesound sample ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Decode audio file to proper format for wavExporter
   * Now properly loads WAV files using fs and returns buffer in correct format
   */
  async decodeAudioFile(filePath) {
    const fs = require('fs');
    console.log(`🎵 Loading Freesound sample: ${path.basename(filePath)}`);
    
    try {
      // Read the WAV file as buffer (same format as instrumentSelector.js)
      const buffer = fs.readFileSync(filePath);
      
      return {
        buffer: buffer,
        path: filePath,
        sampleRate: 44100 // Default, will be read from WAV header by wavExporter
      };
      
    } catch (error) {
      console.error(`❌ Error reading WAV file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all audio files from a directory
   */
  getSampleFiles(directory) {
    if (!fs.existsSync(directory)) return [];
    
    return fs.readdirSync(directory)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.wav', '.mp3', '.aiff', '.flac'].includes(ext);
      })
      .sort();
  }

  /**
   * Get metadata about available Freesound samples
   */
  getMetadata() {
    const metadataPath = path.join(this.samplesDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      try {
        return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Failed to load Freesound metadata:', error.message);
      }
    }
    
    // Generate metadata on the fly
    const metadata = {
      source: 'Freesound.org (NSynth-compatible)',
      instruments: {}
    };
    
    Object.keys(this.instrumentFolders).forEach(instrument => {
      const samples = this.getInstrumentSamples(instrument);
      metadata.instruments[instrument] = {
        count: samples.length,
        available: samples.length > 0
      };
    });
    
    return metadata;
  }

  /**
   * Create NSynth-compatible note mapping for melodic instruments
   */
  createNoteMapping(instrumentFamily) {
    const notes = this.getInstrumentNotes(instrumentFamily);
    const noteMapping = {};
    
    // For drums, map by drum type
    if (instrumentFamily === 'drums') {
      const drumTypes = ['kick', 'snare', 'hihat', 'tom', 'ride', 'crash'];
      drumTypes.forEach(drumType => {
        const sample = this.getSampleForNote(instrumentFamily, drumType);
        if (sample) {
          noteMapping[drumType] = sample;
        }
      });
    } 
    // For melodic instruments, map by MIDI note directly
    else {
      notes.forEach(note => {
        const midiNote = note.pitch.toString();
        noteMapping[midiNote] = {
          path: note.path,
          name: path.basename(note.path, path.extname(note.path)),
          instrumentFamily: instrumentFamily,
          pitch: note.pitch,
          velocity: note.velocity
        };
      });
    }
    
    return noteMapping;
  }
}

module.exports = { FreesoundLoader };