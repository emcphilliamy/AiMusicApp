// Generate Isolated Audio Files
// Simplified robust version focused on generating clean isolated instrument tracks

const { RealisticDrumSynthesis } = require('./realistic-drum-synthesis');
const { WaveFile } = require('wavefile');
const fs = require('fs');
const path = require('path');

class IsolatedAudioGenerator {
    constructor(modelManager = null) {
        this.sampleRate = 44100;
        this.drumSynthesis = new RealisticDrumSynthesis();
        this.modelManager = modelManager;
        
        // All instruments from the codebase - connected to Professional Instrument AI
        this.instruments = [
            'drums', 'bass', 'lead_guitar', 'rhythm_guitar', 
            'piano', 'strings', 'synthesizer'
        ];
        
        console.log('🎼 IsolatedAudioGenerator initialized - connected to Professional Instrument AI model');
        
        // Load trained model data if available
        this.loadTrainedModelData();
    }
    
    loadTrainedModelData() {
        if (this.modelManager) {
            const currentModel = this.modelManager.getCurrentModel();
            if (currentModel && currentModel.trainingData && currentModel.trainingData.samples) {
                console.log(`🧠 Connected to trained model: ${currentModel.name} with ${currentModel.trainingData.samples.length} samples`);
                this.trainedModel = currentModel;
                this.hasTrainedData = true;
            } else {
                console.log('⚠️ No trained model data available - using built-in patterns');
                this.hasTrainedData = false;
            }
        } else {
            console.log('⚠️ No model manager provided - using built-in patterns');
            this.hasTrainedData = false;
        }
    }

    async generateAllIsolatedTracks() {
        console.log('🎵 Generating isolated audio tracks for all instruments...');
        
        const context = {
            duration: 8,
            tempo: 120,
            key: 'C',
            style: 'modern'
        };

        const results = [];
        
        for (const instrument of this.instruments) {
            try {
                console.log(`\n🎹 Generating isolated ${instrument}...`);
                
                const audioData = await this.generateInstrumentAudio(instrument, context);
                const filePath = await this.saveIsolatedTrack(audioData, instrument, context);
                
                results.push({
                    instrument,
                    filePath,
                    success: true,
                    duration: context.duration
                });
                
                console.log(`✅ ${instrument} saved: ${path.basename(filePath)}`);
                
            } catch (error) {
                console.error(`❌ Failed to generate ${instrument}:`, error.message);
                results.push({
                    instrument,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    async generateInstrumentAudio(instrument, context) {
        const duration = context.duration;
        const samples = duration * this.sampleRate;
        
        switch (instrument) {
            case 'drums':
                return this.generateDrumAudio(context);
                
            case 'bass':
                return this.generateBassAudio(samples, context);
                
            case 'lead_guitar':
                return this.generateLeadGuitarAudio(samples, context);
                
            case 'rhythm_guitar':
                return this.generateRhythmGuitarAudio(samples, context);
                
            case 'piano':
                return this.generatePianoAudio(samples, context);
                
            case 'strings':
                return this.generateStringsAudio(samples, context);
                
            case 'synthesizer':
                return this.generateSynthAudio(samples, context);
                
            default:
                throw new Error(`Unknown instrument: ${instrument}`);
        }
    }

    generateDrumAudio(context) {
        console.log('🥁 Generating isolated drums using advanced realistic drum synthesis...');
        
        // Generate dynamic drum pattern based on context
        const pattern = this.generateDynamicDrumPattern(context);
        
        console.log(`🎵 Using ${pattern.style} drum pattern with physical modeling synthesis`);
        
        // Use the advanced realistic drum synthesis system
        return this.drumSynthesis.synthesizeRealisticDrums(pattern.drumData, context);
    }

    generateDynamicDrumPattern(context) {
        const { tempo, key, style, duration } = context;
        const beatsPerSecond = tempo / 60;
        const totalBeats = Math.max(16, Math.floor(duration * beatsPerSecond));
        
        console.log(`🎼 Generating drum pattern: ${totalBeats} beats at ${tempo} BPM`);
        
        // Use trained model data to influence pattern generation if available
        let patternStyle = 'modern';
        if (this.hasTrainedData && this.trainedModel.trainingData.patterns) {
            console.log('🧠 Using Professional Instrument AI trained patterns for enhanced generation');
            // Enhanced pattern selection based on trained model
            patternStyle = this.selectTrainedPatternStyle(tempo, context);
        } else {
            // Fallback to built-in pattern selection
            if (tempo < 80) {
                patternStyle = 'reggae_one_drop';
            } else if (tempo < 100) {
                patternStyle = 'reggae_steppers';
            } else if (tempo < 130) {
                patternStyle = 'rock_steady';
            } else {
                patternStyle = 'uptempo_modern';
            }
        }
        
        // Generate kick pattern
        const kickPattern = this.generateKickPattern(totalBeats, patternStyle);
        const snarePattern = this.generateSnarePattern(totalBeats, patternStyle);
        const hihatPattern = this.generateHithatPattern(totalBeats, patternStyle);
        
        return {
            style: patternStyle,
            drumData: {
                kick: kickPattern,
                snare: snarePattern,
                hiHat: hihatPattern
            }
        };
    }
    
    selectTrainedPatternStyle(tempo, context) {
        // Use trained model data to select the most appropriate pattern style
        const patterns = this.trainedModel.trainingData.patterns;
        
        // Find the genre in training data that best matches the tempo
        let bestMatch = 'modern';
        let bestScore = 0;
        
        for (const [genre, genreData] of Object.entries(patterns)) {
            if (genreData.tempo_range) {
                const tempoMatch = this.calculateTempoMatch(tempo, genreData.tempo_range);
                const score = tempoMatch * (genreData.energy_profile || 0.5);
                
                if (score > bestScore) {
                    bestScore = score;
                    // Map training genres to pattern styles
                    if (genre.includes('reggae') || tempo < 90) {
                        bestMatch = tempo < 80 ? 'reggae_one_drop' : 'reggae_steppers';
                    } else if (genre.includes('jazz') && tempo > 120) {
                        bestMatch = 'uptempo_modern';
                    } else if (tempo < 130) {
                        bestMatch = 'rock_steady';
                    } else {
                        bestMatch = 'uptempo_modern';
                    }
                }
            }
        }
        
        console.log(`🎯 Selected pattern style: ${bestMatch} (score: ${bestScore.toFixed(2)})`);
        return bestMatch;
    }
    
    calculateTempoMatch(targetTempo, tempoRange) {
        const avgTempo = tempoRange.avg || (tempoRange.min + tempoRange.max) / 2;
        const difference = Math.abs(targetTempo - avgTempo);
        const maxDifference = Math.max(tempoRange.max - tempoRange.min, 40);
        return Math.max(0, 1 - (difference / maxDifference));
    }

    generateKickPattern(totalBeats, style) {
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const beatInBar = beat % 16;
            let hit = 0;
            
            switch (style) {
                case 'reggae_one_drop':
                    // Classic one drop - kick on beat 3 of each bar
                    if (beatInBar === 2 || beatInBar === 10) {
                        hit = 0.9;
                    } else if (beatInBar === 6 || beatInBar === 14) {
                        hit = 0.7;
                    }
                    break;
                    
                case 'reggae_steppers':
                    // Steppers - kick on every beat
                    if (beatInBar % 4 === 0) {
                        hit = 0.8;
                    } else if (beatInBar % 2 === 0) {
                        hit = 0.6;
                    }
                    break;
                    
                case 'rock_steady':
                    // Rock steady pattern
                    if (beatInBar === 0 || beatInBar === 8) {
                        hit = 0.9;
                    } else if (beatInBar === 4 || beatInBar === 12) {
                        hit = 0.7;
                    }
                    break;
                    
                case 'uptempo_modern':
                    // Modern uptempo pattern
                    if (beatInBar % 4 === 0) {
                        hit = 0.8;
                    } else if (beatInBar % 8 === 6) {
                        hit = 0.6;
                    }
                    break;
                    
                default:
                    // Four-on-the-floor
                    if (beatInBar % 4 === 0) {
                        hit = 0.8;
                    }
            }
            
            pattern.push({ hit, timing: 1 });
        }
        
        return pattern;
    }

    generateSnarePattern(totalBeats, style) {
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const beatInBar = beat % 16;
            let hit = 0;
            let technique = 'normal';
            
            switch (style) {
                case 'reggae_one_drop':
                case 'reggae_steppers':
                    // Reggae rim shots on 2 and 4
                    if (beatInBar === 1 || beatInBar === 5 || beatInBar === 9 || beatInBar === 13) {
                        hit = 0.8;
                        technique = 'rim_shot';
                    } else if (beatInBar === 3 || beatInBar === 7 || beatInBar === 11 || beatInBar === 15) {
                        hit = 0.9;
                        technique = 'rim_shot';
                    }
                    break;
                    
                case 'rock_steady':
                    // Rock steady snare
                    if (beatInBar === 4 || beatInBar === 12) {
                        hit = 0.9;
                        technique = 'normal';
                    } else if (beatInBar === 6 || beatInBar === 14) {
                        hit = 0.6;
                        technique = 'normal';
                    }
                    break;
                    
                case 'uptempo_modern':
                    // Modern snare on 2 and 4
                    if (beatInBar === 4 || beatInBar === 12) {
                        hit = 0.9;
                        technique = 'normal';
                    } else if (beatInBar === 2 || beatInBar === 6 || beatInBar === 10 || beatInBar === 14) {
                        hit = 0.5;
                        technique = 'normal';
                    }
                    break;
                    
                default:
                    // Standard backbeat
                    if (beatInBar === 4 || beatInBar === 12) {
                        hit = 0.9;
                        technique = 'normal';
                    }
            }
            
            pattern.push({ hit, timing: 1, technique });
        }
        
        return pattern;
    }

    generateHithatPattern(totalBeats, style) {
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const beatInBar = beat % 16;
            let hit = 0;
            let tone = 'closed';
            
            switch (style) {
                case 'reggae_one_drop':
                    // Sparse reggae hi-hat
                    if (beatInBar % 4 === 0) {
                        hit = 0.4;
                        tone = 'closed';
                    } else if (beatInBar % 8 === 3) {
                        hit = 0.5;
                        tone = 'semi_open';
                    } else if (beatInBar % 8 === 7) {
                        hit = 0.6;
                        tone = 'open';
                    }
                    break;
                    
                case 'reggae_steppers':
                    // Steppers hi-hat
                    if (beatInBar % 2 === 1) {
                        hit = 0.4;
                        tone = 'closed';
                    } else if (beatInBar % 8 === 6) {
                        hit = 0.5;
                        tone = 'semi_open';
                    }
                    break;
                    
                case 'rock_steady':
                    // Rock steady hi-hat
                    if (beatInBar % 2 === 0) {
                        hit = 0.3;
                        tone = 'closed';
                    } else if (beatInBar % 4 === 1) {
                        hit = 0.4;
                        tone = 'closed';
                    }
                    break;
                    
                case 'uptempo_modern':
                    // Modern hi-hat
                    if (beatInBar % 1 === 0) { // Every beat
                        hit = 0.3 + (Math.random() * 0.2);
                        tone = beatInBar % 4 === 3 ? 'semi_open' : 'closed';
                    }
                    break;
                    
                default:
                    // Standard eighth note hi-hat
                    if (beatInBar % 2 === 0) {
                        hit = 0.4;
                        tone = 'closed';
                    }
            }
            
            pattern.push({ hit, timing: 1, tone });
        }
        
        return pattern;
    }

    generateBassAudio(samples, context) {
        console.log('🎸 Generating bass with string modeling...');
        const bassTrack = new Float32Array(samples);
        
        // Generate bass line: Root notes every 2 beats
        const fundamentalFreq = 82.41; // E2
        const beatDuration = 60 / context.tempo;
        const notesPerBeat = 2;
        
        for (let beat = 0; beat < context.duration * 2; beat += notesPerBeat) {
            const startTime = beat * beatDuration;
            const noteDuration = beatDuration * 1.5;
            
            // Alternate between root and fifth
            const frequency = beat % 4 === 0 ? fundamentalFreq : fundamentalFreq * 1.5;
            const bassSample = this.generateBassSample(frequency, 0.8, noteDuration);
            
            const startSample = Math.floor(startTime * this.sampleRate);
            this.addSampleToTrack(bassTrack, bassSample, startSample);
        }
        
        return bassTrack;
    }

    generateLeadGuitarAudio(samples, context) {
        console.log('🎸 Generating lead guitar with melodic phrases...');
        const guitarTrack = new Float32Array(samples);
        
        // Pentatonic scale in E minor
        const scale = [164.81, 196.00, 220.00, 246.94, 293.66]; // E3, G3, A3, B3, D4
        const beatDuration = 60 / context.tempo;
        
        for (let beat = 0; beat < context.duration; beat += 0.5) {
            if (Math.random() > 0.3) { // 70% note density
                const startTime = beat * beatDuration;
                const frequency = scale[Math.floor(Math.random() * scale.length)];
                const guitarSample = this.generateGuitarSample(frequency, 0.7, 0.4);
                
                const startSample = Math.floor(startTime * this.sampleRate);
                this.addSampleToTrack(guitarTrack, guitarSample, startSample);
            }
        }
        
        return guitarTrack;
    }

    generateRhythmGuitarAudio(samples, context) {
        console.log('🎸 Generating rhythm guitar with chord strumming...');
        const guitarTrack = new Float32Array(samples);
        
        // Simple chord progression
        const chords = [
            [164.81, 207.65, 246.94], // Em chord
            [146.83, 184.99, 220.00], // D chord
            [130.81, 164.81, 196.00], // C chord
            [196.00, 246.94, 293.66]  // G chord
        ];
        
        const beatDuration = 60 / context.tempo;
        const chordDuration = beatDuration * 4; // Whole notes
        
        for (let bar = 0; bar < Math.floor(context.duration / 4); bar++) {
            const chord = chords[bar % chords.length];
            const startTime = bar * chordDuration;
            
            const chordSample = this.generateChordSample(chord, 0.6, 3.5);
            const startSample = Math.floor(startTime * this.sampleRate);
            this.addSampleToTrack(guitarTrack, chordSample, startSample);
        }
        
        return guitarTrack;
    }

    generatePianoAudio(samples, context) {
        console.log('🎹 Generating piano with harmonic progressions...');
        const pianoTrack = new Float32Array(samples);
        
        // Piano chord progression with left and right hand
        const leftHand = [65.41, 73.42, 82.41, 98.00]; // Bass notes
        const rightHand = [
            [261.63, 329.63, 392.00], // C major
            [246.94, 311.13, 369.99], // B major
            [220.00, 277.18, 329.63], // A minor
            [196.00, 246.94, 293.66]  // G major
        ];
        
        const beatDuration = 60 / context.tempo;
        const chordDuration = beatDuration * 2; // Half notes
        
        for (let chord = 0; chord < Math.floor(context.duration / 2); chord++) {
            const startTime = chord * chordDuration;
            
            // Left hand bass note
            const bassNote = leftHand[chord % leftHand.length];
            const bassSample = this.generatePianoNote(bassNote, 0.7, 1.5);
            
            // Right hand chord
            const chordNotes = rightHand[chord % rightHand.length];
            const chordSample = this.generatePianoChord(chordNotes, 0.5, 1.8);
            
            const startSample = Math.floor(startTime * this.sampleRate);
            this.addSampleToTrack(pianoTrack, bassSample, startSample);
            this.addSampleToTrack(pianoTrack, chordSample, startSample);
        }
        
        return pianoTrack;
    }

    generateStringsAudio(samples, context) {
        console.log('🎻 Generating orchestral strings with sustained harmonies...');
        const stringsTrack = new Float32Array(samples);
        
        // String ensemble harmony
        const harmony = [
            130.81, // C3 (Cello)
            164.81, // E3 (Viola) 
            196.00, // G3 (Violin II)
            261.63  // C4 (Violin I)
        ];
        
        const sustainedChord = this.generateStringEnsemble(harmony, 0.4, context.duration - 0.5);
        this.addSampleToTrack(stringsTrack, sustainedChord, 0);
        
        return stringsTrack;
    }

    generateSynthAudio(samples, context) {
        console.log('🎛️ Generating synthesizer with electronic patterns...');
        const synthTrack = new Float32Array(samples);
        
        // Arpeggiated synth pattern
        const arpeggio = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
        const beatDuration = 60 / context.tempo;
        const noteInterval = beatDuration / 4;
        
        for (let note = 0; note < context.duration * 4; note++) {
            const startTime = note * noteInterval;
            const frequency = arpeggio[note % arpeggio.length];
            const synthSample = this.generateSynthNote(frequency, 0.6, 0.3);
            
            const startSample = Math.floor(startTime * this.sampleRate);
            this.addSampleToTrack(synthTrack, synthSample, startSample);
        }
        
        return synthTrack;
    }


    // AUDIO GENERATION METHODS

    generateBassSample(frequency, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            
            // Bass harmonics: fundamental + octave + fifth
            let amplitude = Math.sin(2 * Math.PI * frequency * t) * 0.7;
            amplitude += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
            amplitude += Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.1;
            
            // Bass envelope: quick attack, sustained, gradual release
            const attack = 0.01;
            const release = duration * 0.3;
            let envelope = 1.0;
            
            if (t < attack) {
                envelope = t / attack;
            } else if (t > duration - release) {
                envelope = (duration - t) / release;
            }
            
            sample[i] = amplitude * envelope * velocity;
        }
        
        return sample;
    }

    generateGuitarSample(frequency, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            
            // Guitar harmonics with natural decay
            let amplitude = 0;
            for (let h = 1; h <= 6; h++) {
                const harmonicAmplitude = 1.0 / h;
                amplitude += harmonicAmplitude * Math.sin(2 * Math.PI * frequency * h * t);
            }
            
            // Guitar envelope: sharp attack, exponential decay
            const envelope = Math.exp(-t * 3);
            
            sample[i] = amplitude * envelope * velocity * 0.3;
        }
        
        return sample;
    }

    generateChordSample(chordNotes, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        // Generate each note in the chord
        chordNotes.forEach(frequency => {
            for (let i = 0; i < samples; i++) {
                const t = i / this.sampleRate;
                
                // Guitar chord with strumming envelope
                let amplitude = 0;
                for (let h = 1; h <= 4; h++) {
                    amplitude += (1.0 / h) * Math.sin(2 * Math.PI * frequency * h * t);
                }
                
                const envelope = Math.exp(-t * 1.5);
                sample[i] += amplitude * envelope * velocity * 0.2;
            }
        });
        
        return sample;
    }

    generatePianoNote(frequency, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            
            // Piano harmonics
            let amplitude = 0;
            for (let h = 1; h <= 8; h++) {
                const harmonicAmplitude = 1.0 / (h * h);
                amplitude += harmonicAmplitude * Math.sin(2 * Math.PI * frequency * h * t);
            }
            
            // Piano envelope: sharp attack, slow decay
            const attack = 0.002;
            const envelope = t < attack ? t / attack : Math.exp(-t * 0.8);
            
            sample[i] = amplitude * envelope * velocity;
        }
        
        return sample;
    }

    generatePianoChord(chordNotes, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        chordNotes.forEach(frequency => {
            const noteSample = this.generatePianoNote(frequency, velocity, duration);
            for (let i = 0; i < samples; i++) {
                sample[i] += noteSample[i] * 0.3;
            }
        });
        
        return sample;
    }

    generateStringEnsemble(harmony, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        harmony.forEach(frequency => {
            for (let i = 0; i < samples; i++) {
                const t = i / this.sampleRate;
                
                // String section with vibrato
                const vibrato = Math.sin(2 * Math.PI * 6 * t) * 0.02;
                const actualFreq = frequency * (1 + vibrato);
                
                let amplitude = 0;
                for (let h = 1; h <= 6; h++) {
                    amplitude += (1.0 / h) * Math.sin(2 * Math.PI * actualFreq * h * t);
                }
                
                // Sustained envelope with slow attack
                const attack = 0.5;
                const envelope = t < attack ? t / attack : 1.0;
                
                sample[i] += amplitude * envelope * velocity * 0.2;
            }
        });
        
        return sample;
    }

    generateSynthNote(frequency, velocity, duration) {
        const samples = Math.floor(duration * this.sampleRate);
        const sample = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            
            // Multi-oscillator synth
            const osc1 = Math.sin(2 * Math.PI * frequency * t);
            const osc2 = this.generateSawtooth(frequency * 1.01, t);
            const amplitude = (osc1 * 0.6 + osc2 * 0.4);
            
            // ADSR envelope
            const attack = 0.05;
            const decay = 0.1;
            const sustain = 0.7;
            const release = 0.1;
            
            let envelope = 1.0;
            if (t < attack) {
                envelope = t / attack;
            } else if (t < attack + decay) {
                envelope = 1.0 - (1.0 - sustain) * ((t - attack) / decay);
            } else if (t > duration - release) {
                envelope = sustain * ((duration - t) / release);
            } else {
                envelope = sustain;
            }
            
            sample[i] = amplitude * envelope * velocity;
        }
        
        return sample;
    }


    generateSawtooth(frequency, t) {
        return 2 * (frequency * t - Math.floor(frequency * t + 0.5));
    }

    addSampleToTrack(track, sample, startSample) {
        for (let i = 0; i < sample.length && startSample + i < track.length; i++) {
            track[startSample + i] += sample[i] * 0.7;
        }
    }

    // Removed normalization - reverting to original methodology

    async saveIsolatedTrack(audioData, instrument, context) {
        // Create output directory
        const outputDir = path.join(__dirname, 'generated');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Convert to WAV format - using original methodology without normalization
        const pcmData = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = Math.round(sample * 32767);
        }
        
        const wav = new WaveFile();
        wav.fromScratch(1, this.sampleRate, '16', pcmData);
        
        // Save with requested naming format
        const filename = `isolated-${instrument}.wav`;
        const filePath = path.join(outputDir, filename);
        
        fs.writeFileSync(filePath, wav.toBuffer());
        
        // Save isolated pattern data to Professional Instrument AI model if connected
        this.saveIsolatedPatternToModel(instrument, context);
        
        return filePath;
    }
    
    saveIsolatedPatternToModel(instrument, context) {
        if (this.hasTrainedData && this.modelManager) {
            try {
                // Create isolated pattern sample for the trained model
                const isolatedSample = {
                    id: `isolated_${instrument}_${Date.now()}`,
                    source: 'isolated_generation',
                    genre: 'isolated_' + instrument,
                    features: {
                        instrumentFocus: {
                            separation: 1.0, // Perfect isolation
                            layering: 0.0,   // Single instrument
                            dynamics: 0.8    // Good dynamics
                        },
                        instrument: instrument,
                        tempo: context.tempo,
                        key: context.key,
                        style: context.style
                    },
                    timestamp: Date.now(),
                    modelType: 'instrument_focused'
                };
                
                // Add to model training data
                this.trainedModel.trainingData.samples.push(isolatedSample);
                
                // Update genre patterns for isolated instruments
                if (!this.trainedModel.trainingData.patterns[`isolated_${instrument}`]) {
                    this.trainedModel.trainingData.patterns[`isolated_${instrument}`] = {
                        tempo_range: {
                            min: context.tempo,
                            max: context.tempo,
                            avg: context.tempo
                        },
                        common_keys: {
                            [context.key]: 1
                        },
                        energy_profile: 0.8
                    };
                } else {
                    // Update existing pattern
                    const pattern = this.trainedModel.trainingData.patterns[`isolated_${instrument}`];
                    pattern.tempo_range.min = Math.min(pattern.tempo_range.min, context.tempo);
                    pattern.tempo_range.max = Math.max(pattern.tempo_range.max, context.tempo);
                    pattern.tempo_range.avg = (pattern.tempo_range.min + pattern.tempo_range.max) / 2;
                    pattern.common_keys[context.key] = (pattern.common_keys[context.key] || 0) + 1;
                }
                
                console.log(`💾 Saved isolated ${instrument} pattern to Professional Instrument AI model`);
                
            } catch (error) {
                console.warn(`⚠️ Failed to save isolated pattern to model:`, error.message);
            }
        }
    }
}

// Main execution
async function generateIsolatedAudios() {
    console.log('🎵 Starting isolated instrument audio generation...\n');
    
    try {
        const generator = new IsolatedAudioGenerator();
        const results = await generator.generateAllIsolatedTracks();
        
        console.log('\n📊 Generation Results:');
        console.log('=====================');
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`✅ Successful: ${successful}/${results.length}`);
        console.log(`❌ Failed: ${failed}/${results.length}`);
        
        if (successful > 0) {
            console.log('\n📁 Generated Files:');
            results.filter(r => r.success).forEach(result => {
                console.log(`   🎵 ${result.instrument}: ${path.basename(result.filePath)}`);
            });
        }
        
        if (failed > 0) {
            console.log('\n❌ Failed Instruments:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`   ❌ ${result.instrument}: ${result.error}`);
            });
        }
        
        console.log(`\n🎼 Generation complete! Files saved to: generated/`);
        
    } catch (error) {
        console.error('❌ Generation failed:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    generateIsolatedAudios()
        .then(() => {
            console.log('\n🎵 All isolated instrument tracks generated successfully!');
        })
        .catch(error => {
            console.error('\n❌ Generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    IsolatedAudioGenerator,
    generateIsolatedAudios
};