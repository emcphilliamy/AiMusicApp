/**
 * Instrument Selector - Selects appropriate NSynth samples for drum patterns
 * 
 * Maps drum pattern notes to NSynth instrument samples:
 * - Intelligently selects samples based on style and pattern requirements
 * - Handles "auto" instrument selection with style-appropriate choices
 * - Manages sample loading and caching for performance
 * - Maps musical note names to MIDI pitch values for NSynth samples
 */

const path = require('path');
const fs = require('fs');
const { NSynthDownloader } = require('../integrations/nsynth-downloader');
const { FreesoundLoader } = require('../integrations/freesoundLoader');

class InstrumentSelector {
  constructor() {
    this.nsynthDownloader = new NSynthDownloader();
    this.freesoundLoader = new FreesoundLoader();
    this.randomSeed = Date.now();
    this.randomIndex = 0;
    this.sampleCache = new Map();
    
    console.log('🎵 Initializing instrument selector with NSynth + Freesound support');
    this.logAvailableInstruments();
    
    // Map drum note names to NSynth instrument families and MIDI pitches
    this.drumMapping = {
      kick: {
        instruments: ['bass', 'keyboard', 'mallet'], // Low-pitched instruments for kick
        pitchRange: [36, 48], // C2 to C3 - typical kick range
        preferredPitch: 36, // C2 - standard kick drum pitch
        velocity: [100, 127]
      },
      snare: {
        instruments: ['mallet', 'string', 'brass'], // Sharp, percussive for snare
        pitchRange: [57, 69], // A3 to A4 - snare range
        preferredPitch: 60, // C4 - middle C
        velocity: [80, 120]
      },
      hihat: {
        instruments: ['brass', 'string', 'synth_lead'], // Bright, metallic sounds
        pitchRange: [72, 84], // C5 to C6 - high pitched
        preferredPitch: 76, // E5
        velocity: [60, 100]
      },
      ride: {
        instruments: ['brass', 'string', 'mallet'], // Sustained metallic sounds
        pitchRange: [69, 81], // A4 to A5 - mid-high range
        preferredPitch: 72, // C5
        velocity: [70, 110]
      },
      tom: {
        instruments: ['mallet', 'keyboard', 'string'], // Tonal percussion
        pitchRange: [48, 67], // C3 to G4 - tom range
        preferredPitch: 55, // G3
        velocity: [80, 120]
      },
      crash: {
        instruments: ['brass', 'string'], // Bright, explosive sounds
        pitchRange: [79, 91], // G5 to G6 - very high
        preferredPitch: 84, // C6
        velocity: [90, 127]
      }
    };
    
    // Style-specific instrument preferences
    this.styleInstrumentPreferences = {
      jazz: {
        preferredInstruments: ['brass', 'mallet', 'string'],
        avoidInstruments: ['synth_lead'],
        velocityModifier: 0.8, // Generally softer in jazz
        sampleSelection: 'warm' // Prefer warmer, more organic samples
      },
      funk: {
        preferredInstruments: ['mallet', 'string', 'bass'],
        avoidInstruments: [],
        velocityModifier: 0.9, // Punchy but controlled
        sampleSelection: 'tight' // Sharp, defined samples
      },
      house: {
        preferredInstruments: ['synth_lead', 'bass', 'brass'],
        avoidInstruments: ['flute'],
        velocityModifier: 1.0, // Full power
        sampleSelection: 'electronic' // Clean, synthetic sounds
      },
      'lo-fi': {
        preferredInstruments: ['mallet', 'keyboard', 'string'],
        avoidInstruments: ['brass', 'synth_lead'],
        velocityModifier: 0.7, // Softer, more subdued
        sampleSelection: 'vintage' // Warmer, softer samples
      },
      pop: {
        preferredInstruments: ['mallet', 'bass', 'brass'],
        avoidInstruments: [],
        velocityModifier: 0.85, // Balanced
        sampleSelection: 'balanced' // Clear but not harsh
      },
      upbeat: {
        preferredInstruments: ['brass', 'synth_lead', 'mallet'],
        avoidInstruments: [],
        velocityModifier: 0.95, // Energetic
        sampleSelection: 'bright' // Cutting through the mix
      },
      default: {
        preferredInstruments: ['mallet', 'bass', 'string'],
        avoidInstruments: [],
        velocityModifier: 0.85,
        sampleSelection: 'balanced'
      }
    };
  }

  /**
   * Set random seed for reproducible instrument selection
   * @param {number} seed - Random seed
   */
  setSeed(seed) {
    this.randomSeed = seed;
    this.randomIndex = 0;
  }

  /**
   * Seeded random number generator
   * @returns {number} Random number between 0 and 1
   */
  seededRandom() {
    const x = Math.sin(this.randomSeed + this.randomIndex++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Select instrument samples based on pattern and style
   * @param {Object} config - Selection configuration
   * @param {string} config.instrument - Instrument selection ('auto' or specific)
   * @param {string} config.keyword - Style keyword
   * @param {Object} config.pattern - Generated pattern with events
   * @returns {Promise<Object>} Instrument data with samples
   */
  async select({ instrument, keyword, pattern }) {
    console.log(`🎹 Selecting instruments for ${keyword} style...`);
    
    const stylePrefs = this.styleInstrumentPreferences[keyword] || 
                      this.styleInstrumentPreferences.default;
    
    if (instrument === 'auto') {
      return await this.autoSelectInstrument(pattern, keyword, stylePrefs);
    } else {
      return await this.selectSpecificInstrument(instrument, pattern, stylePrefs);
    }
  }

  /**
   * Automatically select the best instrument based on style and pattern
   * @private
   */
  async autoSelectInstrument(pattern, keyword, stylePrefs) {
    console.log(`🤖 Auto-selecting instrument for ${keyword}...`);
    
    // Analyze pattern to determine what note types are used
    const noteTypes = this.analyzePatternNotes(pattern);
    console.log(`📊 Pattern uses notes: ${Object.keys(noteTypes).join(', ')}`);
    
    // Select the most suitable NSynth instrument family
    const selectedFamily = this.selectBestInstrumentFamily(noteTypes, stylePrefs);
    console.log(`🎯 Selected instrument family: ${selectedFamily}`);
    
    // Load samples for each note type used in the pattern
    const samples = {};
    for (const noteType of Object.keys(noteTypes)) {
      const sample = await this.loadSampleForNote(noteType, selectedFamily, stylePrefs);
      if (sample) {
        samples[noteType] = sample;
      } else {
        console.warn(`⚠️  No sample found for ${noteType} in ${selectedFamily}, using fallback`);
        samples[noteType] = await this.getFallbackSample(noteType);
      }
    }
    
    return {
      type: selectedFamily,
      mode: 'auto',
      samples: Object.values(samples).filter(Boolean),
      noteMapping: samples,
      stylePrefs
    };
  }

  /**
   * Select a specific instrument (file or instrument family)
   * @private
   */
  async selectSpecificInstrument(instrument, pattern, stylePrefs) {
    console.log(`🎯 Using specific instrument: ${instrument}`);
    
    // Map deprecated/unavailable instruments to working alternatives
    if (instrument === 'piano') {
      console.log(`🔄 Piano samples unavailable, defaulting to keyboard`);
      instrument = 'keyboard';
    }
    
    // Check if it's a file path
    if (instrument.includes('.wav') || instrument.includes('/')) {
      return await this.loadSpecificFile(instrument, pattern);
    }
    
    // Check if it's an NSynth instrument family
    const availableInstruments = Object.keys(this.nsynthDownloader.instrumentFolders);
    if (availableInstruments.includes(instrument)) {
      const noteTypes = this.analyzePatternNotes(pattern);
      const samples = {};
      
      for (const noteType of Object.keys(noteTypes)) {
        let sample;
        
        // Handle melodic notes differently than drum notes
        if (noteTypes[noteType].isMelodicNote) {
          sample = await this.loadMelodicSample(parseInt(noteType), instrument, stylePrefs);
        } else {
          sample = await this.loadSampleForNote(noteType, instrument, stylePrefs);
        }
        
        if (sample) {
          samples[noteType] = sample;
        }
      }
      
      return {
        type: instrument,
        mode: 'specific',
        samples: Object.values(samples).filter(Boolean),
        noteMapping: samples,
        stylePrefs
      };
    }
    
    throw new Error(`Unknown instrument: ${instrument}`);
  }

  /**
   * Load Freesound sample for a specific note type
   * @private
   */
  async loadFreesoundSampleForNote(noteType, instrumentFamily) {
    // Check if Freesound has this instrument
    if (!this.freesoundLoader.isInstrumentAvailable(instrumentFamily)) {
      // Try drums as fallback for percussive sounds
      if (instrumentFamily !== 'drums' && this.freesoundLoader.isInstrumentAvailable('drums')) {
        instrumentFamily = 'drums';
      } else {
        console.warn(`⚠️  Freesound samples not available for ${instrumentFamily}`);
        return null;
      }
    }
    
    const sample = this.freesoundLoader.getSampleForNote(instrumentFamily, noteType);
    if (!sample) {
      console.warn(`⚠️  No Freesound sample found for ${noteType}`);
      return null;
    }
    
    // Load the audio data
    const sampleData = await this.freesoundLoader.loadSampleFile(sample.path);
    
    return {
      noteType: noteType,
      instrumentFamily: sample.instrumentFamily,
      pitch: 60, // Default MIDI pitch for Freesound samples
      velocity: 100, // Default velocity
      freesoundSample: sample.name,
      sampleFile: path.basename(sample.path),
      path: sample.path,
      audioData: sampleData,
      source: 'Freesound'
    };
  }

  /**
   * Log available instruments from both NSynth and Freesound
   * @private
   */
  logAvailableInstruments() {
    console.log('🎵 Available instruments:');
    
    // NSynth instruments - check which ones have actual samples
    const nsynthInstruments = Object.keys(this.nsynthDownloader.instrumentFolders)
      .filter(instrument => {
        const notes = this.nsynthDownloader.getInstrumentNotes(instrument);
        return notes && notes.length > 0;
      });
    console.log(`   NSynth: ${nsynthInstruments.join(', ')} (${nsynthInstruments.length} total)`);
    
    // Freesound instruments
    const freesoundMeta = this.freesoundLoader.getMetadata();
    const freesoundAvailable = Object.entries(freesoundMeta.instruments)
      .filter(([_, info]) => info.count > 0)
      .map(([name, info]) => `${name}(${info.count})`);
    
    console.log(`   Freesound: ${freesoundAvailable.join(', ')}`);
    
    if (freesoundAvailable.length === 0) {
      console.log('   📝 To download Freesound samples, run: FREESOUND_API_KEY="your_key" node freesound-downloader.js');
    }
  }

  /**
   * Check if any samples are available for an instrument
   */
  isInstrumentSupported(instrumentFamily) {
    const nsynthSupported = this.nsynthDownloader.getInstrumentNotes(instrumentFamily).length > 0;
    const freesoundSupported = this.freesoundLoader.isInstrumentAvailable(instrumentFamily);
    return nsynthSupported || freesoundSupported;
  }

  /**
   * Analyze pattern to determine which note types are used
   * @private
   */
  analyzePatternNotes(pattern) {
    const noteTypes = {};
    
    pattern.events.forEach(event => {
      // Handle both drum notes (strings) and melodic notes (MIDI numbers)
      let noteKey = event.note;
      
      // For melodic notes (MIDI numbers), group by pitch class or use individual notes
      if (typeof event.note === 'number') {
        noteKey = event.note; // Use exact MIDI note number for melodic instruments
      }
      
      if (!noteTypes[noteKey]) {
        noteTypes[noteKey] = {
          count: 0,
          maxVelocity: 0,
          minVelocity: 1,
          avgVelocity: 0,
          isMelodicNote: event.isMelodicNote || false
        };
      }
      
      const note = noteTypes[noteKey];
      note.count++;
      note.maxVelocity = Math.max(note.maxVelocity, event.velocity);
      note.minVelocity = Math.min(note.minVelocity, event.velocity);
      note.avgVelocity += event.velocity;
    });
    
    // Calculate averages
    Object.values(noteTypes).forEach(note => {
      note.avgVelocity /= note.count;
    });
    
    return noteTypes;
  }

  /**
   * Select the best instrument family for the given notes and style
   * @private
   */
  selectBestInstrumentFamily(noteTypes, stylePrefs) {
    const usedNotes = Object.keys(noteTypes);
    const availableInstruments = Object.keys(this.nsynthDownloader.instrumentFolders);
    
    // Score each available instrument family
    const scores = {};
    
    availableInstruments.forEach(family => {
      let score = 0;
      
      // Check if this family is preferred for the style
      if (stylePrefs.preferredInstruments.includes(family)) {
        score += 3;
      }
      
      // Penalize if this family should be avoided
      if (stylePrefs.avoidInstruments.includes(family)) {
        score -= 2;
      }
      
      // Check how well this family matches the required note types
      usedNotes.forEach(noteType => {
        if (this.drumMapping[noteType]?.instruments.includes(family)) {
          score += 2;
        }
      });
      
      // Check if samples are available
      const availableNotes = this.nsynthDownloader.getInstrumentNotes(family);
      if (availableNotes.length > 0) {
        score += 1;
      } else {
        score -= 10; // Heavy penalty for unavailable instruments
      }
      
      scores[family] = score;
    });
    
    // Select the highest scoring family
    const bestFamily = Object.keys(scores).reduce((best, family) => 
      scores[family] > scores[best] ? family : best
    );
    
    console.log(`📊 Instrument family scores:`, scores);
    return bestFamily;
  }

  /**
   * Load NSynth sample for a specific MIDI note (melodic instruments)
   * @private
   */
  async loadMelodicSample(midiNote, instrumentFamily, stylePrefs) {
    console.log(`🎵 Loading melodic sample: MIDI ${midiNote} for ${instrumentFamily}`);
    
    // Get available notes for this instrument
    const availableNotes = this.nsynthDownloader.getInstrumentNotes(instrumentFamily);
    if (availableNotes.length === 0) {
      console.warn(`⚠️  No samples available for ${instrumentFamily}`);
      return null;
    }
    
    // Find exact pitch match first
    let selectedNote = availableNotes.find(note => note.pitch === midiNote);
    
    if (!selectedNote) {
      // If no exact match, find closest pitch
      selectedNote = availableNotes.reduce((closest, note) => {
        const currentDiff = Math.abs(note.pitch - midiNote);
        const closestDiff = Math.abs(closest.pitch - midiNote);
        return currentDiff < closestDiff ? note : closest;
      });
      
      console.log(`🔄 Using closest match: MIDI ${selectedNote.pitch} for requested ${midiNote}`);
    }
    
    // Prefer higher velocities for melodic instruments (better sound quality)
    const suitableVelocity = availableNotes
      .filter(note => note.pitch === selectedNote.pitch)
      .sort((a, b) => b.velocity - a.velocity)[0]; // Get highest velocity for this pitch
    
    if (suitableVelocity) {
      selectedNote = suitableVelocity;
    }
    
    // Load the audio data
    const sampleData = await this.loadSampleFile(selectedNote.path);
    
    if (!sampleData) {
      console.warn(`⚠️  Failed to load melodic sample for MIDI ${midiNote}`);
      return null;
    }
    
    return {
      noteType: midiNote,
      midiNote: midiNote,
      instrumentFamily: instrumentFamily,
      pitch: selectedNote.pitch,
      velocity: selectedNote.velocity,
      path: selectedNote.path,
      audioData: sampleData,
      isMelodicSample: true
    };
  }

  /**
   * Load sample for a specific note type - tries NSynth first, then Freesound fallback
   * @private
   */
  async loadSampleForNote(noteType, instrumentFamily, stylePrefs) {
    // First try NSynth samples
    const nsynthSample = await this.loadNSynthSampleForNote(noteType, instrumentFamily, stylePrefs);
    if (nsynthSample) {
      return nsynthSample;
    }
    
    // If NSynth fails, try Freesound fallback
    console.log(`🎵 Trying Freesound fallback for ${noteType} in ${instrumentFamily}`);
    return await this.loadFreesoundSampleForNote(noteType, instrumentFamily);
  }
  
  /**
   * Load NSynth sample for a specific note type
   * @private
   */
  async loadNSynthSampleForNote(noteType, instrumentFamily, stylePrefs) {
    const drumSpec = this.drumMapping[noteType];
    if (!drumSpec) {
      console.warn(`⚠️  Unknown note type: ${noteType}`);
      return null;
    }
    
    // Get available notes for this instrument
    const availableNotes = this.nsynthDownloader.getInstrumentNotes(instrumentFamily);
    if (availableNotes.length === 0) {
      console.warn(`⚠️  No NSynth samples available for ${instrumentFamily}`);
      return null;
    }
    
    // Find samples in the appropriate pitch range
    const suitableNotes = availableNotes.filter(note => 
      note.pitch >= drumSpec.pitchRange[0] && note.pitch <= drumSpec.pitchRange[1]
    );
    
    let selectedNote;
    if (suitableNotes.length > 0) {
      // Try to find the preferred pitch first
      selectedNote = suitableNotes.find(note => note.pitch === drumSpec.preferredPitch) ||
                    this.selectBestSample(suitableNotes, drumSpec, stylePrefs);
    } else {
      // Fall back to any available note
      selectedNote = this.selectBestSample(availableNotes, drumSpec, stylePrefs);
    }
    
    if (!selectedNote) {
      console.warn(`⚠️  No suitable NSynth sample found for ${noteType} in ${instrumentFamily}`);
      return null;
    }
    
    // Load the audio data
    const sampleData = await this.loadSampleFile(selectedNote.path);
    
    return {
      noteType: noteType,
      instrumentFamily: instrumentFamily,
      pitch: selectedNote.pitch,
      velocity: selectedNote.velocity,
      nsynthNote: `${selectedNote.pitch}-${selectedNote.velocity}`,
      sampleFile: path.basename(selectedNote.path),
      path: selectedNote.path,
      audioData: sampleData,
      drumSpec: drumSpec,
      source: 'NSynth'
    };
  }

  /**
   * Select the best sample from available options
   * @private
   */
  selectBestSample(availableNotes, drumSpec, stylePrefs) {
    // Sort by how close they are to the preferred pitch
    const sortedNotes = availableNotes.sort((a, b) => 
      Math.abs(a.pitch - drumSpec.preferredPitch) - 
      Math.abs(b.pitch - drumSpec.preferredPitch)
    );
    
    // Apply style-based selection preferences
    const preferredVelocity = this.getPreferredVelocity(drumSpec, stylePrefs);
    
    // Find note with velocity closest to preferred
    const bestNote = sortedNotes.reduce((best, note) => {
      const velocityDiff = Math.abs(note.velocity - preferredVelocity);
      const bestVelocityDiff = Math.abs(best.velocity - preferredVelocity);
      return velocityDiff < bestVelocityDiff ? note : best;
    });
    
    return bestNote;
  }

  /**
   * Get preferred velocity based on style and drum spec
   * @private
   */
  getPreferredVelocity(drumSpec, stylePrefs) {
    const baseVelocity = (drumSpec.velocity[0] + drumSpec.velocity[1]) / 2;
    return Math.round(baseVelocity * stylePrefs.velocityModifier);
  }

  /**
   * Load sample file and return audio data
   * @private
   */
  async loadSampleFile(filePath) {
    try {
      // Check cache first
      if (this.sampleCache.has(filePath)) {
        return this.sampleCache.get(filePath);
      }
      
      // Read the WAV file
      if (!fs.existsSync(filePath)) {
        throw new Error(`Sample file not found: ${filePath}`);
      }
      
      const buffer = fs.readFileSync(filePath);
      const audioData = {
        buffer: buffer,
        path: filePath,
        size: buffer.length
      };
      
      // Cache for future use
      this.sampleCache.set(filePath, audioData);
      
      return audioData;
      
    } catch (error) {
      console.error(`❌ Error loading sample ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Get fallback sample when preferred samples are not available
   * @private
   */
  async getFallbackSample(noteType) {
    console.log(`🔄 Finding fallback sample for ${noteType}...`);
    
    // Try to find any available instrument with samples
    const availableInstruments = Object.keys(this.nsynthDownloader.instrumentFolders);
    
    for (const family of availableInstruments) {
      const notes = this.nsynthDownloader.getInstrumentNotes(family);
      if (notes.length > 0) {
        // Use the first available sample
        const note = notes[0];
        const sampleData = await this.loadSampleFile(note.path);
        
        if (sampleData) {
          return {
            noteType: noteType,
            instrumentFamily: family,
            pitch: note.pitch,
            velocity: note.velocity,
            path: note.path,
            audioData: sampleData,
            fallback: true
          };
        }
      }
    }
    
    console.error(`❌ No fallback samples available for ${noteType}`);
    return null;
  }

  /**
   * Load a specific WAV file
   * @private
   */
  async loadSpecificFile(filePath, pattern) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Specific file not found: ${fullPath}`);
    }
    
    const sampleData = await this.loadSampleFile(fullPath);
    const noteTypes = this.analyzePatternNotes(pattern);
    
    // Map all note types to this single sample
    const samples = {};
    Object.keys(noteTypes).forEach(noteType => {
      samples[noteType] = {
        noteType: noteType,
        instrumentFamily: 'custom',
        path: fullPath,
        audioData: sampleData,
        specific: true
      };
    });
    
    return {
      type: 'custom',
      mode: 'specific',
      samples: [sampleData],
      noteMapping: samples,
      stylePrefs: this.styleInstrumentPreferences.default
    };
  }

  /**
   * Get statistics about available NSynth samples
   * @returns {Object} Sample availability statistics
   */
  getAvailabilityStats() {
    const stats = {
      totalInstruments: 0,
      availableInstruments: 0,
      totalSamples: 0,
      instrumentBreakdown: {}
    };
    
    Object.entries(this.nsynthDownloader.instrumentFolders).forEach(([instrument, folder]) => {
      stats.totalInstruments++;
      const notes = this.nsynthDownloader.getInstrumentNotes(instrument);
      
      if (notes.length > 0) {
        stats.availableInstruments++;
        stats.totalSamples += notes.length;
        
        stats.instrumentBreakdown[instrument] = {
          sampleCount: notes.length,
          pitchRange: notes.length > 0 ? {
            min: Math.min(...notes.map(n => n.pitch)),
            max: Math.max(...notes.map(n => n.pitch))
          } : null
        };
      }
    });
    
    return stats;
  }
}

module.exports = { InstrumentSelector };