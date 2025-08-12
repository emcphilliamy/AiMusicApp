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
  generateMelodicPattern({ instrument, genre, bpm, bars, key = 'C', seed, playMode = 'auto' }) {
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
    
    // Determine play mode if auto
    const selectedPlayMode = playMode === 'auto' ? this.selectPlayMode(instrument, genre) : playMode;
    
    // Generate pattern based on play mode
    let timedEvents;
    switch (selectedPlayMode) {
      case 'chord':
        timedEvents = this.generateChordPattern(chords, genre, bpm, bars);
        break;
      case 'strum':
        timedEvents = this.generateStrumPattern(chords, genre, bpm, bars);
        break;
      case 'rhythm':
        timedEvents = this.generateRhythmicPattern(chords, scale, genre, bpm, bars, instrument);
        break;
      case 'mixed':
        timedEvents = this.generateMixedPattern(chords, scale, genre, bpm, bars, instrument);
        break;
      default:
        // Fallback to original melody generation
        const melody = this.generateMelodyLine(chords, scale, instrumentSpec, genre, bars);
        const rhythmPattern = this.selectRhythmPattern(genre);
        timedEvents = this.applyRhythm(melody, rhythmPattern, bpm, bars);
    }
    
    return {
      events: timedEvents,
      metadata: {
        instrument,
        genre,
        key,
        mode,
        playMode: selectedPlayMode,
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
   * Select appropriate play mode for instrument and genre
   */
  selectPlayMode(instrument, genre) {
    // Define play mode preferences by instrument and genre
    const playModeMatrix = {
      'guitar': {
        'funk': 'rhythm',
        'jazz': 'mixed',
        'pop': 'strum',
        'house': 'rhythm',
        'lo-fi': 'strum',
        'default': 'mixed'
      },
      'keyboard': {
        'funk': 'chord',
        'jazz': 'mixed',
        'pop': 'chord',
        'house': 'chord',
        'lo-fi': 'chord',
        'default': 'chord'
      },
      'bass': {
        'funk': 'rhythm',
        'jazz': 'rhythm',
        'pop': 'rhythm',
        'house': 'rhythm',
        'lo-fi': 'rhythm',
        'default': 'rhythm'
      },
      'default': {
        'default': 'mixed'
      }
    };

    const instrumentModes = playModeMatrix[instrument] || playModeMatrix['default'];
    return instrumentModes[genre] || instrumentModes['default'] || 'mixed';
  }

  /**
   * Generate chord pattern - simultaneous notes
   */
  generateChordPattern(chords, genre, bpm, bars) {
    const events = [];
    const rhythmPattern = this.selectRhythmPattern(genre);
    const beatsPerBar = 4;
    const stepsPerBeat = 4; // 16th note resolution

    for (let bar = 0; bar < bars; bar++) {
      const chordIndex = bar % chords.length;
      const chord = chords[chordIndex];

      for (let stepIndex of rhythmPattern) {
        if (stepIndex >= 16) continue; // Stay within one bar
        
        const timePosition = (bar * beatsPerBar) + (stepIndex / stepsPerBeat);
        const velocity = this.generateVelocity();

        // Create simultaneous chord notes
        for (let note of chord) {
          events.push({
            note: note,
            time: timePosition,
            velocity: velocity,
            duration: 0.5 // Chord duration
          });
        }
      }
    }

    return events;
  }

  /**
   * Generate strum pattern - sequential chord notes
   */
  generateStrumPattern(chords, genre, bpm, bars) {
    const events = [];
    const rhythmPattern = this.selectRhythmPattern(genre);
    const beatsPerBar = 4;
    const stepsPerBeat = 4;
    const strumDelay = 0.02; // 20ms between strum notes

    for (let bar = 0; bar < bars; bar++) {
      const chordIndex = bar % chords.length;
      const chord = chords[chordIndex];

      for (let stepIndex of rhythmPattern) {
        if (stepIndex >= 16) continue;
        
        const baseTime = (bar * beatsPerBar) + (stepIndex / stepsPerBeat);
        const velocity = this.generateVelocity();

        // Create sequential strum notes
        chord.forEach((note, noteIndex) => {
          events.push({
            note: note,
            time: baseTime + (noteIndex * strumDelay),
            velocity: velocity * (0.8 + noteIndex * 0.1), // Slight velocity variation
            duration: 0.3
          });
        });
      }
    }

    return events;
  }

  /**
   * Generate rhythmic pattern - instrument and genre specific patterns
   */
  generateRhythmicPattern(chords, scale, genre, bpm, bars, instrument = 'guitar') {
    const events = [];
    const beatsPerBar = 4;
    
    // Create dynamic arc for multi-bar patterns
    const dynamicStructure = this.createDynamicArc(bars);
    
    // Get instrument-specific pattern generator
    const patternGenerator = this.getInstrumentPatternGenerator(instrument, genre, bpm);
    
    for (let bar = 0; bar < bars; bar++) {
      const chordIndex = bar % chords.length;
      const chord = chords[chordIndex];
      const barInfo = dynamicStructure[bar];
      
      const barEvents = patternGenerator.generateDynamicBar(chord, bar, beatsPerBar, barInfo);
      
      // Offset events by bar position
      barEvents.forEach(event => {
        event.time += bar * beatsPerBar;
        events.push(event);
      });
    }

    return this.addCrossBarsExpression(events, bars, genre, instrument);
  }
  
  /**
   * Create dynamic arc across multiple bars
   */
  createDynamicArc(bars) {
    const structure = [];
    
    if (bars <= 2) {
      // Short: steady to slight build
      structure.push({ type: 'steady', intensity: 0.7, complexity: 0.8, fills: false });
      if (bars > 1) structure.push({ type: 'build', intensity: 0.85, complexity: 0.9, fills: true });
    } else if (bars <= 4) {
      // Medium: intro -> build -> climax -> settle
      structure.push({ type: 'intro', intensity: 0.6, complexity: 0.7, fills: false });
      structure.push({ type: 'build', intensity: 0.8, complexity: 0.9, fills: true });
      if (bars > 2) structure.push({ type: 'climax', intensity: 1.0, complexity: 1.0, fills: true });
      if (bars > 3) structure.push({ type: 'outro', intensity: 0.7, complexity: 0.8, fills: false });
    } else {
      // Long: full dynamic journey
      const peakBar = Math.floor(bars * 0.75); // Peak near end
      
      for (let bar = 0; bar < bars; bar++) {
        if (bar < peakBar - 1) {
          // Build phase
          const buildProgress = bar / (peakBar - 1);
          structure.push({ 
            type: 'build', 
            intensity: 0.6 + (buildProgress * 0.3), 
            complexity: 0.7 + (buildProgress * 0.2),
            fills: bar > 0 && bar % 2 === 1 // Fills on odd bars
          });
        } else if (bar === peakBar) {
          // Climax
          structure.push({ type: 'climax', intensity: 1.0, complexity: 1.0, fills: true });
        } else {
          // Resolution/outro
          const fallProgress = (bar - peakBar) / (bars - peakBar - 1);
          structure.push({ 
            type: 'fall', 
            intensity: 0.95 - (fallProgress * 0.25), 
            complexity: 0.9 - (fallProgress * 0.1),
            fills: false
          });
        }
      }
    }
    
    return structure;
  }
  
  /**
   * Add cross-bar musical expression
   */
  addCrossBarsExpression(events, bars, genre, instrument) {
    if (bars <= 1) return events;
    
    // Add crescendos and decrescendos
    return events.map((event, idx) => {
      const barPosition = Math.floor(event.time / 4);
      const positionInBar = event.time % 4;
      const totalBars = bars;
      
      let velocityMultiplier = 1.0;
      
      // Overall dynamic arc
      if (genre === 'funk') {
        // Funk: builds intensity throughout
        const overallProgress = barPosition / totalBars;
        velocityMultiplier *= (0.8 + overallProgress * 0.4);
      } else if (genre === 'beach') {
        // Beach: gentle ebb and flow
        const wave = Math.sin((barPosition / totalBars) * Math.PI);
        velocityMultiplier *= (0.9 + wave * 0.2);
      }
      
      // Add subtle humanization
      const humanVariation = (Math.random() - 0.5) * 0.05; // ±2.5%
      
      return {
        ...event,
        velocity: Math.max(0.1, Math.min(1.0, event.velocity * velocityMultiplier + humanVariation)),
        // Add slight timing humanization
        time: event.time + (Math.random() - 0.5) * 0.01 // ±5ms
      };
    });
  }

  /**
   * Get instrument and genre specific pattern generator
   */
  getInstrumentPatternGenerator(instrument, genre, bpm) {
    // Genre-specific characteristics
    const genrePatterns = {
      'funk': {
        emphasis: 'syncopation',
        subdivision: 16, // 16th notes
        swing: 0,
        accentPattern: [0, 2, 4, 6, 8, 10, 12, 14], // Tight 16th pattern
        velocityVariation: 0.4
      },
      'beach': {
        emphasis: 'melody',
        subdivision: 8, // 8th notes
        swing: 0.1, // Slight swing
        accentPattern: [0, 2, 4, 6, 8, 10, 12, 14], // Flowing 8th pattern
        velocityVariation: 0.2
      },
      'jazz': {
        emphasis: 'swing',
        subdivision: 8,
        swing: 0.3, // Strong swing
        accentPattern: [0, 3, 6, 9, 12, 15], // Swing 8ths
        velocityVariation: 0.5
      },
      'pop': {
        emphasis: 'steady',
        subdivision: 8,
        swing: 0,
        accentPattern: [0, 4, 8, 12], // Quarter note emphasis
        velocityVariation: 0.2
      }
    };

    // Instrument-specific characteristics
    const instrumentPatterns = {
      'guitar': {
        preferredNotes: 'chord', // Prefers full chords
        playStyle: 'strummed',
        noteDuration: 0.3,
        maxSimultaneous: 6
      },
      'bass': {
        preferredNotes: 'root', // Prefers root notes
        playStyle: 'fingered',
        noteDuration: 0.4,
        maxSimultaneous: 1
      },
      'keyboard': {
        preferredNotes: 'chord', // Can handle complex chords
        playStyle: 'pressed',
        noteDuration: 0.5,
        maxSimultaneous: 10
      }
    };

    const genreSpec = genrePatterns[genre] || genrePatterns['pop'];
    const instrumentSpec = instrumentPatterns[instrument] || instrumentPatterns['guitar'];

    return {
      genreSpec,
      instrumentSpec,
      
      generateBar(chord, barIndex, beatsPerBar) {
        const barInfo = { type: 'steady', intensity: 0.8, complexity: 0.8, fills: false };
        return this.generateDynamicBar(chord, barIndex, beatsPerBar, barInfo);
      },
      
      generateDynamicBar(chord, barIndex, beatsPerBar, barInfo) {
        const events = [];
        const [root, third, fifth] = chord.length >= 3 ? chord : [chord[0], chord[0], chord[0]];
        
        // Create base pattern
        const basePattern = this.createPatternForInstrumentGenre(chord, root, third, fifth, genreSpec, instrumentSpec, beatsPerBar);
        
        // Add fills and complexity based on barInfo
        const enhancedPattern = this.addBarExpression(basePattern, barInfo, chord, instrument, genre);
        
        return enhancedPattern;
      },
      
      addBarExpression(pattern, barInfo, chord, instrument, genre) {
        const [root, third, fifth] = chord.length >= 3 ? chord : [chord[0], chord[0], chord[0]];
        
        // Scale pattern by intensity
        let enhancedPattern = pattern.map(event => ({
          ...event,
          velocity: event.velocity * barInfo.intensity
        }));
        
        // Add fills if requested
        if (barInfo.fills) {
          if (instrument === 'guitar') {
            // Add guitar fills: quick hammer-ons, pull-offs
            enhancedPattern.push({
              note: root + 2, // 2nd fret higher
              time: 0.875,
              velocity: barInfo.intensity * 0.4,
              duration: 0.1,
              technique: 'hammer-on'
            });
            
            enhancedPattern.push({
              note: fifth + 2,
              time: 2.875, 
              velocity: barInfo.intensity * 0.5,
              duration: 0.1,
              technique: 'pull-off'  
            });
          } else if (instrument === 'bass') {
            // Add bass fills: slides, grace notes
            enhancedPattern.push({
              note: root - 1, // Chromatic approach
              time: 0.9,
              velocity: barInfo.intensity * 0.3,
              duration: 0.08,
              technique: 'slide'
            });
            
            enhancedPattern.push({
              note: fifth + 1, // Passing tone
              time: 2.7,
              velocity: barInfo.intensity * 0.4, 
              duration: 0.2,
              technique: 'slide'
            });
          }
        }
        
        // Add complexity layers
        if (barInfo.complexity > 0.8) {
          if (instrument === 'guitar') {
            // Add percussive mutes between chords
            [1.25, 1.75, 3.25].forEach(time => {
              enhancedPattern.push({
                note: root,
                time: time,
                velocity: 0.1,
                duration: 0.05,
                muted: true
              });
            });
          }
        }
        
        return enhancedPattern;
      },
      
      createPatternForInstrumentGenre(chord, root, third, fifth, genreSpec, instrumentSpec, beatsPerBar = 4) {
        const events = [];
        
        if (genre === 'funk' && instrument === 'bass') {
          // Funk bass: Sustained bass lines with continuous carrying behavior (arco style)
          const pattern = [
            // Long sustained root - legato bowing technique
            { note: root, time: 0.0, velocity: 0.7, duration: 1.2, technique: 'legato' },
            
            // Smooth transition to fifth - portato connection
            { note: fifth, time: 1.0, velocity: 0.6, duration: 0.8, technique: 'portato' },
            
            // Walking to third with sustained connection
            { note: third, time: 1.75, velocity: 0.5, duration: 0.5, technique: 'legato' },
            
            // Continuous bass note into beat 3 - tenuto sustain
            { note: root, time: 2.0, velocity: 0.8, duration: 1.5, technique: 'tenuto' },
            
            // Smooth chromatic approach - glissando effect
            { note: root - 1, time: 3.2, velocity: 0.4, duration: 0.3, technique: 'glissando' },
            
            // Resolution back to root - flowing connection
            { note: root, time: 3.5, velocity: 0.7, duration: 0.5, technique: 'legato' }
          ];
          
          // Add continuous expression markings for sustained bass behavior
          return pattern.map((event, idx) => ({
            ...event,
            // Longer durations for sustained bass character
            duration: event.duration * 1.3,
            // Smooth velocity transitions (no sharp attacks)
            velocity: event.velocity * (0.9 + Math.sin(idx * 0.5) * 0.2), // Gentle waves
            // Add bow direction changes for authentic bass playing
            bowDirection: idx % 2 === 0 ? 'down' : 'up',
            // Continuous sound with overlapping notes
            overlap: true
          }));
        }
        
        if (genre === 'funk' && instrument === 'guitar') {
          // Funk guitar: Authentic groove with syncopated chord stabs and chicken scratch
          const pattern = [];
          
          // THE GROOVE - Based on classic funk patterns
          // Beat 1: Strong downbeat chord stab
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 0.0 + (idx * 0.005), // Tight strum
              velocity: 0.95,
              duration: 0.06, // Very staccato
              technique: 'downstroke'
            });
          });
          
          // "e" - 16th note muted scratch (chicken scratch)
          pattern.push({
            note: root,
            time: 0.25,
            velocity: 0.15,
            duration: 0.02,
            muted: true,
            technique: 'scratch'
          });
          
          // "&" - Syncopated upstroke chord
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 0.5 + (idx * 0.003),
              velocity: 0.6,
              duration: 0.05,
              technique: 'upstroke'
            });
          });
          
          // Beat 2: Skip (creates groove space)
          // "a" - Quick muted scratch
          pattern.push({
            note: root,
            time: 1.25,
            velocity: 0.12,
            duration: 0.02,
            muted: true,
            technique: 'scratch'
          });
          
          // Beat 3: Syncopated stab on the "e"
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 2.25 + (idx * 0.005),
              velocity: 0.8,
              duration: 0.06,
              technique: 'downstroke'
            });
          });
          
          // More chicken scratch
          pattern.push({
            note: root,
            time: 2.75,
            velocity: 0.18,
            duration: 0.02,
            muted: true,
            technique: 'scratch'
          });
          
          // Beat 4: "& a" - Double hit for groove
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 3.5 + (idx * 0.003),
              velocity: 0.5,
              duration: 0.04,
              technique: 'upstroke'
            });
          });
          
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 3.75 + (idx * 0.003),
              velocity: 0.7,
              duration: 0.05,
              technique: 'downstroke'
            });
          });
          
          return pattern;
        }
        
        if (genre === 'beach' && instrument === 'guitar') {
          // Beach guitar: Fingerpicked arpeggios with gentle strums (Jack Johnson style)
          const pattern = [];
          
          // Fingerpicked arpeggio - beat 1
          pattern.push({ note: root, time: 0.0, velocity: 0.6, duration: 0.5 });
          pattern.push({ note: third, time: 0.3, velocity: 0.5, duration: 0.4 });
          pattern.push({ note: fifth, time: 0.6, velocity: 0.55, duration: 0.4 });
          pattern.push({ note: root + 12, time: 0.9, velocity: 0.45, duration: 0.3 }); // Octave
          
          // Gentle downstrum - beat 2
          chord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 1.2 + (idx * 0.025), // Natural strum timing
              velocity: 0.4 + (idx * 0.05), // Slight accent on higher strings
              duration: 0.7
            });
          });
          
          // Fingerpicked bass walk - beat 3
          pattern.push({ note: fifth, time: 2.0, velocity: 0.6, duration: 0.4 });
          pattern.push({ note: third, time: 2.4, velocity: 0.5, duration: 0.3 });
          
          // Upstrum variation - beat 4
          const reversedChord = [...chord].reverse();
          reversedChord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 3.0 + (idx * 0.02), // Faster upstrum
              velocity: 0.35 + (idx * 0.03),
              duration: 0.5
            });
          });
          
          // Pickup notes
          pattern.push({ note: root, time: 3.7, velocity: 0.4, duration: 0.2 });
          pattern.push({ note: fifth, time: 3.85, velocity: 0.35, duration: 0.15 });
          
          // Add subtle swing feel
          return pattern.map(event => ({
            ...event,
            time: event.time + (Math.sin(event.time * 2) * 0.02) // Gentle swing
          }));
        }
        
        if (genre === 'beach' && instrument === 'bass') {
          // Beach bass: Gentle sustained lines like cello, continuous and flowing
          const pattern = [
            // Long sustained root with gentle bow changes - peaceful foundation
            { note: root, time: 0.0, velocity: 0.5, duration: 2.0, technique: 'legato' },
            
            // Smooth glide to fifth - like ocean waves
            { note: fifth, time: 1.8, velocity: 0.45, duration: 1.5, technique: 'portato' },
            
            // Gentle return with sustained connection
            { note: third, time: 3.0, velocity: 0.4, duration: 1.0, technique: 'tenuto' }
          ];
          
          // Add gentle wave-like expression for beach feel
          return pattern.map((event, idx) => ({
            ...event,
            // Very long durations for sustained bass character
            duration: event.duration * 1.5,
            // Gentle wave-like velocity changes
            velocity: event.velocity * (0.8 + Math.sin(event.time * 0.5) * 0.3),
            // Smooth transitions between notes
            overlap: true,
            bowDirection: 'smooth',
            // Add gentle timing sway like gentle waves
            time: event.time + Math.sin(event.time) * 0.05
          }));
        }
        
        // ADD ALL OTHER GENRES
        if (genre === 'jazz' && instrument === 'bass') {
          // Jazz bass: Walking lines with sophisticated harmony
          const pattern = [
            { note: root, time: 0.0, velocity: 0.7, duration: 1.0, technique: 'arco' },
            { note: third, time: 0.8, velocity: 0.6, duration: 0.8, technique: 'legato' },
            { note: fifth, time: 1.5, velocity: 0.65, duration: 0.9, technique: 'portato' },
            { note: root + 7, time: 2.2, velocity: 0.6, duration: 1.2, technique: 'tenuto' }, // 7th
            { note: fifth, time: 3.0, velocity: 0.55, duration: 1.0, technique: 'legato' }
          ];
          
          return pattern.map(event => ({
            ...event,
            duration: event.duration * 1.2,
            velocity: event.velocity * (0.9 + Math.random() * 0.2),
            overlap: true
          }));
        }
        
        if (genre === 'jazz' && instrument === 'guitar') {
          // Jazz guitar: Complex chord voicings with sophisticated fingerpicking
          const pattern = [];
          
          // Jazz chord voicing - 7th, 9th, 11th
          const jazzChord = [root, third, fifth, root + 7, root + 9]; // Add jazz extensions
          
          // Sophisticated fingerpicking pattern
          jazzChord.forEach((note, idx) => {
            pattern.push({
              note: note,
              time: idx * 0.15, // Arpeggiated
              velocity: 0.6 + (idx * 0.05),
              duration: 0.8,
              technique: 'fingerpicked'
            });
          });
          
          // Syncopated chord stabs
          jazzChord.slice(0, 4).forEach((note, idx) => {
            pattern.push({
              note: note,
              time: 1.5 + (idx * 0.01),
              velocity: 0.7,
              duration: 0.6,
              technique: 'chord-stab'
            });
          });
          
          return pattern;
        }
        
        if (genre === 'blues' && instrument === 'guitar') {
          // Blues guitar: Bending, sliding, expressive techniques
          const pattern = [];
          
          // Blues bend on third
          pattern.push({
            note: third - 1, // Flat third
            time: 0.0,
            velocity: 0.8,
            duration: 0.5,
            technique: 'bend'
          });
          
          // Slide to fifth
          pattern.push({
            note: fifth,
            time: 0.8,
            velocity: 0.7,
            duration: 0.6,
            technique: 'slide'
          });
          
          // Root with vibrato
          pattern.push({
            note: root,
            time: 2.0,
            velocity: 0.75,
            duration: 1.5,
            technique: 'vibrato'
          });
          
          return pattern;
        }
        
        if (genre === 'house' && instrument === 'bass') {
          // House bass: Punchy, electronic-style sustained notes
          const pattern = [
            { note: root, time: 0.0, velocity: 0.9, duration: 0.8, technique: 'sustained' },
            { note: root, time: 1.0, velocity: 0.8, duration: 0.8, technique: 'sustained' },
            { note: fifth, time: 2.0, velocity: 0.85, duration: 0.8, technique: 'sustained' },
            { note: root, time: 3.0, velocity: 0.9, duration: 0.8, technique: 'sustained' }
          ];
          
          return pattern.map(event => ({
            ...event,
            duration: event.duration * 1.1, // Sustained character
            overlap: false // Clean separation for house
          }));
        }
        
        // Default pattern for other combinations
        const stepsPerBeat = genreSpec.subdivision / 4;
        const totalSteps = beatsPerBar * stepsPerBeat;
        
        for (let step = 0; step < totalSteps; step++) {
          if (genreSpec.accentPattern.includes(step)) {
            const timePosition = step / stepsPerBeat;
            const velocity = 0.6 + (Math.random() * genreSpec.velocityVariation);
            
            if (instrumentSpec.preferredNotes === 'chord') {
              // Play chord
              chord.forEach((note, idx) => {
                events.push({
                  note: note,
                  time: timePosition + (idx * 0.02),
                  velocity: velocity,
                  duration: instrumentSpec.noteDuration
                });
              });
            } else {
              // Play single note (usually root)
              events.push({
                note: root,
                time: timePosition,
                velocity: velocity,
                duration: instrumentSpec.noteDuration
              });
            }
          }
        }
        
        return events;
      }
    };
  }

  /**
   * Generate mixed pattern - combination of different techniques
   */
  generateMixedPattern(chords, scale, genre, bpm, bars, instrument = 'guitar') {
    const events = [];
    
    // Mix different patterns across bars
    for (let bar = 0; bar < bars; bar++) {
      const patternChoice = bar % 3; // Cycle through pattern types
      
      switch (patternChoice) {
        case 0:
          // Chord pattern for this bar
          const chordEvents = this.generateChordPattern([chords[bar % chords.length]], genre, bpm, 1);
          chordEvents.forEach(event => {
            event.time += bar * 4; // Offset by bar
            events.push(event);
          });
          break;
        case 1:
          // Strum pattern for this bar  
          const strumEvents = this.generateStrumPattern([chords[bar % chords.length]], genre, bpm, 1);
          strumEvents.forEach(event => {
            event.time += bar * 4;
            events.push(event);
          });
          break;
        case 2:
          // Rhythmic pattern for this bar
          const rhythmEvents = this.generateRhythmicPattern([chords[bar % chords.length]], scale, genre, bpm, 1, instrument);
          rhythmEvents.forEach(event => {
            event.time += bar * 4;
            events.push(event);
          });
          break;
      }
    }
    
    return events;
  }

  /**
   * Get suggested instruments for melodic patterns
   */
  static getMelodicInstruments() {
    return ['guitar', 'keyboard', 'organ', 'flute', 'string', 'brass', 'reed', 'vocal', 'synth_lead', 'bass'];
  }

  /**
   * Check if instrument should use melodic patterns instead of drum patterns
   */
  static isMelodicInstrument(instrument) {
    return this.getMelodicInstruments().includes(instrument);
  }
}

module.exports = { MelodicPatternGenerator };