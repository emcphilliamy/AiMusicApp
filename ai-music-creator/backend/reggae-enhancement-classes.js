// Reggae Music Generation Enhancement Classes
// Implementation of the comprehensive reggae improvement plan

// Phase 1: Reggae Pattern Library Development
class ReggaePatternLibrary {
    constructor() {
        this.drumPatterns = {
            oneDrop: {
                kick: [0, 0, 1, 0],      // Beat 3 emphasis
                snare: [0, 0, 1, 0],     // Rim shot on 3
                hiHat: [1, 1, 1, 1],     // Steady eighths with accents on 2,4
                tempo: [60, 90],         // BPM range
                style: 'classic_roots',
                characteristics: ['beat_3_emphasis', 'rim_shot_snare', 'laid_back_feel']
            },
            rockers: {
                kick: [1, 0, 1, 0, 1, 0, 1, 0],  // Eighth note kicks
                snare: [0, 0, 1, 0, 0, 0, 1, 0], // Backbeat on 2,4
                hiHat: [1, 1, 1, 1, 1, 1, 1, 1], // Continuous eighth shuffle
                tempo: [70, 110],
                style: 'driving_energy',
                characteristics: ['driving_eighth_notes', 'consistent_kick', 'energy_focus']
            },
            steppers: {
                kick: [1, 1, 1, 1],      // Four-on-floor foundation
                snare: [0, 0, 1, 0],     // Snare on 3
                hiHat: [1, 0, 1, 0, 1, 0, 1, 0], // Syncopated pattern
                tempo: [80, 120],
                style: 'militant_march',
                characteristics: ['four_on_floor', 'militant_feel', 'forward_momentum']
            }
        };
        
        this.bassPatterns = {
            rootNoteEmphasized: {
                pattern: [1, 0, 0.5, 0, 0.8, 0, 0, 0.3], // Velocity pattern
                rhythmicFeel: 'laid_back',
                frequency: 'low_mid_emphasis',
                style: 'foundational_bass',
                notes: ['root', 'rest', 'fifth', 'rest', 'root', 'rest', 'rest', 'third']
            },
            walkingBass: {
                pattern: [1, 0.6, 0.8, 0.4, 1, 0.7, 0.5, 0.6],
                rhythmicFeel: 'driving',
                frequency: 'fundamental_focus',
                style: 'melodic_movement',
                notes: ['root', 'second', 'third', 'fourth', 'fifth', 'fourth', 'third', 'second']
            },
            bubbleBass: {
                pattern: [1, 0, 0.7, 0, 0.5, 0, 0.8, 0],
                rhythmicFeel: 'syncopated',
                frequency: 'punchy_mid',
                style: 'percussive_pop',
                notes: ['root', 'rest', 'root', 'rest', 'fifth', 'rest', 'root', 'rest']
            }
        };
        
        this.skankPatterns = {
            upstroke: {
                pattern: [0, 1, 0, 1],   // Emphasis on beats 2 and 4
                chordVoicing: 'high_mid_range',
                attack: 'sharp_percussive',
                style: 'classic_skank',
                chords: ['muted', 'chord', 'muted', 'chord']
            },
            doubleSkank: {
                pattern: [0, 1, 0, 1, 0, 1, 0, 1], // Eighth note upstrokes
                chordVoicing: 'trebly_bright',
                attack: 'staccato',
                style: 'driving_rhythm',
                chords: ['muted', 'chord', 'muted', 'chord', 'muted', 'chord', 'muted', 'chord']
            },
            chuckSkank: {
                pattern: [0, 0.3, 0, 1, 0, 0.3, 0, 1],
                chordVoicing: 'percussive_mid',
                attack: 'muted_stab',
                style: 'syncopated_groove',
                chords: ['muted', 'chuck', 'muted', 'chord', 'muted', 'chuck', 'muted', 'chord']
            }
        };

        this.organPatterns = {
            bubble: {
                pattern: [1, 0, 0.8, 0, 0.6, 0, 0.9, 0],
                voicing: 'high_register_stabs',
                attack: 'percussive_organ',
                style: 'classic_bubble',
                technique: 'drawbar_emphasis'
            },
            comping: {
                pattern: [0.5, 0.3, 0.8, 0.2, 0.6, 0.4, 0.9, 0.1],
                voicing: 'jazz_chord_inversions',
                attack: 'smooth_legato',
                style: 'harmonic_support',
                technique: 'chord_substitution'
            }
        };

        console.log('🎵 ReggaePatternLibrary initialized with authentic Jamaican patterns');
    }

    getPatternByStyle(instrument, style, tempo) {
        const instrumentPatterns = this[`${instrument}Patterns`];
        if (!instrumentPatterns) return null;

        // Find patterns that match the style and tempo
        const matchingPatterns = Object.entries(instrumentPatterns).filter(([key, pattern]) => {
            if (pattern.tempo) {
                return tempo >= pattern.tempo[0] && tempo <= pattern.tempo[1];
            }
            return true;
        });

        if (matchingPatterns.length === 0) {
            // Return first available pattern if no tempo match
            return Object.values(instrumentPatterns)[0];
        }

        // Return best matching pattern
        return matchingPatterns[0][1];
    }

    getAllPatternsForInstrument(instrument) {
        return this[`${instrument}Patterns`] || {};
    }

    validateReggaeCharacteristics(pattern, instrument) {
        const validation = {
            authentic: true,
            score: 0,
            issues: []
        };

        // Instrument-specific validation
        switch(instrument) {
            case 'drums':
                validation.score += this.validateDrumPattern(pattern);
                break;
            case 'bass':
                validation.score += this.validateBassPattern(pattern);
                break;
            case 'guitar':
                validation.score += this.validateSkankPattern(pattern);
                break;
        }

        validation.authentic = validation.score > 0.7;
        return validation;
    }

    validateDrumPattern(pattern) {
        let score = 0;
        
        // Check for beat 3 emphasis (one drop characteristic)
        if (pattern.kick && pattern.kick[2] > pattern.kick[0]) {
            score += 0.4;
        }
        
        // Check for proper snare placement
        if (pattern.snare && pattern.snare[2] > 0) {
            score += 0.3;
        }
        
        // Check for consistent hi-hat pattern
        if (pattern.hiHat && pattern.hiHat.length >= 4) {
            score += 0.3;
        }

        return score;
    }

    validateBassPattern(pattern) {
        let score = 0;
        
        // Check for root note emphasis
        if (pattern.pattern && pattern.pattern[0] === 1) {
            score += 0.4;
        }
        
        // Check for laid back feel
        if (pattern.rhythmicFeel === 'laid_back') {
            score += 0.3;
        }
        
        // Check for low frequency emphasis
        if (pattern.frequency && pattern.frequency.includes('low')) {
            score += 0.3;
        }

        return score;
    }

    validateSkankPattern(pattern) {
        let score = 0;
        
        // Check for upbeat emphasis (beats 2 and 4)
        if (pattern.pattern && pattern.pattern[1] > pattern.pattern[0]) {
            score += 0.5;
        }
        
        // Check for percussive attack
        if (pattern.attack && pattern.attack.includes('percussive')) {
            score += 0.3;
        }
        
        // Check for proper chord voicing
        if (pattern.chordVoicing && pattern.chordVoicing.includes('high')) {
            score += 0.2;
        }

        return score;
    }
}

// Phase 2: Reggae-Specialized Instrument AI
class ReggaeInstrumentSpecialistAI {
    constructor(instrument) {
        this.instrument = instrument;
        this.reggaePatternLibrary = new ReggaePatternLibrary();
        this.genreConstraints = this.loadReggaeConstraints();
        this.culturalKnowledge = this.loadCulturalKnowledge();
        
        console.log(`🎺 Initialized Reggae ${instrument} specialist AI`);
    }

    loadReggaeConstraints() {
        return {
            tempoRange: [60, 120],
            preferredKeys: ['A', 'D', 'E', 'G', 'C'],
            rhythmicFeel: 'laid_back',
            dynamicRange: 'moderate_compression',
            culturalElements: ['jamaican_timing', 'syncopated_emphasis', 'organic_feel']
        };
    }

    loadCulturalKnowledge() {
        return {
            jamaicanRhythms: {
                oneDrop: { origin: 'carlton_barrett', era: '1970s_roots' },
                rockers: { origin: 'sly_dunbar', era: '1980s_modern' },
                steppers: { origin: 'burning_spear_sessions', era: 'spiritual_militant' }
            },
            traditionalInstruments: {
                drums: ['acoustic_kit', 'rim_shots', 'floor_tom_emphasis'],
                bass: ['electric_fender', 'fingerstyle', 'warm_tone'],
                guitar: ['clean_electric', 'spring_reverb', 'upstroke_technique'],
                keys: ['hammond_organ', 'fender_rhodes', 'clavinet']
            }
        };
    }

    async generateReggaePattern(context) {
        const { tempo, key, energy, style } = context;
        
        console.log(`🎵 DEBUG: ReggaeInstrumentSpecialistAI.generateReggaePattern called for ${this.instrument}`);
        
        // Apply reggae-specific constraints
        const constrainedTempo = this.constrainReggaeTempo(tempo);
        const reggaeStyle = this.determineReggaeSubstyle(style, energy);
        
        console.log(`🎵 Generating ${reggaeStyle} ${this.instrument} pattern at ${constrainedTempo} BPM`);

        switch (this.instrument) {
            case 'drums':
                return this.generateReggaeDrums(reggaeStyle, constrainedTempo, context);
            case 'bass':
                return this.generateReggaeBass(key, reggaeStyle, constrainedTempo, context);
            case 'guitar':
                return this.generateReggaeSkank(key, reggaeStyle, context);
            case 'keys':
                return this.generateReggaeKeys(key, reggaeStyle, context);
            default:
                return this.generateGenericReggaePattern(context);
        }
    }

    constrainReggaeTempo(tempo) {
        const { tempoRange } = this.genreConstraints;
        return Math.max(tempoRange[0], Math.min(tempoRange[1], tempo));
    }

    determineReggaeSubstyle(style, energy) {
        if (energy < 0.4) return 'oneDrop';
        if (energy > 0.7) return 'rockers';
        return 'steppers';
    }

    generateReggaeDrums(style, tempo, context) {
        const basePattern = this.reggaePatternLibrary.getPatternByStyle('drum', style, tempo);
        
        return {
            kick: this.applyHumanization(basePattern.kick, tempo),
            snare: this.applyRimShotTechnique(basePattern.snare),
            hiHat: this.applyShuffleSwing(basePattern.hiHat, tempo),
            velocity: this.generateDynamicVelocity(basePattern),
            timing: this.applyReggaeGroove(basePattern, tempo),
            style: basePattern.style,
            characteristics: basePattern.characteristics,
            culturalAuthenticity: this.calculateCulturalScore(basePattern, 'drums')
        };
    }

    generateReggaeBass(key, style, tempo, context) {
        const rootNote = this.getKeyRoot(key);
        const basePattern = this.reggaePatternLibrary.getPatternByStyle('bass', style, tempo);
        
        return {
            notes: this.generateBassLine(rootNote, key, basePattern),
            rhythm: this.applyLaidBackTiming(basePattern.pattern, tempo),
            tone: {
                frequency: basePattern.frequency,
                attack: 'soft_fingerstyle',
                sustain: 'warm_woody',
                resonance: 'deep_fundamental'
            },
            style: basePattern.style,
            rhythmicFeel: basePattern.rhythmicFeel,
            culturalAuthenticity: this.calculateCulturalScore(basePattern, 'bass')
        };
    }

    generateReggaeSkank(key, style, context) {
        const basePattern = this.reggaePatternLibrary.getPatternByStyle('skank', style);
        const chordProgression = this.generateReggaeChordProgression(key);
        
        return {
            pattern: basePattern.pattern,
            chords: this.applyChordProgression(chordProgression, basePattern.chords),
            voicing: basePattern.chordVoicing,
            attack: basePattern.attack,
            timing: this.applyUpstrokeTiming(basePattern.pattern),
            effects: {
                reverb: 'spring_reverb',
                tone: 'clean_bright',
                position: 'slight_right'
            },
            style: basePattern.style,
            culturalAuthenticity: this.calculateCulturalScore(basePattern, 'guitar')
        };
    }

    generateReggaeKeys(key, style, context) {
        const organPattern = this.reggaePatternLibrary.getPatternByStyle('organ', style);
        const chordProgression = this.generateReggaeChordProgression(key);
        
        return {
            pattern: organPattern.pattern,
            chords: this.applyJazzVoicings(chordProgression, key),
            voicing: organPattern.voicing,
            attack: organPattern.attack,
            technique: organPattern.technique,
            drawbars: this.generateHammondDrawbarSettings(),
            effects: {
                leslie: 'slow_rotation',
                reverb: 'natural_room',
                position: 'center_left'
            },
            style: organPattern.style,
            culturalAuthenticity: this.calculateCulturalScore(organPattern, 'keys')
        };
    }

    // Enhanced timing and humanization methods
    applyHumanization(pattern, tempo) {
        return pattern.map(note => {
            if (note > 0) {
                // Add slight timing variations for human feel
                const timing = 1 + (Math.random() - 0.5) * 0.02; // ±1% timing variation
                const velocity = note * (0.9 + Math.random() * 0.2); // ±10% velocity variation
                return { 
                    hit: velocity,
                    timing: timing,
                    humanization: 'organic_feel'
                };
            }
            return { hit: 0, timing: 1, humanization: 'rest' };
        });
    }

    applyRimShotTechnique(snarePattern) {
        return snarePattern.map(hit => {
            if (hit > 0) {
                return {
                    technique: 'rim_shot',
                    velocity: hit * 0.8, // Rim shots are typically quieter
                    tone: 'crisp_crack',
                    frequency: [200, 400, 2000] // Characteristic rim shot frequencies
                };
            }
            return { technique: 'rest', velocity: 0 };
        });
    }

    applyShuffleSwing(hiHatPattern, tempo) {
        const swingFactor = tempo < 80 ? 0.15 : 0.08; // More shuffle at slower tempos
        
        return hiHatPattern.map((hit, index) => {
            if (hit > 0) {
                const isOffbeat = index % 2 === 1;
                const timing = isOffbeat ? 1 + swingFactor : 1;
                return {
                    hit: hit * (isOffbeat ? 0.7 : 1), // Offbeats slightly quieter
                    timing: timing,
                    tone: isOffbeat ? 'closed' : 'semi_open'
                };
            }
            return { hit: 0, timing: 1, tone: 'closed' };
        });
    }

    applyLaidBackTiming(pattern, tempo) {
        const laidBackAmount = 0.03; // 3% laid back feel
        
        return pattern.map((velocity, index) => {
            if (velocity > 0) {
                return {
                    velocity: velocity,
                    timing: 1 + laidBackAmount, // Slightly behind the beat
                    feel: 'laid_back_groove'
                };
            }
            return { velocity: 0, timing: 1, feel: 'rest' };
        });
    }

    generateBassLine(rootNote, key, pattern) {
        const scale = this.getReggaeScale(key);
        const bassLine = [];
        
        pattern.notes.forEach((note, index) => {
            if (note !== 'rest') {
                const scaleNote = this.mapNoteToScale(note, scale, rootNote);
                bassLine.push({
                    note: scaleNote,
                    octave: this.getBassOctave(note),
                    duration: this.getNoteDuration(pattern.pattern[index]),
                    velocity: pattern.pattern[index]
                });
            } else {
                bassLine.push({ note: 'rest', duration: 0.25 });
            }
        });
        
        return bassLine;
    }

    generateReggaeChordProgression(key) {
        const reggaeProgressions = [
            ['I', 'V', 'vi', 'IV'],     // Popular progression
            ['vi', 'IV', 'I', 'V'],     // Circle progression
            ['I', 'VII', 'IV', 'I'],    // Mixolydian feel
            ['ii', 'V', 'I', 'vi']      // Jazz influence
        ];
        
        const progression = reggaeProgressions[Math.floor(Math.random() * reggaeProgressions.length)];
        return this.transposeProgression(progression, key);
    }

    calculateCulturalScore(pattern, instrument) {
        let score = 0;
        const culturalMarkers = this.culturalKnowledge.traditionalInstruments[instrument] || [];
        
        // Check for traditional techniques
        if (pattern.characteristics) {
            const matchingMarkers = pattern.characteristics.filter(char => 
                culturalMarkers.some(marker => char.includes(marker.split('_')[0]))
            );
            score += matchingMarkers.length * 0.2;
        }
        
        // Check for authentic style markers
        if (pattern.style && this.culturalKnowledge.jamaicanRhythms[pattern.style]) {
            score += 0.4;
        }
        
        return Math.min(1.0, score);
    }

    // Helper methods
    getKeyRoot(key) {
        return key.charAt(0);
    }

    getReggaeScale(key) {
        // Return major scale with emphasis on roots reggae intervals
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const majorPattern = [0, 2, 4, 5, 7, 9, 11];
        const rootIndex = chromaticScale.indexOf(key);
        
        return majorPattern.map(interval => 
            chromaticScale[(rootIndex + interval) % 12]
        );
    }

    mapNoteToScale(noteFunction, scale, rootNote) {
        const functionMap = {
            'root': scale[0],
            'second': scale[1],
            'third': scale[2],
            'fourth': scale[3],
            'fifth': scale[4],
            'sixth': scale[5],
            'seventh': scale[6]
        };
        
        return functionMap[noteFunction] || scale[0];
    }

    getBassOctave(noteFunction) {
        // Reggae bass typically plays in lower octaves
        const octaveMap = {
            'root': 2,
            'fifth': 2,
            'third': 3,
            'seventh': 2
        };
        
        return octaveMap[noteFunction] || 2;
    }

    getNoteDuration(velocity) {
        // Map velocity to note duration
        if (velocity >= 0.8) return 0.5;  // Half note
        if (velocity >= 0.5) return 0.25; // Quarter note
        return 0.125; // Eighth note
    }

    transposeProgression(progression, key) {
        // Transpose Roman numeral progression to actual chords
        const romanToScale = {
            'I': 0, 'ii': 1, 'iii': 2, 'IV': 3, 
            'V': 4, 'vi': 5, 'VII': 6, 'vii': 6
        };
        
        const scale = this.getReggaeScale(key);
        
        return progression.map(roman => {
            const scaleIndex = romanToScale[roman] || 0;
            return scale[scaleIndex];
        });
    }

    applyChordProgression(progression, chordPattern) {
        return chordPattern.map((chord, index) => {
            if (chord === 'chord') {
                const progressionIndex = index % progression.length;
                return progression[progressionIndex];
            }
            return chord;
        });
    }

    applyUpstrokeTiming(pattern) {
        return pattern.map((hit, index) => {
            if (hit > 0) {
                // Upstrokes are slightly ahead of the beat
                const timing = index % 2 === 1 ? 0.98 : 1; // Upbeats slightly early
                return {
                    velocity: hit,
                    timing: timing,
                    technique: 'upstroke'
                };
            }
            return { velocity: 0, timing: 1, technique: 'muted' };
        });
    }

    applyJazzVoicings(chordProgression, key) {
        return chordProgression.map(chord => {
            // Apply jazz-influenced voicings common in reggae
            return {
                root: chord,
                voicing: this.getJazzVoicing(chord, key),
                inversion: Math.floor(Math.random() * 3), // Random inversion
                extension: Math.random() > 0.7 ? '7' : '' // 30% chance of 7th
            };
        });
    }

    getJazzVoicing(chord, key) {
        const voicings = [
            'close_position',
            'open_voicing',
            'rootless_voicing',
            'shell_voicing'
        ];
        
        return voicings[Math.floor(Math.random() * voicings.length)];
    }

    generateHammondDrawbarSettings() {
        // Classic reggae Hammond organ drawbar settings
        const reggaeDrawbars = [
            [8, 8, 5, 3, 2, 0, 0, 0, 0], // Bright, percussive
            [8, 6, 8, 0, 0, 0, 0, 0, 0], // Warm, mellow
            [8, 8, 8, 4, 0, 0, 0, 0, 0]  // Full, rich
        ];
        
        return reggaeDrawbars[Math.floor(Math.random() * reggaeDrawbars.length)];
    }

    generateDynamicVelocity(pattern) {
        return {
            base: 0.7,
            variation: 0.2,
            accent: pattern.characteristics?.includes('beat_3_emphasis') ? 0.9 : 0.8,
            ghost: 0.3
        };
    }

    applyReggaeGroove(pattern, tempo) {
        return {
            swing: tempo < 80 ? 0.1 : 0.05,
            laidBack: 0.03,
            humanization: 0.02,
            pocket: 'deep_groove'
        };
    }
}

module.exports = {
    ReggaePatternLibrary,
    ReggaeInstrumentSpecialistAI
};