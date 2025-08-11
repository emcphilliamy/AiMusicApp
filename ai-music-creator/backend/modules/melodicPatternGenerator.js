/**
 * Melodic Pattern Generator - Creates musical melodic patterns for non-percussive instruments
 * 
 * Based on music theory principles including:
 * - Common chord progressions (I-V-vi-IV, ii-V-I, etc.)
 * - Modal scales (Ionian, Dorian, Mixolydian, etc.)
 * - Genre-specific melodic patterns
 * - Instrument-appropriate ranges and characteristics
 */

class MelodicPatternGenerator {
  constructor() {
    // Music theory constants
    this.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Common chord progressions mapped to Roman numerals
    this.CHORD_PROGRESSIONS = {
      'pop': [
        [0, 5, 3, 4], // I-vi-IV-V (very popular)
        [0, 4, 5, 0], // I-V-vi-I 
        [5, 3, 4, 0], // vi-IV-V-I (relative minor start)
        [0, 4, 3, 5]  // I-V-IV-vi
      ],
      'jazz': [
        [1, 4, 0],    // ii-V-I (quintessential jazz)
        [3, 6, 1, 4, 0], // vi-ii-V-I (extended)
        [0, 6, 1, 4],    // I-vi-ii-V (jazz standard)
        [4, 1, 4, 0]     // V-ii-V-I (turnaround)
      ],
      'funk': [
        [0, 6, 4],    // I-vii-V (dominant funk)
        [0, 3, 4, 0], // I-iv-V-I (modal)
        [3, 4, 0],    // iv-V-I (strong resolution)
        [0, 4, 3, 4]  // I-V-iv-V (major/minor contrast)
      ],
      'house': [
        [0, 4, 3, 4], // I-V-iv-V (driving progression)
        [3, 0, 4, 0], // iv-I-V-I (uplift pattern)
        [0, 3, 4, 5], // I-iv-V-vi
        [5, 4, 0]     // vi-V-I (emotional arc)
      ],
      'lo-fi': [
        [0, 3, 5, 4], // I-iv-vi-V (melancholic)
        [3, 5, 0],    // iv-vi-I (soft resolution)
        [0, 2, 3, 0], // I-iii-iv-I (dreamy)
        [5, 3, 4, 0]  // vi-iv-V-I (nostalgic)
      ],
      'upbeat': [
        [0, 4, 5, 0], // I-V-vi-I (energetic cycle)
        [0, 3, 4, 5], // I-iv-V-vi (major/minor energy)
        [4, 0, 5, 4], // V-I-vi-V (powerful)
        [0, 5, 4, 0]  // I-vi-V-I (classic pop)
      ],
      'default': [
        [0, 4, 5, 3], // I-V-vi-IV (most popular)
        [0, 5, 3, 4], // I-vi-IV-V
        [5, 3, 0, 4], // vi-IV-I-V
        [3, 4, 0]     // IV-V-I (simple, effective)
      ]
    };

    // Modal scales - intervals from root note
    this.MODES = {
      ionian:     [0, 2, 4, 5, 7, 9, 11], // Major scale (happy, positive)
      dorian:     [0, 2, 3, 5, 7, 9, 10], // Minor with raised 6th (Celtic, folky)
      phrygian:   [0, 1, 3, 5, 7, 8, 10], // Minor with flat 2nd (Spanish, dark)
      lydian:     [0, 2, 4, 6, 7, 9, 11], // Major with raised 4th (dreamy, ethereal)
      mixolydian: [0, 2, 4, 5, 7, 9, 10], // Major with flat 7th (rock, blues)
      aeolian:    [0, 2, 3, 5, 7, 8, 10], // Natural minor (sad, introspective)
      locrian:    [0, 1, 3, 5, 6, 8, 10]  // Diminished (rarely used, unstable)
    };

    // Genre-specific mode preferences
    this.GENRE_MODES = {
      'jazz': ['dorian', 'mixolydian', 'lydian', 'ionian'],
      'pop': ['ionian', 'aeolian', 'dorian'],
      'funk': ['mixolydian', 'dorian', 'phrygian'],
      'house': ['ionian', 'mixolydian', 'dorian'],
      'lo-fi': ['aeolian', 'dorian', 'phrygian'],
      'upbeat': ['ionian', 'lydian', 'mixolydian'],
      'default': ['ionian', 'aeolian', 'dorian']
    };

    // Instrument characteristics and optimal ranges (MIDI note numbers)
    this.INSTRUMENT_SPECS = {
      bass: {
        range: [28, 60],      // E1 to C4 (proper bass range)
        sweetSpot: [36, 50],  // C2 to D3 (bass sweet spot)
        voicing: 'melody',    // Bass plays single notes
        articulation: 'plucked',
        preferredVelocities: [80, 120],
        characteristics: ['deep', 'rhythmic', 'foundational']
      },
      guitar: {
        range: [40, 84],      // E2 to C6 (guitar range)
        sweetSpot: [48, 76],  // C3 to E5 (guitar sweet spot)
        voicing: 'melody',    // Single note melodies and arpeggios
        articulation: 'plucked',
        preferredVelocities: [70, 110],
        characteristics: ['percussive', 'expressive', 'versatile']
      },
      keyboard: {
        range: [36, 96],      // C2 to C7 (wide range like piano)
        sweetSpot: [48, 84],  // C3 to C6 (piano sweet spot)
        voicing: 'both',      // Can play melody and chords
        articulation: 'percussive',
        preferredVelocities: [70, 120],
        characteristics: ['versatile', 'clear', 'harmonic']
      },
      organ: {
        range: [36, 84],      // C2 to C6 (3 octaves)
        sweetSpot: [48, 72],  // C3 to C5 (optimal range)
        voicing: 'chord',     // Can play chords
        articulation: 'sustained',
        preferredVelocities: [80, 110],
        characteristics: ['harmonic', 'sustained', 'rich']
      },
      flute: {
        range: [60, 96],      // C4 to C7 (high register)
        sweetSpot: [65, 84],  // F4 to C6 (sweet spot)
        voicing: 'melody',    // Single note melodies
        articulation: 'flowing',
        preferredVelocities: [70, 100],
        characteristics: ['breathy', 'lyrical', 'expressive']
      },
      string: {
        range: [40, 84],      // E2 to C6 
        sweetSpot: [50, 76],  // D3 to E5
        voicing: 'both',      // Melody and harmony
        articulation: 'bowed',
        preferredVelocities: [60, 110],
        characteristics: ['expressive', 'sustained', 'warm']
      },
      brass: {
        range: [42, 78],      // F#2 to F#5
        sweetSpot: [50, 70],  // D3 to Bb4
        voicing: 'both',
        articulation: 'bold',
        preferredVelocities: [85, 120],
        characteristics: ['powerful', 'brassy', 'heroic']
      },
      reed: {
        range: [46, 82],      // Bb2 to Bb5 (clarinet/sax range)
        sweetSpot: [54, 74],  // F#3 to D5
        voicing: 'melody',
        articulation: 'woody',
        preferredVelocities: [75, 105],
        characteristics: ['woody', 'smooth', 'jazzy']
      },
      vocal: {
        range: [48, 76],      // C3 to E5 (common vocal range)
        sweetSpot: [55, 69],  // G3 to A4
        voicing: 'melody',
        articulation: 'sung',
        preferredVelocities: [70, 100],
        characteristics: ['human', 'expressive', 'melodic']
      },
      synth_lead: {
        range: [36, 96],      // C2 to C7 (wide electronic range)
        sweetSpot: [60, 84],  // C4 to C6 (lead range)
        voicing: 'melody',
        articulation: 'electronic',
        preferredVelocities: [90, 120],
        characteristics: ['synthetic', 'cutting', 'modern']
      }
    };

    // Melodic motion patterns
    this.MELODIC_MOTIONS = {
      step: 1,      // Moving by 1-2 semitones
      skip: 3,      // Moving by 3-4 semitones (3rd)
      leap: 5,      // Moving by 5+ semitones (4th+)
      repeat: 0     // Staying on same note
    };

    // Rhythm patterns for different genres (in 16th note subdivisions)
    this.RHYTHM_PATTERNS = {
      'pop': [
        [0, 4, 8, 12],      // Quarter notes
        [0, 2, 4, 6, 8, 10, 12, 14], // 8th notes
        [0, 4, 6, 8, 12],   // Syncopated
        [0, 3, 4, 8, 11, 12] // Pop rhythm
      ],
      'jazz': [
        [0, 3, 6, 9, 12],   // Swing 8ths
        [0, 2, 6, 8, 14],   // Jazz syncopation
        [0, 4, 7, 8, 12],   // Bebop rhythm
        [0, 6, 8, 10, 12]   // Complex jazz
      ],
      'funk': [
        [0, 2, 4, 6, 8, 10], // 16th note funk
        [0, 2, 6, 8, 14],    // Funk syncopation
        [0, 3, 4, 6, 12],    // Off-beat funk
        [0, 2, 4, 10, 12, 14] // Complex funk
      ],
      'house': [
        [0, 4, 8, 12],      // Four-on-floor basis
        [0, 2, 4, 8, 10, 12], // House groove
        [0, 4, 6, 8, 12, 14], // Dance pattern
        [0, 2, 8, 10, 12]   // Electronic rhythm
      ],
      'lo-fi': [
        [0, 6, 8, 14],      // Lazy rhythm
        [0, 4, 10, 12],     // Chill pattern
        [0, 3, 8, 11],      // Relaxed timing
        [0, 6, 12]          // Minimal notes
      ],
      'upbeat': [
        [0, 2, 4, 6, 8, 10, 12, 14], // Fast 8ths
        [0, 1, 4, 5, 8, 9, 12, 13],  // 16th energy
        [0, 2, 4, 8, 10, 12],        // Driving rhythm
        [0, 4, 6, 8, 10, 12, 14]     // Energetic
      ],
      'default': [
        [0, 4, 8, 12],      // Simple quarters
        [0, 4, 6, 8, 12],   // Basic syncopation
        [0, 2, 4, 8, 12],   // Mixed rhythm
        [0, 4, 8, 10, 12]   // Standard pattern
      ]
    };
  }

  /**
   * Generate a melodic pattern for a specific instrument and genre
   * @param {Object} config - Generation configuration
   * @param {string} config.instrument - Instrument type
   * @param {string} config.genre - Musical genre/style
   * @param {number} config.bpm - Beats per minute
   * @param {number} config.bars - Number of bars
   * @param {string} config.key - Musical key (default: 'C')
   * @param {number} config.seed - Random seed for reproducibility
   * @returns {Object} Generated melodic pattern
   */
  generateMelodicPattern({ instrument, genre, bpm, bars, key = 'C', seed }) {
    this.setSeed(seed);
    
    const instrumentSpec = this.INSTRUMENT_SPECS[instrument];
    if (!instrumentSpec) {
      throw new Error(`Unknown instrument: ${instrument}`);
    }

    // Select appropriate chord progression and mode
    const progression = this.selectChordProgression(genre);
    const mode = this.selectMode(genre);
    const scale = this.generateScale(key, mode);
    
    // Generate chord voicings based on progression
    const chords = this.generateChordVoicings(progression, scale, instrumentSpec);
    
    // Create melodic line
    const melody = this.generateMelodyLine(chords, scale, instrumentSpec, genre, bars);
    
    // Apply rhythmic pattern
    const rhythmPattern = this.selectRhythmPattern(genre);
    const timedEvents = this.applyRhythm(melody, rhythmPattern, bpm, bars);
    
    return {
      events: timedEvents,
      metadata: {
        instrument,
        genre,
        key,
        mode,
        progression: progression.map(degree => this.degreeToRoman(degree)),
        scale: scale.map(note => this.noteToString(note)),
        chords: chords.map(chord => chord.map(note => this.noteToString(note))),
        bpm,
        bars,
        totalEvents: timedEvents.length,
        characteristics: instrumentSpec.characteristics
      }
    };
  }

  /**
   * Set random seed for reproducible generation
   */
  setSeed(seed) {
    // Convert string seeds to numbers
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
      }
      this.seed = Math.abs(hash);
    } else {
      this.seed = seed || Date.now();
    }
    this.randomIndex = 0;
  }

  /**
   * Seeded random number generator
   */
  seededRandom() {
    const x = Math.sin(this.seed + this.randomIndex++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Select chord progression based on genre
   */
  selectChordProgression(genre) {
    const progressions = this.CHORD_PROGRESSIONS[genre] || this.CHORD_PROGRESSIONS.default;
    const index = Math.floor(this.seededRandom() * progressions.length);
    return progressions[index];
  }

  /**
   * Select musical mode based on genre
   */
  selectMode(genre) {
    const modes = this.GENRE_MODES[genre] || this.GENRE_MODES.default;
    const index = Math.floor(this.seededRandom() * modes.length);
    return modes[index];
  }

  /**
   * Generate scale notes from key and mode
   */
  generateScale(key, mode) {
    const keyIndex = this.NOTES.indexOf(key);
    if (keyIndex === -1) {
      throw new Error(`Invalid key: ${key}`);
    }
    
    const intervals = this.MODES[mode];
    return intervals.map(interval => (keyIndex + interval) % 12);
  }

  /**
   * Generate chord voicings for the progression
   */
  generateChordVoicings(progression, scale, instrumentSpec) {
    return progression.map(degree => {
      // Build triad from scale degree
      const root = scale[degree % scale.length];
      const third = scale[(degree + 2) % scale.length];
      const fifth = scale[(degree + 4) % scale.length];
      
      // Map to appropriate octave for instrument
      const baseOctave = 4; // Start from middle octave
      const rootNote = root + (baseOctave * 12);
      
      // Ensure notes are in instrument range
      const adjustedRoot = this.constrainToRange(rootNote, instrumentSpec.range);
      const adjustedThird = this.constrainToRange(third + (baseOctave * 12), instrumentSpec.range);
      const adjustedFifth = this.constrainToRange(fifth + (baseOctave * 12), instrumentSpec.range);
      
      if (instrumentSpec.voicing === 'chord') {
        // Return full chord for harmonic instruments
        return [adjustedRoot, adjustedThird, adjustedFifth];
      } else {
        // Return single note (root) for melodic instruments
        return [adjustedRoot];
      }
    });
  }

  /**
   * Generate melody line based on chords and instrument characteristics
   */
  generateMelodyLine(chords, scale, instrumentSpec, genre, bars) {
    const melody = [];
    const notesPerBar = 4; // Assume 4/4 time
    const totalNotes = bars * notesPerBar;
    
    let currentOctave = 4; // Middle octave
    let lastNote = scale[0] + (currentOctave * 12); // Start on tonic
    
    for (let i = 0; i < totalNotes; i++) {
      const chordIndex = i % chords.length;
      const chord = chords[chordIndex];
      
      // Select note from current chord or scale
      let targetNote;
      if (this.seededRandom() > 0.3) {
        // 70% chance to use chord tone
        targetNote = chord[Math.floor(this.seededRandom() * chord.length)];
      } else {
        // 30% chance to use scale tone
        const scaleNote = scale[Math.floor(this.seededRandom() * scale.length)];
        targetNote = scaleNote + (currentOctave * 12);
      }
      
      // Apply melodic motion principles
      targetNote = this.applyMelodicMotion(lastNote, targetNote, instrumentSpec);
      
      // Constrain to instrument range
      targetNote = this.constrainToRange(targetNote, instrumentSpec.range);
      
      melody.push(targetNote);
      lastNote = targetNote;
    }
    
    return melody;
  }

  /**
   * Apply melodic motion principles (prefer steps over leaps)
   */
  applyMelodicMotion(fromNote, toNote, instrumentSpec) {
    const interval = Math.abs(toNote - fromNote);
    
    // If leap is too large (> octave), bring it closer
    if (interval > 12) {
      const direction = toNote > fromNote ? 1 : -1;
      toNote = fromNote + (direction * Math.floor(this.seededRandom() * 7 + 1)); // Max 7 semitones
    }
    
    // Occasionally add ornamental notes for expressive instruments
    if (instrumentSpec.characteristics.includes('expressive') && this.seededRandom() > 0.8) {
      // Add passing tone
      const passingTone = fromNote + (toNote > fromNote ? 1 : -1);
      return passingTone;
    }
    
    return toNote;
  }

  /**
   * Constrain note to instrument range
   */
  constrainToRange(note, range) {
    return Math.max(range[0], Math.min(range[1], note));
  }

  /**
   * Select rhythm pattern for genre
   */
  selectRhythmPattern(genre) {
    const patterns = this.RHYTHM_PATTERNS[genre] || this.RHYTHM_PATTERNS.default;
    const index = Math.floor(this.seededRandom() * patterns.length);
    return patterns[index];
  }

  /**
   * Apply rhythm pattern to melody
   */
  applyRhythm(melody, rhythmPattern, bpm, bars) {
    const events = [];
    const beatsPerBar = 4; // 4/4 time
    const stepsPerBeat = 16; // 16th note resolution
    const totalSteps = bars * beatsPerBar * stepsPerBeat;
    
    let melodyIndex = 0;
    
    for (let bar = 0; bar < bars; bar++) {
      for (let patternStep of rhythmPattern) {
        if (melodyIndex >= melody.length) break;
        
        const stepPosition = bar * (beatsPerBar * stepsPerBeat) + patternStep;
        const timePosition = stepPosition / stepsPerBeat; // Convert to beat position
        
        events.push({
          note: melody[melodyIndex],
          time: timePosition,
          velocity: this.generateVelocity(),
          duration: 0.25 // Quarter note duration
        });
        
        melodyIndex++;
      }
    }
    
    return events;
  }

  /**
   * Generate velocity based on musical expression
   */
  generateVelocity() {
    // Vary velocity for musical expression (0.6 to 1.0 range)
    return 0.6 + (this.seededRandom() * 0.4);
  }

  /**
   * Convert scale degree to Roman numeral
   */
  degreeToRoman(degree) {
    const romans = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    return romans[degree] || `${degree + 1}`;
  }

  /**
   * Convert MIDI note number to note string
   */
  noteToString(midiNote) {
    const noteIndex = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1; // MIDI octave adjustment
    return `${this.NOTES[noteIndex]}${octave}`;
  }

  /**
   * Get suggested instruments for melodic patterns
   */
  static getMelodicInstruments() {
    return ['guitar', 'keyboard', 'organ', 'flute', 'string', 'brass', 'reed', 'vocal', 'synth_lead'];
  }

  /**
   * Check if instrument should use melodic patterns instead of drum patterns
   */
  static isMelodicInstrument(instrument) {
    return this.getMelodicInstruments().includes(instrument);
  }
}

module.exports = { MelodicPatternGenerator };