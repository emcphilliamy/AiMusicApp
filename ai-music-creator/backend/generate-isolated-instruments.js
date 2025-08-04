// Generate Isolated Instruments
// Test script to demonstrate universal instrument isolation and synthesis

const { UniversalInstrumentSynthesis, InstrumentIsolationEngine } = require('./universal-instrument-synthesis');
const { WaveFile } = require('wavefile');
const fs = require('fs');
const path = require('path');

class IsolatedInstrumentGenerator {
    constructor() {
        this.universalSynthesis = new UniversalInstrumentSynthesis();
        this.isolationEngine = new InstrumentIsolationEngine();
        
        // Define instrument list from the codebase
        this.instruments = [
            'drums', 'bass', 'lead_guitar', 'rhythm_guitar', 
            'piano', 'strings', 'synthesizer', 'vocals'
        ];
        
        console.log('🎼 IsolatedInstrumentGenerator initialized');
        console.log(`🎵 Supporting ${this.instruments.length} instruments with full isolation and synthesis`);
    }

    async generateAllInstruments(options = {}) {
        console.log('🎵 Generating isolated tracks for all instruments...');
        
        const context = {
            duration: options.duration || 8,
            tempo: options.tempo || 120,
            key: options.key || 'C',
            style: options.style || 'modern',
            genre: options.genre || 'pop'
        };

        const results = {};
        
        // Generate each instrument type with appropriate patterns
        for (const instrument of this.instruments) {
            try {
                console.log(`\n🎹 Processing ${instrument}...`);
                
                const pattern = this.generateInstrumentPattern(instrument, context);
                const isolatedTrack = await this.generateIsolatedInstrument(instrument, pattern, context);
                
                results[instrument] = isolatedTrack;
                
            } catch (error) {
                console.error(`❌ Failed to generate ${instrument}:`, error.message);
                results[instrument] = { error: error.message };
            }
        }
        
        // Generate summary report
        const summary = this.generateSummaryReport(results, context);
        console.log('\n📊 Generation Summary:');
        console.log(summary);
        
        return { results, summary, context };
    }

    async generateIsolatedInstrument(instrument, pattern, context) {
        console.log(`🔧 Synthesizing isolated ${instrument}...`);
        
        try {
            // Generate using universal synthesis system
            const audioData = await this.universalSynthesis.synthesizeInstrument(instrument, pattern, context);
            
            // Convert to WAV
            const wavFile = await this.convertToWav(audioData, 44100);
            
            // Save file
            const filePath = await this.saveInstrumentTrack(wavFile, instrument, context);
            
            // Analyze the generated track
            const analysis = this.analyzeInstrumentTrack(audioData, instrument, context);
            
            console.log(`✅ ${instrument} track generated: ${filePath}`);
            
            return {
                instrument,
                audioData,
                filePath,
                analysis,
                pattern,
                success: true
            };
            
        } catch (error) {
            console.error(`❌ Failed to generate ${instrument}:`, error.message);
            return {
                instrument,
                error: error.message,
                success: false
            };
        }
    }

    generateInstrumentPattern(instrument, context) {
        const { tempo, duration, key, style } = context;
        const beatsPerSecond = tempo / 60;
        const totalBeats = Math.floor(duration * beatsPerSecond);
        
        console.log(`🎼 Generating ${instrument} pattern: ${totalBeats} beats at ${tempo} BPM`);
        
        switch (instrument) {
            case 'drums':
                return this.generateDrumPattern(totalBeats, style);
            
            case 'bass':
                return this.generateBassPattern(totalBeats, key, style);
            
            case 'lead_guitar':
                return this.generateLeadGuitarPattern(totalBeats, key, style);
            
            case 'rhythm_guitar':
                return this.generateRhythmGuitarPattern(totalBeats, key, style);
            
            case 'piano':
                return this.generatePianoPattern(totalBeats, key, style);
            
            case 'strings':
                return this.generateStringsPattern(totalBeats, key, style);
            
            case 'synthesizer':
                return this.generateSynthPattern(totalBeats, key, style);
            
            case 'vocals':
                return this.generateVocalPattern(totalBeats, key, style);
            
            default:
                throw new Error(`Unknown instrument: ${instrument}`);
        }
    }

    generateDrumPattern(totalBeats, style) {
        // Reuse the realistic drum pattern from the drum system
        return {
            kick: this.generateDrumElement(totalBeats, [0, 2, 8, 10], 0.8),
            snare: this.generateDrumElement(totalBeats, [4, 12], 0.9, 'rim_shot'),
            hiHat: this.generateDrumElement(totalBeats, 'all', 0.4, 'closed')
        };
    }

    generateDrumElement(totalBeats, pattern, velocity, technique = 'normal') {
        const element = [];
        
        for (let beat = 0; beat < totalBeats; beat++) {
            if (pattern === 'all') {
                element.push({ hit: velocity * (0.8 + Math.random() * 0.4), timing: 1, technique });
            } else if (pattern.includes(beat % 16)) {
                element.push({ hit: velocity, timing: 1, technique });
            } else {
                element.push({ hit: 0, timing: 1, technique });
            }
        }
        
        return element;
    }

    generateBassPattern(totalBeats, key, style) {
        const bassNotes = this.getScaleNotes(key, 'bass'); // Lower octave
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 4) {
            // Simple root-fifth bass line
            const root = bassNotes[0];
            const fifth = bassNotes[4] || bassNotes[0];
            
            pattern.push(
                { frequency: root, velocity: 0.8, startTime: beat * 0.5, duration: 1.5, technique: 'fingered' },
                { frequency: fifth, velocity: 0.6, startTime: (beat + 2) * 0.5, duration: 1.0, technique: 'fingered' }
            );
        }
        
        return pattern;
    }

    generateLeadGuitarPattern(totalBeats, key, style) {
        const melodyNotes = this.getScaleNotes(key, 'lead'); // Higher octave
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 2) {
            const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
            pattern.push({
                frequency: note,
                velocity: 0.7,
                startTime: beat * 0.5,
                duration: 0.8,
                technique: Math.random() > 0.7 ? 'bending' : 'normal'
            });
        }
        
        return pattern;
    }

    generateRhythmGuitarPattern(totalBeats, key, style) {
        const chordNotes = this.getChordProgression(key);
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 8) {
            const chord = chordNotes[Math.floor(beat / 8) % chordNotes.length];
            pattern.push({
                notes: chord.map(freq => ({ frequency: freq, velocity: 0.6 })),
                startTime: beat * 0.5,
                duration: 3.5,
                technique: 'strumming'
            });
        }
        
        return pattern;
    }

    generatePianoPattern(totalBeats, key, style) {
        const chordNotes = this.getChordProgression(key);
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 4) {
            const chord = chordNotes[Math.floor(beat / 4) % chordNotes.length];
            pattern.push({
                notes: chord.map(freq => ({ 
                    frequency: freq, 
                    velocity: 0.5 + Math.random() * 0.3,
                    duration: 3.5
                })),
                startTime: beat * 0.5,
                duration: 3.5,
                pedals: { sustain: true }
            });
        }
        
        return pattern;
    }

    generateStringsPattern(totalBeats, key, style) {
        const chordNotes = this.getChordProgression(key);
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 8) {
            const chord = chordNotes[Math.floor(beat / 8) % chordNotes.length];
            pattern.push({
                notes: chord.map(freq => ({ 
                    frequency: freq, 
                    velocity: 0.4 + Math.random() * 0.2 
                })),
                startTime: beat * 0.5,
                duration: 7.5,
                technique: 'arco'
            });
        }
        
        return pattern;
    }

    generateSynthPattern(totalBeats, key, style) {
        const synthNotes = this.getScaleNotes(key, 'synth');
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 1) {
            if (Math.random() > 0.6) { // Sparse pattern
                const note = synthNotes[Math.floor(Math.random() * synthNotes.length)];
                pattern.push({
                    frequency: note,
                    velocity: 0.6,
                    startTime: beat * 0.5,
                    duration: 0.75,
                    patch: 'lead'
                });
            }
        }
        
        return pattern;
    }

    generateVocalPattern(totalBeats, key, style) {
        // Simplified vocal pattern (placeholder)
        const vocalNotes = this.getScaleNotes(key, 'vocal');
        const pattern = [];
        
        for (let beat = 0; beat < totalBeats; beat += 4) {
            const note = vocalNotes[Math.floor(Math.random() * 5)]; // Stay in comfortable range
            pattern.push({
                frequency: note,
                velocity: 0.7,
                startTime: beat * 0.5,
                duration: 3.0,
                vowel: 'ah'
            });
        }
        
        return pattern;
    }

    // UTILITY METHODS FOR MUSICAL CONTENT

    getScaleNotes(key, instrument) {
        // C major scale frequencies for different instruments
        const cMajorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C4-B4
        
        switch (instrument) {
            case 'bass':
                return cMajorScale.map(freq => freq / 4); // Two octaves down
            case 'lead':
                return cMajorScale.map(freq => freq * 2); // One octave up
            case 'vocal':
                return cMajorScale; // Middle octave
            case 'synth':
                return cMajorScale.map(freq => freq * 1.5); // Mixed octaves
            default:
                return cMajorScale;
        }
    }

    getChordProgression(key) {
        // Simple I-V-vi-IV progression in C major
        return [
            [261.63, 329.63, 392.00], // C major (C-E-G)
            [392.00, 493.88, 587.33], // G major (G-B-D)
            [220.00, 261.63, 329.63], // A minor (A-C-E)
            [349.23, 220.00, 261.63]  // F major (F-A-C)
        ];
    }

    // FILE PROCESSING METHODS

    async convertToWav(audioData, sampleRate) {
        console.log('🔄 Converting to WAV format...');
        
        // Convert Float32Array to 16-bit PCM
        const pcmData = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = Math.round(sample * 32767);
        }
        
        const wav = new WaveFile();
        wav.fromScratch(1, sampleRate, '16', pcmData);
        
        return wav;
    }

    async saveInstrumentTrack(wavFile, instrument, context) {
        const outputDir = path.join(__dirname, 'generated', 'isolated_instruments');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const filename = `isolated_${instrument}_${context.tempo}bpm_${context.style}_${timestamp}.wav`;
        const filePath = path.join(outputDir, filename);
        
        fs.writeFileSync(filePath, wavFile.toBuffer());
        
        // Save metadata
        const metadata = {
            instrument,
            ...context,
            timestamp: new Date().toISOString(),
            filename,
            sampleRate: 44100,
            channels: 1,
            bitDepth: 16,
            generatedBy: 'UniversalInstrumentSynthesis',
            version: '1.0.0'
        };
        
        const metadataPath = filePath.replace('.wav', '_metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        return filePath;
    }

    analyzeInstrumentTrack(audioData, instrument, context) {
        console.log(`📊 Analyzing ${instrument} track...`);
        
        const peakAmplitude = Math.max(...audioData.map(Math.abs));
        const rmsLevel = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
        const dynamicRange = peakAmplitude > 0 ? 20 * Math.log10(peakAmplitude / rmsLevel) : 0;
        
        // Simplified frequency analysis
        const spectrum = this.computeSimpleSpectrum(audioData);
        const spectralCentroid = this.calculateSpectralCentroid(spectrum);
        
        return {
            instrument,
            peakAmplitude: Math.round(peakAmplitude * 1000) / 1000,
            rmsLevel: Math.round(rmsLevel * 1000) / 1000,
            dynamicRange: Math.round(dynamicRange * 10) / 10,
            spectralCentroid: Math.round(spectralCentroid),
            duration: context.duration,
            analysisTime: new Date().toISOString()
        };
    }

    computeSimpleSpectrum(audioData) {
        // Simplified FFT approximation
        const windowSize = 1024;
        const spectrum = new Array(windowSize / 2).fill(0);
        
        for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
            const window = audioData.slice(i, i + windowSize);
            
            for (let k = 0; k < spectrum.length; k++) {
                let real = 0, imag = 0;
                
                for (let n = 0; n < window.length; n++) {
                    const angle = -2 * Math.PI * k * n / window.length;
                    real += window[n] * Math.cos(angle);
                    imag += window[n] * Math.sin(angle);
                }
                
                spectrum[k] += Math.sqrt(real * real + imag * imag);
            }
        }
        
        return spectrum;
    }

    calculateSpectralCentroid(spectrum) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            const frequency = (i * 44100) / (spectrum.length * 2);
            weightedSum += frequency * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    generateSummaryReport(results, context) {
        const successful = Object.values(results).filter(r => r.success).length;
        const failed = Object.values(results).filter(r => !r.success).length;
        
        let report = `\n📋 ISOLATED INSTRUMENT GENERATION REPORT\n`;
        report += `=====================================\n`;
        report += `Context: ${context.duration}s at ${context.tempo} BPM (${context.style} ${context.genre})\n`;
        report += `Total Instruments: ${this.instruments.length}\n`;
        report += `✅ Successful: ${successful}\n`;
        report += `❌ Failed: ${failed}\n`;
        report += `Success Rate: ${Math.round((successful / this.instruments.length) * 100)}%\n\n`;
        
        report += `📊 Individual Results:\n`;
        
        for (const instrument of this.instruments) {
            const result = results[instrument];
            if (result && result.success) {
                const analysis = result.analysis;
                report += `  🎵 ${instrument.padEnd(15)}: ✅ Peak: ${(analysis.peakAmplitude * 100).toFixed(1)}%, `;
                report += `RMS: ${(analysis.rmsLevel * 100).toFixed(1)}%, `;
                report += `Centroid: ${analysis.spectralCentroid}Hz\n`;
            } else {
                const error = result?.error || 'Unknown error';
                report += `  ❌ ${instrument.padEnd(15)}: ${error}\n`;
            }
        }
        
        if (successful > 0) {
            report += `\n📁 Generated files saved to: generated/isolated_instruments/\n`;
            report += `🎼 Each instrument includes metadata and analysis\n`;
        }
        
        return report;
    }
}

// Main execution function
async function generateAllIsolatedInstruments(options = {}) {
    console.log('🎼 Starting Universal Isolated Instrument Generation...\n');
    
    try {
        const generator = new IsolatedInstrumentGenerator();
        
        const generationOptions = {
            duration: options.duration || 8,
            tempo: options.tempo || 120,
            key: options.key || 'C',
            style: options.style || 'modern',
            genre: options.genre || 'pop',
            ...options
        };
        
        console.log(`🎵 Configuration:`);
        console.log(`   Duration: ${generationOptions.duration} seconds`);
        console.log(`   Tempo: ${generationOptions.tempo} BPM`);
        console.log(`   Key: ${generationOptions.key} major`);
        console.log(`   Style: ${generationOptions.style}`);
        console.log(`   Genre: ${generationOptions.genre}`);
        
        const results = await generator.generateAllInstruments(generationOptions);
        
        console.log('\n🎵 Universal instrument generation completed!');
        return results;
        
    } catch (error) {
        console.error('\n❌ Universal instrument generation failed:', error.message);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    generateAllIsolatedInstruments({
        duration: 10,
        tempo: 100,
        style: 'reggae',
        genre: 'world'
    })
    .then(results => {
        console.log('\n🎵 All instrument isolation and generation completed successfully!');
        console.log(`📊 Results available for ${Object.keys(results.results).length} instruments`);
    })
    .catch(error => {
        console.error('\n❌ Generation failed:', error.message);
        process.exit(1);
    });
}

module.exports = {
    IsolatedInstrumentGenerator,
    generateAllIsolatedInstruments
};