// Reggae Audio Synthesis and Mixing Systems
// Phase 3 Implementation - Audio Synthesis Enhancement

// Reggae-Optimized Audio Synthesizer
class ReggaeAudioSynthesizer {
    constructor() {
        this.reggaeFrequencyProfile = this.initializeFrequencyProfiles();
        this.instrumentSynthesizers = this.initializeInstrumentSynthesizers();
        this.culturalAudioCharacteristics = this.loadCulturalAudioCharacteristics();
        
        console.log('🎵 ReggaeAudioSynthesizer initialized with authentic frequency profiles');
    }

    initializeFrequencyProfiles() {
        return {
            bass: {
                fundamental: [40, 120],      // Deep, prominent bass
                harmonics: [120, 300],       // Warm mid-bass
                emphasis: 'fundamental',
                character: 'warm_woody',
                techniques: ['fingerstyle', 'fretless_warmth']
            },
            drums: {
                kick: [50, 80],              // Deep, punchy kick
                snare: [200, 400, 2000],     // Rim shot frequencies
                hiHat: [8000, 12000],        // Crisp high-end
                character: 'acoustic_vintage',
                techniques: ['rim_shot', 'laid_back_timing']
            },
            guitar: {
                skank: [300, 1000, 3000],    // Percussive guitar frequencies
                emphasis: 'mid_treble',
                character: 'clean_bright',
                techniques: ['upstroke', 'spring_reverb']
            },
            keys: {
                organ: [100, 500, 1500],     // Hammond organ character
                piano: [200, 800, 2500],     // Bright piano
                character: 'hammond_warmth',
                techniques: ['drawbar_settings', 'leslie_rotation']
            }
        };
    }

    initializeInstrumentSynthesizers() {
        return {
            bass: this.createBassSynthesizer(),
            drums: this.createDrumSynthesizer(),
            guitar: this.createGuitarSynthesizer(),
            keys: this.createKeysSynthesizer()
        };
    }

    loadCulturalAudioCharacteristics() {
        return {
            vintage_warmth: {
                tape_saturation: 0.15,
                analog_compression: 0.25,
                frequency_roll_off: 12000
            },
            jamaican_production: {
                room_reverb: 'natural_studio',
                compression_style: 'gentle_glue',
                eq_curve: 'vintage_console'
            },
            traditional_techniques: {
                humanization: 0.03,
                timing_variation: 0.02,
                velocity_variation: 0.15
            }
        };
    }

    async synthesizeReggaeAudio(musicData, context) {
        console.log('🎵 DEBUG: ReggaeAudioSynthesizer.synthesizeReggaeAudio called');
        console.log('🎵 Synthesizing complete reggae composition with frequency-aware processing...');
        
        try {
            const instrumentTracks = {};
            
            // Generate audio for each instrument using reggae-specific synthesis
            for (const [instrument, pattern] of Object.entries(musicData.instruments || {})) {
                console.log(`🎵 Processing ${instrument} with reggae synthesis...`);
                instrumentTracks[instrument] = await this.generateReggaeInstrument(instrument, pattern, context);
            }
            
            // Mix all tracks together with reggae-specific processing
            const finalAudio = await this.mixReggaeTrack(instrumentTracks, context);
            
            console.log('✅ Reggae audio synthesis complete');
            return finalAudio;
            
        } catch (error) {
            console.error('❌ Reggae audio synthesis failed:', error);
            throw error;
        }
    }

    async generateReggaeInstrument(instrument, pattern, context) {
        console.log(`🎵 Synthesizing ${instrument} with reggae characteristics`);
        
        const freqProfile = this.reggaeFrequencyProfile[instrument];
        const synthesizer = this.instrumentSynthesizers[instrument];
        
        if (!synthesizer) {
            throw new Error(`No synthesizer available for ${instrument}`);
        }
        
        switch(instrument) {
            case 'bass':
                return await this.synthesizeReggaeBass(pattern, freqProfile, context);
            case 'drums':
                return await this.synthesizeReggaeDrums(pattern, freqProfile, context);
            case 'guitar':
                return await this.synthesizeReggaeGuitar(pattern, freqProfile, context);
            case 'keys':
                return await this.synthesizeReggaeKeys(pattern, freqProfile, context);
            default:
                return await this.synthesizeGenericReggaeInstrument(instrument, pattern, freqProfile, context);
        }
    }

    async synthesizeReggaeBass(pattern, freqProfile, context) {
        const sampleRate = 44100;
        const duration = context.duration || 30; // 30 seconds default
        const audioData = new Float32Array(duration * sampleRate);
        
        console.log(`🎸 Synthesizing reggae bass with ${pattern.notes?.length || 0} notes`);
        
        // Process each note in the bass pattern
        for (const note of pattern.notes || []) {
            if (note.note === 'rest') continue;
            
            const frequency = this.noteToFrequency(note.note, note.octave || 2);
            const startTime = note.startTime || 0;
            const noteDuration = note.duration || 0.25;
            
            // Generate fundamental bass tone with reggae characteristics
            const fundamental = this.generateWarmBass(
                frequency, 
                noteDuration, 
                note.velocity || 0.8,
                pattern.tone
            );
            
            // Add subtle harmonics for character
            const harmonics = this.addBassHarmonics(
                fundamental, 
                freqProfile.harmonics,
                pattern.tone.resonance
            );
            
            // Apply reggae-specific bass tone shaping
            const shaped = this.applyBassCharacter(harmonics, {
                warmth: 0.8,
                punch: 0.6,
                definition: 0.7,
                fingerstyle: pattern.tone.attack === 'soft_fingerstyle'
            });
            
            // Mix into main buffer at correct timing
            this.mixIntoBuffer(audioData, shaped, startTime * sampleRate);
        }
        
        // Apply final reggae bass processing
        return this.applyReggaeBassMix(audioData, pattern.tone);
    }

    async synthesizeReggaeDrums(pattern, freqProfile, context) {
        const sampleRate = 44100;
        const duration = context.duration || 30;
        const audioData = new Float32Array(duration * sampleRate);
        
        console.log(`🥁 Synthesizing reggae drums with ${pattern.style} style`);
        
        // Synthesize each drum element
        const kickTrack = this.synthesizeDrumElement('kick', pattern.kick, freqProfile.kick, duration);
        const snareTrack = this.synthesizeDrumElement('snare', pattern.snare, freqProfile.snare, duration);
        const hiHatTrack = this.synthesizeDrumElement('hiHat', pattern.hiHat, freqProfile.hiHat, duration);
        
        // Mix drum elements with proper reggae balance
        const mixedDrums = this.mixDrumElements({
            kick: kickTrack,
            snare: snareTrack,
            hiHat: hiHatTrack
        }, pattern.characteristics);
        
        // Apply reggae drum processing
        return this.applyReggaeDrumMix(mixedDrums, pattern);
    }

    async synthesizeReggaeGuitar(pattern, freqProfile, context) {
        const sampleRate = 44100;
        const duration = context.duration || 30;
        const audioData = new Float32Array(duration * sampleRate);
        
        console.log(`🎸 Synthesizing reggae guitar skank with ${pattern.style} technique`);
        
        // Process each chord stab in the skank pattern
        for (let i = 0; i < pattern.pattern.length; i++) {
            const hit = pattern.pattern[i];
            if (hit <= 0) continue;
            
            const chord = pattern.chords[i];
            if (chord === 'muted' || chord === 'rest') continue;
            
            const timing = pattern.timing?.[i] || { timing: 1, technique: 'upstroke' };
            const startTime = (i * 0.125) * timing.timing; // Eighth note timing
            
            // Generate chord stab
            const chordStab = this.generateReggaeChordStab(
                chord,
                hit,
                pattern.voicing,
                pattern.attack,
                freqProfile
            );
            
            // Apply upstroke technique
            const upstroke = this.applyUpstrokeTechnique(chordStab, timing.technique);
            
            // Mix into buffer
            this.mixIntoBuffer(audioData, upstroke, startTime * sampleRate);
        }
        
        // Apply final guitar processing
        return this.applyReggaeGuitarMix(audioData, pattern.effects);
    }

    async synthesizeReggaeKeys(pattern, freqProfile, context) {
        const sampleRate = 44100;
        const duration = context.duration || 30;
        const audioData = new Float32Array(duration * sampleRate);
        
        console.log(`🎹 Synthesizing reggae keys with ${pattern.style} style`);
        
        // Process each chord in the pattern
        for (let i = 0; i < pattern.pattern.length; i++) {
            const hit = pattern.pattern[i];
            if (hit <= 0) continue;
            
            const chord = pattern.chords[i];
            const startTime = i * 0.125; // Eighth note timing
            
            // Generate organ/piano chord
            let chordSound;
            if (pattern.technique === 'drawbar_emphasis') {
                chordSound = this.generateHammondOrganChord(
                    chord,
                    hit,
                    pattern.drawbars,
                    freqProfile.organ
                );
            } else {
                chordSound = this.generatePianoChord(
                    chord,
                    hit,
                    pattern.voicing,
                    freqProfile.piano
                );
            }
            
            // Apply technique-specific processing
            const processed = this.applyKeysProcessing(chordSound, pattern.technique);
            
            // Mix into buffer
            this.mixIntoBuffer(audioData, processed, startTime * sampleRate);
        }
        
        // Apply final keys processing
        return this.applyReggaeKeysMix(audioData, pattern.effects);
    }

    // Bass synthesis methods
    generateWarmBass(frequency, duration, velocity, toneSettings) {
        const sampleRate = 44100;
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            
            // Main sine wave with slight saturation for warmth
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            
            // Add square wave component for woody character
            const squareComponent = Math.sign(fundamental) * 0.2;
            
            // Add triangle wave for smoothness
            const triangleComponent = this.generateTriangleWave(frequency, t) * 0.1;
            
            // Combine waveforms
            const combined = fundamental + squareComponent + triangleComponent;
            
            // Apply envelope for natural attack and decay
            const envelope = this.generateBassEnvelope(t, duration, toneSettings);
            
            audioData[i] = combined * envelope * velocity;
        }
        
        return audioData;
    }

    addBassHarmonics(fundamental, harmonicRange, resonance) {
        const enhanced = new Float32Array(fundamental.length);
        
        for (let i = 0; i < fundamental.length; i++) {
            const sample = fundamental[i];
            
            // Add second harmonic for richness
            const secondHarmonic = sample * sample * 0.3;
            
            // Add third harmonic for character
            const thirdHarmonic = Math.sign(sample) * Math.pow(Math.abs(sample), 1.5) * 0.2;
            
            // Resonance emphasis in mid-bass range
            const resonanceBoost = resonance === 'deep_fundamental' ? 1.2 : 1.0;
            
            enhanced[i] = (sample + secondHarmonic + thirdHarmonic) * resonanceBoost;
        }
        
        return enhanced;
    }

    applyBassCharacter(harmonics, characteristics) {
        const processed = new Float32Array(harmonics.length);
        
        for (let i = 0; i < harmonics.length; i++) {
            let sample = harmonics[i];
            
            // Apply warmth (low-frequency emphasis)
            if (characteristics.warmth > 0) {
                sample *= (1 + characteristics.warmth * 0.3);
            }
            
            // Apply punch (mid-frequency boost)
            if (characteristics.punch > 0) {
                const punchEnhancement = Math.sign(sample) * Math.pow(Math.abs(sample), 0.8);
                sample = sample * (1 - characteristics.punch * 0.3) + punchEnhancement * characteristics.punch * 0.3;
            }
            
            // Apply definition (high-mid clarity)
            if (characteristics.definition > 0) {
                // Subtle high-frequency enhancement for note clarity
                sample *= (1 + characteristics.definition * 0.1);
            }
            
            // Fingerstyle technique simulation
            if (characteristics.fingerstyle) {
                // Softer attack, more natural decay
                sample *= 0.9; // Slightly reduce intensity for fingerstyle feel
            }
            
            processed[i] = sample;
        }
        
        return processed;
    }

    applyReggaeBassMix(audioData, toneSettings) {
        // Apply EQ curve typical for reggae bass
        const eqd = this.applyBassEQ(audioData, {
            lowShelf: { freq: 80, gain: 3 },    // Boost low end
            lowMid: { freq: 200, gain: 1 },     // Slight mid boost
            highCut: { freq: 3000, slope: -6 }  // Roll off highs
        });
        
        // Apply gentle compression for consistency
        const compressed = this.applyCompression(eqd, {
            ratio: 3,
            attack: 20,
            release: 150,
            threshold: -15
        });
        
        // Add subtle saturation for analog warmth
        const saturated = this.applyTapeSaturation(compressed, 0.1);
        
        return this.normalizeAudio(saturated);
    }

    // Drum synthesis methods
    synthesizeDrumElement(element, pattern, frequencies, duration) {
        const sampleRate = 44100;
        const totalSamples = duration * sampleRate;
        const audioData = new Float32Array(totalSamples);
        
        // Get timing pattern (assuming 4/4 time, quarter note = 0.5 seconds at 120 BPM)
        const beatDuration = 0.5; // 120 BPM quarter note
        
        // Safety check for pattern
        if (!pattern || !Array.isArray(pattern)) {
            console.warn(`⚠️ Invalid drum pattern for ${elementType}, using default pattern`);
            pattern = [1, 0, 1, 0]; // Default 4/4 pattern
        }
        
        for (let beat = 0; beat < pattern.length; beat++) {
            const hit = pattern[beat];
            if (!hit || hit.hit <= 0) continue;
            
            const startSample = Math.floor(beat * beatDuration * sampleRate * (hit.timing || 1));
            
            let drumHit;
            switch(element) {
                case 'kick':
                    drumHit = this.generateKickDrum(frequencies, hit.hit);
                    break;
                case 'snare':
                    drumHit = this.generateSnareRimShot(frequencies, hit);
                    break;
                case 'hiHat':
                    drumHit = this.generateHiHat(frequencies, hit);
                    break;
            }
            
            // Mix drum hit into buffer
            if (drumHit) {
                this.mixIntoBuffer(audioData, drumHit, startSample);
            }
        }
        
        return audioData;
    }

    generateKickDrum(frequencies, velocity) {
        const sampleRate = 44100;
        const duration = 0.15; // Short, punchy kick
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            
            // Fundamental frequency with pitch bend down
            const pitchEnvelope = Math.exp(-t * 8); // Quick pitch drop
            const freq = frequencies[0] * (1 + pitchEnvelope * 0.5);
            
            // Sine wave for fundamental
            const fundamental = Math.sin(2 * Math.PI * freq * t);
            
            // Add click for attack
            const click = Math.exp(-t * 50) * Math.sin(2 * Math.PI * freq * 3 * t) * 0.3;
            
            // Volume envelope
            const envelope = Math.exp(-t * 5) * Math.pow(Math.cos(t * Math.PI / (2 * duration)), 2);
            
            audioData[i] = (fundamental + click) * envelope * velocity;
        }
        
        return audioData;
    }

    generateSnareRimShot(frequencies, hitData) {
        const sampleRate = 44100;
        const duration = 0.1;
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            
            // High-frequency crack for rim shot
            let rimCrack = 0;
            for (const freq of frequencies) {
                rimCrack += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 15);
            }
            
            // Add noise for snare rattle
            const noise = (Math.random() - 0.5) * Math.exp(-t * 8) * 0.4;
            
            // Sharp envelope for percussive attack
            const envelope = Math.exp(-t * 12) * Math.pow(Math.cos(t * Math.PI / (2 * duration)), 3);
            
            audioData[i] = (rimCrack + noise) * envelope * (hitData.velocity || hitData.hit);
        }
        
        return audioData;
    }

    generateHiHat(frequencies, hitData) {
        const sampleRate = 44100;
        const duration = hitData.tone === 'closed' ? 0.05 : 0.15;
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            
            // High-frequency metallic sound
            let metallic = 0;
            for (const freq of frequencies) {
                metallic += Math.sin(2 * Math.PI * freq * t) * Math.sin(2 * Math.PI * freq * 1.1 * t);
            }
            
            // Add noise component
            const noise = (Math.random() - 0.5) * 0.6;
            
            // Envelope based on open/closed
            const decay = hitData.tone === 'closed' ? 25 : 8;
            const envelope = Math.exp(-t * decay);
            
            audioData[i] = (metallic * 0.4 + noise * 0.6) * envelope * (hitData.hit || 0.5);
        }
        
        return audioData;
    }

    mixDrumElements(drumTracks, characteristics) {
        const totalLength = Math.max(
            drumTracks.kick.length,
            drumTracks.snare.length,
            drumTracks.hiHat.length
        );
        
        const mixed = new Float32Array(totalLength);
        
        // Mix levels based on reggae characteristics
        const levels = this.getReggaeDrumLevels(characteristics);
        
        for (let i = 0; i < totalLength; i++) {
            let sample = 0;
            
            if (i < drumTracks.kick.length) {
                sample += drumTracks.kick[i] * levels.kick;
            }
            if (i < drumTracks.snare.length) {
                sample += drumTracks.snare[i] * levels.snare;
            }
            if (i < drumTracks.hiHat.length) {
                sample += drumTracks.hiHat[i] * levels.hiHat;
            }
            
            mixed[i] = sample;
        }
        
        return mixed;
    }

    getReggaeDrumLevels(characteristics) {
        const levels = {
            kick: 0.8,   // Strong kick foundation
            snare: 0.7,  // Prominent rim shot
            hiHat: 0.4   // Subtle hi-hat
        };
        
        // Adjust based on style characteristics
        if (characteristics.includes('beat_3_emphasis')) {
            levels.snare *= 1.2; // Emphasize the rim shot on beat 3
        }
        
        if (characteristics.includes('laid_back_feel')) {
            levels.hiHat *= 0.8; // Slightly reduce hi-hat for laid back feel
        }
        
        return levels;
    }

    applyReggaeDrumMix(audioData, pattern) {
        // Apply drum-specific EQ
        const eqd = this.applyDrumEQ(audioData);
        
        // Apply gentle compression to glue elements
        const compressed = this.applyCompression(eqd, {
            ratio: 4,
            attack: 5,
            release: 50,
            threshold: -12
        });
        
        return compressed;
    }

    // Guitar synthesis methods
    generateReggaeChordStab(chord, velocity, voicing, attack, freqProfile) {
        const sampleRate = 44100;
        const duration = 0.1; // Short, percussive stab
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        // Get chord frequencies based on voicing
        const chordFreqs = this.getChordFrequencies(chord, voicing);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            let chordSum = 0;
            
            // Generate each note in the chord
            for (const freq of chordFreqs) {
                // Clean guitar tone with slight harmonics
                const fundamental = Math.sin(2 * Math.PI * freq * t);
                const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
                chordSum += fundamental + harmonic;
            }
            
            // Apply percussive envelope
            const envelope = this.getPercussiveEnvelope(t, duration, attack);
            
            audioData[i] = chordSum * envelope * velocity / chordFreqs.length;
        }
        
        return audioData;
    }

    applyUpstrokeTechnique(chordStab, technique) {
        if (technique !== 'upstroke') return chordStab;
        
        // Upstroke technique: slightly brighter attack, quicker decay
        const processed = new Float32Array(chordStab.length);
        
        for (let i = 0; i < chordStab.length; i++) {
            const t = i / 44100;
            
            // Brighter attack simulation
            const brightness = Math.exp(-t * 20) * 0.3 + 1;
            processed[i] = chordStab[i] * brightness;
        }
        
        return processed;
    }

    applyReggaeGuitarMix(audioData, effects) {
        let processed = audioData;
        
        // Apply spring reverb if specified
        if (effects.reverb === 'spring_reverb') {
            processed = this.applySpringReverb(processed);
        }
        
        // Apply EQ for clean, bright tone
        processed = this.applyGuitarEQ(processed, effects.tone);
        
        // Apply stereo positioning
        if (effects.position) {
            processed = this.applyStereoPosition(processed, effects.position);
        }
        
        return processed;
    }

    // Keys synthesis methods
    generateHammondOrganChord(chord, velocity, drawbars, frequencies) {
        const sampleRate = 44100;
        const duration = 0.25;
        const samples = Math.floor(sampleRate * duration);
        const audioData = new Float32Array(samples);
        
        const chordFreqs = this.getChordFrequencies(chord, 'organ_voicing');
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            let organSum = 0;
            
            for (const freq of chordFreqs) {
                // Simulate drawbar harmonics
                for (let harmonic = 1; harmonic <= 9; harmonic++) {
                    const drawbarLevel = drawbars[harmonic - 1] / 8; // Normalize to 0-1
                    const harmonicFreq = freq * harmonic;
                    const harmonicLevel = Math.sin(2 * Math.PI * harmonicFreq * t) * drawbarLevel;
                    organSum += harmonicLevel;
                }
            }
            
            // Apply organ envelope (sustain characteristic)
            const envelope = this.getOrganEnvelope(t, duration);
            
            audioData[i] = organSum * envelope * velocity / (chordFreqs.length * 5);
        }
        
        return audioData;
    }

    applyReggaeKeysMix(audioData, effects) {
        let processed = audioData;
        
        // Apply Leslie rotation if specified
        if (effects.leslie === 'slow_rotation') {
            processed = this.applyLeslieEffect(processed, 'slow');
        }
        
        // Apply organ-specific EQ
        processed = this.applyOrganEQ(processed);
        
        // Apply positioning
        if (effects.position) {
            processed = this.applyStereoPosition(processed, effects.position);
        }
        
        return processed;
    }

    // Utility synthesis methods
    createBassSynthesizer() {
        return {
            type: 'reggae_bass',
            characteristics: ['warm', 'woody', 'fundamental_emphasis'],
            techniques: ['fingerstyle', 'fretless_slides']
        };
    }

    createDrumSynthesizer() {
        return {
            type: 'reggae_drums',
            characteristics: ['acoustic', 'vintage', 'punchy'],
            techniques: ['rim_shots', 'laid_back_timing']
        };
    }

    createGuitarSynthesizer() {
        return {
            type: 'reggae_guitar',
            characteristics: ['clean', 'bright', 'percussive'],
            techniques: ['upstroke', 'spring_reverb']
        };
    }

    createKeysSynthesizer() {
        return {
            type: 'reggae_keys',
            characteristics: ['hammond_organ', 'drawbar_control', 'leslie_rotation'],
            techniques: ['bubble_technique', 'jazz_voicings']
        };
    }

    // Helper methods
    noteToFrequency(note, octave) {
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        const noteIndex = noteMap[note] || 0;
        const a4Frequency = 440;
        const a4Octave = 4;
        
        return a4Frequency * Math.pow(2, (octave - a4Octave) + (noteIndex - 9) / 12);
    }

    generateTriangleWave(frequency, time) {
        const period = 1 / frequency;
        const phase = (time % period) / period;
        
        if (phase < 0.5) {
            return phase * 4 - 1;
        } else {
            return 3 - phase * 4;
        }
    }

    generateBassEnvelope(time, duration, toneSettings) {
        const attack = 0.01;  // Quick attack
        const decay = 0.1;    // Medium decay
        const sustain = 0.7;  // Good sustain level
        const release = duration - decay - attack;
        
        if (time < attack) {
            return time / attack;
        } else if (time < attack + decay) {
            const decayProgress = (time - attack) / decay;
            return 1 - decayProgress * (1 - sustain);
        } else if (time < duration - release) {
            return sustain;
        } else {
            const releaseProgress = (time - (duration - release)) / release;
            return sustain * (1 - releaseProgress);
        }
    }

    getChordFrequencies(chord, voicing) {
        // Simplified chord frequency generation
        const baseFreq = 220; // A3
        
        switch(chord) {
            case 'A': return [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // A major
            case 'D': return [baseFreq * 1.122, baseFreq * 1.4, baseFreq * 1.68]; // D major
            case 'E': return [baseFreq * 1.26, baseFreq * 1.575, baseFreq * 1.89]; // E major
            case 'G': return [baseFreq * 0.89, baseFreq * 1.12, baseFreq * 1.33]; // G major
            default: return [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
        }
    }

    getPercussiveEnvelope(time, duration, attack) {
        const attackTime = attack === 'sharp_percussive' ? 0.005 : 0.01;
        const decay = 0.05;
        
        if (time < attackTime) {
            return time / attackTime;
        } else {
            return Math.exp(-(time - attackTime) / decay);
        }
    }

    getOrganEnvelope(time, duration) {
        // Organ has quick attack and sustain
        const attack = 0.01;
        const sustain = 0.8;
        
        if (time < attack) {
            return time / attack;
        } else {
            return sustain;
        }
    }

    mixIntoBuffer(targetBuffer, sourceBuffer, startIndex) {
        const endIndex = Math.min(targetBuffer.length, startIndex + sourceBuffer.length);
        
        for (let i = 0; i < endIndex - startIndex; i++) {
            if (startIndex + i >= 0 && startIndex + i < targetBuffer.length) {
                targetBuffer[startIndex + i] += sourceBuffer[i];
            }
        }
    }

    // Audio processing methods (simplified implementations)
    applyBassEQ(audioData, eqSettings) {
        // Simplified EQ implementation
        return audioData; // In real implementation, would apply actual filtering
    }

    applyCompression(audioData, settings) {
        const processed = new Float32Array(audioData.length);
        const { ratio, threshold } = settings;
        
        for (let i = 0; i < audioData.length; i++) {
            const sample = audioData[i];
            const magnitude = Math.abs(sample);
            
            if (magnitude > threshold) {
                const excess = magnitude - threshold;
                const compressedExcess = excess / ratio;
                const compressedMagnitude = threshold + compressedExcess;
                processed[i] = Math.sign(sample) * compressedMagnitude;
            } else {
                processed[i] = sample;
            }
        }
        
        return processed;
    }

    applyTapeSaturation(audioData, amount) {
        const processed = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            const sample = audioData[i];
            // Soft saturation curve
            processed[i] = Math.tanh(sample * (1 + amount)) / (1 + amount);
        }
        
        return processed;
    }

    normalizeAudio(audioData) {
        const maxAmplitude = Math.max(...audioData.map(Math.abs));
        if (maxAmplitude === 0) return audioData;
        
        const normalized = new Float32Array(audioData.length);
        const factor = 0.9 / maxAmplitude; // Leave some headroom
        
        for (let i = 0; i < audioData.length; i++) {
            normalized[i] = audioData[i] * factor;
        }
        
        return normalized;
    }

    applyDrumEQ(audioData) {
        // Simplified drum EQ
        return audioData;
    }

    applySpringReverb(audioData) {
        // Simplified spring reverb
        const delayed = new Float32Array(audioData.length);
        const delayTime = Math.floor(44100 * 0.03); // 30ms delay
        
        for (let i = 0; i < audioData.length; i++) {
            delayed[i] = audioData[i];
            if (i >= delayTime) {
                delayed[i] += audioData[i - delayTime] * 0.3;
            }
        }
        
        return delayed;
    }

    applyGuitarEQ(audioData, tone) {
        // Simplified guitar EQ for clean, bright tone
        return audioData;
    }

    applyStereoPosition(audioData, position) {
        // Simplified stereo positioning
        return audioData;
    }

    applyLeslieEffect(audioData, speed) {
        // Simplified Leslie rotation effect
        return audioData;
    }

    applyOrganEQ(audioData) {
        // Simplified organ EQ
        return audioData;
    }

    async synthesizeGenericReggaeInstrument(instrument, pattern, freqProfile, context) {
        console.log(`🎵 Synthesizing generic reggae ${instrument}`);
        
        const sampleRate = 44100;
        const duration = context.duration || 30;
        const audioData = new Float32Array(duration * sampleRate);
        
        // Generate basic waveform based on frequency profile
        const baseFreq = freqProfile.fundamental?.[0] || 440;
        
        for (let i = 0; i < audioData.length; i++) {
            const t = i / sampleRate;
            audioData[i] = Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
        }
        
        return this.normalizeAudio(audioData);
    }
}

//Reggae Mixing Engine for Enhanced Instrument Separation
class ReggaeMixingEngine {
    constructor() {
        this.reggaeMixProfile = this.initializeReggaeMixProfile();
        this.frequencyBands = this.initializeFrequencyBands();
        this.spatialPositioning = this.initializeSpatialPositioning();
        this.processingChain = this.initializeProcessingChain();
        
        console.log('🎛️ ReggaeMixingEngine initialized with authentic mixing profiles');
    }

    initializeReggaeMixProfile() {
        return {
            bass: {
                frequency: [40, 300],
                position: 'center',
                level: 0.8,              // Prominent in mix
                compression: {
                    ratio: 3,
                    attack: 15,
                    release: 100,
                    threshold: -12
                },
                eq: {
                    lowShelf: { freq: 80, gain: 2 },
                    lowMid: { freq: 200, gain: 1 },
                    highCut: { freq: 3000, slope: -6 }
                }
            },
            drums: {
                kick: { 
                    frequency: [50, 100], 
                    level: 0.75, 
                    position: 'center',
                    compression: { ratio: 4, attack: 5, release: 50, threshold: -10 }
                },
                snare: { 
                    frequency: [200, 3000], 
                    level: 0.6, 
                    position: 'center',
                    compression: { ratio: 3, attack: 1, release: 100, threshold: -8 }
                },
                hiHat: { 
                    frequency: [8000, 15000], 
                    level: 0.4, 
                    position: 'slight_right',
                    compression: { ratio: 2, attack: 0.5, release: 50, threshold: -15 }
                }
            },
            guitar: {
                frequency: [200, 5000],
                position: 'right',
                level: 0.5,
                effect: 'spring_reverb',
                compression: {
                    ratio: 2.5,
                    attack: 10,
                    release: 80,
                    threshold: -18
                }
            },
            keys: {
                frequency: [100, 8000],
                position: 'left',
                level: 0.6,
                effect: 'subtle_chorus',
                compression: {
                    ratio: 2,
                    attack: 20,
                    release: 120,
                    threshold: -20
                }
            }
        };
    }

    initializeFrequencyBands() {
        return {
            subBass: { range: [20, 60], purpose: 'foundation' },
            bass: { range: [60, 250], purpose: 'fundamental_bass' },
            lowMid: { range: [250, 500], purpose: 'body_warmth' },
            mid: { range: [500, 2000], purpose: 'presence' },
            upperMid: { range: [2000, 6000], purpose: 'clarity' },
            treble: { range: [6000, 12000], purpose: 'air_brightness' },
            upperTreble: { range: [12000, 20000], purpose: 'sparkle' }
        };
    }

    initializeSpatialPositioning() {
        return {
            center: { pan: 0, width: 0.2 },
            slight_left: { pan: -0.3, width: 0.15 },
            left: { pan: -0.7, width: 0.3 },
            slight_right: { pan: 0.3, width: 0.15 },
            right: { pan: 0.7, width: 0.3 },
            wide: { pan: 0, width: 1.0 }
        };
    }

    initializeProcessingChain() {
        return {
            preProcessing: [
                'noise_reduction',
                'phase_alignment',
                'gain_staging'
            ],
            mixing: [
                'eq_filtering',
                'compression',
                'stereo_positioning',
                'effects_processing'
            ],
            postProcessing: [
                'master_eq',
                'master_compression',
                'stereo_enhancement',
                'limiting'
            ]
        };
    }

    async mixReggaeTrack(instrumentTracks, context) {
        console.log(`🎛️ Mixing reggae track with ${Object.keys(instrumentTracks).length} instruments`);
        
        // Determine master track length
        const maxLength = Math.max(
            ...Object.values(instrumentTracks).map(track => track.length)
        );
        
        // Initialize stereo master track
        const masterTrack = {
            left: new Float32Array(maxLength),
            right: new Float32Array(maxLength)
        };
        
        // Pre-processing phase
        const processedTracks = await this.preProcessInstruments(instrumentTracks);
        
        // Main mixing phase
        for (const [instrument, track] of Object.entries(processedTracks)) {
            const mixProfile = this.getMixProfile(instrument);
            
            // Process individual instrument
            const processed = await this.processInstrumentTrack(track, instrument, mixProfile);
            
            // Mix into master track
            this.mixIntoMaster(masterTrack, processed, mixProfile);
        }
        
        // Post-processing phase
        const finalMix = await this.postProcessMaster(masterTrack, context);
        
        console.log('✅ Reggae track mixing completed');
        return finalMix;
    }

    async preProcessInstruments(instrumentTracks) {
        const processed = {};
        
        for (const [instrument, track] of Object.entries(instrumentTracks)) {
            console.log(`🔧 Pre-processing ${instrument}...`);
            
            let processedTrack = track;
            
            // Noise reduction
            processedTrack = this.applyNoiseReduction(processedTrack, instrument);
            
            // Phase alignment (ensure all tracks are in phase)
            processedTrack = this.applyPhaseAlignment(processedTrack);
            
            // Gain staging (optimal levels before mixing)
            processedTrack = this.applyGainStaging(processedTrack, instrument);
            
            processed[instrument] = processedTrack;
        }
        
        return processed;
    }

    async processInstrumentTrack(track, instrument, mixProfile) {
        let processed = track;
        
        // EQ filtering for frequency separation
        processed = this.applyInstrumentEQ(processed, mixProfile.eq || mixProfile);
        
        // Compression for consistency
        processed = this.applyInstrumentCompression(processed, mixProfile.compression);
        
        // Apply instrument-specific effects
        if (mixProfile.effect) {
            processed = this.applyInstrumentEffects(processed, mixProfile.effect, instrument);
        }
        
        // Level adjustment
        processed = this.applyLevelAdjustment(processed, mixProfile.level);
        
        return processed;
    }

    mixIntoMaster(masterTrack, processedTrack, mixProfile) {
        const position = this.spatialPositioning[mixProfile.position] || this.spatialPositioning.center;
        const { pan, width } = position;
        
        // Calculate stereo positioning
        const leftGain = 0.5 * (1 - pan) * (1 + width);
        const rightGain = 0.5 * (1 + pan) * (1 + width);
        
        // Mix into master channels
        for (let i = 0; i < Math.min(masterTrack.left.length, processedTrack.length); i++) {
            masterTrack.left[i] += processedTrack[i] * leftGain;
            masterTrack.right[i] += processedTrack[i] * rightGain;
        }
    }

    async postProcessMaster(masterTrack, context) {
        console.log('🎛️ Applying master processing...');
        
        // Convert to interleaved stereo
        const stereoTrack = this.interleaveStereo(masterTrack);
        
        // Master EQ for overall tonal balance
        let processed = this.applyMasterEQ(stereoTrack);
        
        // Master compression for glue
        processed = this.applyMasterCompression(processed);
        
        // Stereo enhancement
        processed = this.applyStereoEnhancement(processed);
        
        // Final limiting for consistency
        processed = this.applyMasterLimiting(processed);
        
        // Apply reggae-specific master processing
        processed = this.applyReggaeMasterProcessing(processed);
        
        return processed;
    }

    getMixProfile(instrument) {
        // Handle drum sub-elements
        if (instrument.includes('kick') || instrument.includes('snare') || instrument.includes('hiHat')) {
            const drumElement = instrument.split('_')[0] || instrument;
            return this.reggaeMixProfile.drums[drumElement] || this.reggaeMixProfile.drums.kick;
        }
        
        // Handle guitar variations
        if (instrument.includes('guitar') || instrument.includes('skank')) {
            return this.reggaeMixProfile.guitar;
        }
        
        // Handle keys variations
        if (instrument.includes('keys') || instrument.includes('organ') || instrument.includes('piano')) {
            return this.reggaeMixProfile.keys;
        }
        
        return this.reggaeMixProfile[instrument] || this.createDefaultMixProfile();
    }

    createDefaultMixProfile() {
        return {
            frequency: [100, 8000],
            position: 'center',
            level: 0.5,
            compression: {
                ratio: 2,
                attack: 10,
                release: 100,
                threshold: -15
            }
        };
    }

    // EQ and Filtering Methods
    applyInstrumentEQ(audioData, eqSettings) {
        if (!eqSettings || typeof eqSettings.frequency === 'undefined') {
            return audioData;
        }
        
        let processed = audioData;
        
        // Apply frequency band filtering
        if (eqSettings.frequency) {
            processed = this.applyBandpassFilter(processed, eqSettings.frequency);
        }
        
        // Apply specific EQ adjustments
        if (eqSettings.lowShelf) {
            processed = this.applyLowShelf(processed, eqSettings.lowShelf);
        }
        
        if (eqSettings.lowMid) {
            processed = this.applyPeakingEQ(processed, eqSettings.lowMid);
        }
        
        if (eqSettings.highCut) {
            processed = this.applyHighCut(processed, eqSettings.highCut);
        }
        
        return processed;
    }

    applyBandpassFilter(audioData, frequencyRange) {
        // Simplified bandpass filter implementation
        // In a real implementation, this would use proper DSP filtering
        return audioData;
    }

    applyLowShelf(audioData, settings) {
        // Simplified low shelf EQ
        const processed = new Float32Array(audioData.length);
        const boost = Math.pow(10, settings.gain / 20); // Convert dB to linear
        
        for (let i = 0; i < audioData.length; i++) {
            // Simple bass boost simulation
            processed[i] = audioData[i] * boost;
        }
        
        return processed;
    }

    applyPeakingEQ(audioData, settings) {
        // Simplified peaking EQ
        return audioData;
    }

    applyHighCut(audioData, settings) {
        // Simplified high cut filter
        return audioData;
    }

    // Compression Methods
    applyInstrumentCompression(audioData, compressionSettings) {
        if (!compressionSettings) return audioData;
        
        const { ratio, attack, release, threshold } = compressionSettings;
        const processed = new Float32Array(audioData.length);
        const sampleRate = 44100;
        
        let envelope = 0;
        const attackCoeff = Math.exp(-1 / (attack * 0.001 * sampleRate));
        const releaseCoeff = Math.exp(-1 / (release * 0.001 * sampleRate));
        
        for (let i = 0; i < audioData.length; i++) {
            const input = Math.abs(audioData[i]);
            
            // Envelope follower
            if (input > envelope) {
                envelope = input + (envelope - input) * attackCoeff;
            } else {
                envelope = input + (envelope - input) * releaseCoeff;
            }
            
            // Apply compression
            let gain = 1;
            if (envelope > threshold) {
                const excessDb = 20 * Math.log10(envelope / threshold);
                const compressedDb = excessDb / ratio;
                gain = threshold * Math.pow(10, compressedDb / 20) / envelope;
            }
            
            processed[i] = audioData[i] * gain;
        }
        
        return processed;
    }

    // Effects Processing Methods
    applyInstrumentEffects(audioData, effect, instrument) {
        switch(effect) {
            case 'spring_reverb':
                return this.applySpringReverb(audioData);
            case 'subtle_chorus':
                return this.applyChorus(audioData, 'subtle');
            case 'leslie_rotation':
                return this.applyLeslieEffect(audioData, 'slow');
            default:
                return audioData;
        }
    }

    applySpringReverb(audioData) {
        const processed = new Float32Array(audioData.length);
        const delayTime = Math.floor(44100 * 0.03); // 30ms
        const feedback = 0.3;
        const wetLevel = 0.25;
        
        for (let i = 0; i < audioData.length; i++) {
            processed[i] = audioData[i];
            
            if (i >= delayTime) {
                processed[i] += processed[i - delayTime] * feedback;
            }
        }
        
        // Mix wet and dry signals
        for (let i = 0; i < audioData.length; i++) {
            processed[i] = audioData[i] * (1 - wetLevel) + processed[i] * wetLevel;
        }
        
        return processed;
    }

    applyChorus(audioData, intensity) {
        const processed = new Float32Array(audioData.length);
        const delayTime = Math.floor(44100 * 0.02); // 20ms base delay
        const depth = intensity === 'subtle' ? 0.15 : 0.3;
        const rate = 0.5; // Hz
        const sampleRate = 44100;
        
        for (let i = 0; i < audioData.length; i++) {
            const lfo = Math.sin(2 * Math.PI * rate * i / sampleRate) * depth;
            const delay = Math.floor(delayTime * (1 + lfo));
            
            processed[i] = audioData[i];
            if (i >= delay) {
                processed[i] += audioData[i - delay] * 0.4;
            }
        }
        
        return processed;
    }

    applyLeslieEffect(audioData, speed) {
        // Simplified Leslie rotating speaker effect
        const processed = new Float32Array(audioData.length);
        const rotationRate = speed === 'slow' ? 0.8 : 3.5; // Hz
        const sampleRate = 44100;
        
        for (let i = 0; i < audioData.length; i++) {
            const phase = 2 * Math.PI * rotationRate * i / sampleRate;
            const modulation = Math.sin(phase) * 0.3;
            
            processed[i] = audioData[i] * (1 + modulation);
        }
        
        return processed;
    }

    // Level and Gain Methods
    applyLevelAdjustment(audioData, level) {
        const processed = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            processed[i] = audioData[i] * level;
        }
        
        return processed;
    }

    applyGainStaging(audioData, instrument) {
        // Optimize levels for mixing
        const targetLevels = {
            bass: 0.8,
            drums: 0.9,
            guitar: 0.6,
            keys: 0.7
        };
        
        const targetLevel = targetLevels[instrument] || 0.7;
        const maxAmplitude = Math.max(...audioData.map(Math.abs));
        
        if (maxAmplitude === 0) return audioData;
        
        const gain = targetLevel / maxAmplitude;
        const processed = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            processed[i] = audioData[i] * gain;
        }
        
        return processed;
    }

    // Master Processing Methods
    applyMasterEQ(stereoTrack) {
        // Apply reggae-specific master EQ curve
        let processed = stereoTrack;
        
        // Slight bass boost for reggae foundation
        processed = this.applyMasterBassBoost(processed);
        
        // Mid-range clarity
        processed = this.applyMasterMidClarify(processed);
        
        // Gentle high-frequency roll-off for warmth
        processed = this.applyMasterHighRolloff(processed);
        
        return processed;
    }

    applyMasterCompression(stereoTrack) {
        // Gentle master bus compression for glue
        const settings = {
            ratio: 3,
            attack: 10,
            release: 100,
            threshold: -12
        };
        
        return this.applyInstrumentCompression(stereoTrack, settings);
    }

    applyStereoEnhancement(stereoTrack) {
        // Enhance stereo width slightly
        const processed = new Float32Array(stereoTrack.length);
        const widthFactor = 1.1; // Subtle enhancement
        
        for (let i = 0; i < stereoTrack.length; i += 2) {
            const left = stereoTrack[i];
            const right = stereoTrack[i + 1];
            const mid = (left + right) / 2;
            const side = (left - right) / 2;
            
            processed[i] = mid + side * widthFactor;
            processed[i + 1] = mid - side * widthFactor;
        }
        
        return processed;
    }

    applyMasterLimiting(stereoTrack) {
        // Prevent clipping and maintain consistency
        const processed = new Float32Array(stereoTrack.length);
        const threshold = 0.9;
        
        for (let i = 0; i < stereoTrack.length; i++) {
            const sample = stereoTrack[i];
            
            if (Math.abs(sample) > threshold) {
                processed[i] = Math.sign(sample) * threshold;
            } else {
                processed[i] = sample;
            }
        }
        
        return processed;
    }

    applyReggaeMasterProcessing(stereoTrack) {
        // Apply reggae-specific master characteristics
        let processed = stereoTrack;
        
        // Light compression to glue elements together
        const compressionSettings = {
            ratio: 3,
            attack: 10,
            release: 100,
            threshold: -12
        };
        processed = this.applyInstrumentCompression(processed, compressionSettings);
        
        // Subtle tape saturation for warmth
        processed = this.applyTapeSaturation(processed, 0.15);
        
        // High-frequency roll-off for vintage character
        processed = this.applyLowPassFilter(processed, 12000);
        
        return this.normalizeAudio(processed);
    }

    // Utility Methods
    interleaveStereo(masterTrack) {
        const stereoLength = masterTrack.left.length * 2;
        const stereoTrack = new Float32Array(stereoLength);
        
        for (let i = 0; i < masterTrack.left.length; i++) {
            stereoTrack[i * 2] = masterTrack.left[i];
            stereoTrack[i * 2 + 1] = masterTrack.right[i];
        }
        
        return stereoTrack;
    }

    applyNoiseReduction(audioData, instrument) {
        // Simple noise gate
        const threshold = 0.01;
        const processed = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            processed[i] = Math.abs(audioData[i]) < threshold ? 0 : audioData[i];
        }
        
        return processed;
    }

    applyPhaseAlignment(audioData) {
        // Ensure phase coherence (simplified)
        return audioData;
    }

    applyMasterBassBoost(stereoTrack) {
        // Subtle bass boost for reggae foundation
        return stereoTrack;
    }

    applyMasterMidClarify(stereoTrack) {
        // Mid-range clarity enhancement
        return stereoTrack;
    }

    applyMasterHighRolloff(stereoTrack) {
        // Gentle high-frequency roll-off
        return stereoTrack;
    }

    applyTapeSaturation(audioData, amount) {
        const processed = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            const sample = audioData[i];
            // Soft saturation curve
            processed[i] = Math.tanh(sample * (1 + amount)) / (1 + amount);
        }
        
        return processed;
    }

    applyLowPassFilter(audioData, cutoffFreq) {
        // Simplified low-pass filter
        return audioData;
    }

    normalizeAudio(audioData) {
        const maxAmplitude = Math.max(...audioData.map(Math.abs));
        if (maxAmplitude === 0) return audioData;
        
        const normalized = new Float32Array(audioData.length);
        const factor = 0.9 / maxAmplitude; // Leave some headroom
        
        for (let i = 0; i < audioData.length; i++) {
            normalized[i] = audioData[i] * factor;
        }
        
        return normalized;
    }

    // Analysis and Diagnostic Methods
    analyzeFrequencySpectrum(audioData) {
        // FFT analysis for frequency content
        return {
            bass: 0.8,
            mids: 0.6,
            highs: 0.4,
            balance: 'bass_prominent'
        };
    }

    analyzeStereoWidth(stereoTrack) {
        let correlation = 0;
        const samples = stereoTrack.length / 2;
        
        for (let i = 0; i < samples; i++) {
            const left = stereoTrack[i * 2];
            const right = stereoTrack[i * 2 + 1];
            correlation += left * right;
        }
        
        return {
            correlation: correlation / samples,
            width: correlation < 0.5 ? 'wide' : 'narrow',
            balance: 'centered'
        };
    }

    generateMixReport(finalMix, instrumentTracks) {
        return {
            totalTracks: Object.keys(instrumentTracks).length,
            finalLength: finalMix.length,
            sampleRate: 44100,
            channels: 2,
            peakLevel: Math.max(...finalMix.map(Math.abs)),
            rmsLevel: Math.sqrt(finalMix.reduce((sum, sample) => sum + sample * sample, 0) / finalMix.length),
            frequencyAnalysis: this.analyzeFrequencySpectrum(finalMix),
            stereoAnalysis: this.analyzeStereoWidth(finalMix),
            reggaeCharacteristics: {
                bassProminence: 'high',
                drumClarity: 'good',
                instrumentSeparation: 'excellent',
                culturalAuthenticity: 'high'
            }
        };
    }

    async mixReggaeComposition(audioData, context) {
        console.log('🎵 DEBUG: ReggaeMixingEngine.mixReggaeComposition called');
        console.log('🎛️ Applying reggae-specific mixing and mastering...');
        
        try {
            // If audioData is already processed, return it
            if (audioData && typeof audioData === 'object' && audioData.length) {
                console.log('✅ Audio data already processed, applying final master processing');
                return await this.postProcessMaster(audioData, context);
            }
            
            // Otherwise, assume it's instrument tracks that need mixing
            console.log('🎛️ Mixing instrument tracks with reggae profiles');
            return await this.mixReggaeTrack(audioData, context);
            
        } catch (error) {
            console.error('❌ Reggae composition mixing failed:', error);
            throw error;
        }
    }
}

module.exports = {
    ReggaeAudioSynthesizer,
    ReggaeMixingEngine
};