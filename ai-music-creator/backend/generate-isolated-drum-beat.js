// Generate Isolated Drum Beat
// Standalone script to generate a realistic reggae drum beat

const { RealisticDrumSynthesis } = require('./realistic-drum-synthesis');
const { WaveFile } = require('wavefile');
const fs = require('fs');
const path = require('path');

async function generateIsolatedDrumBeat() {
    console.log('🥁 Generating isolated reggae drum beat...');
    
    try {
        // Initialize the realistic drum synthesis system
        const drumSynthesis = new RealisticDrumSynthesis();
        
        // Define a classic reggae "One Drop" pattern
        const reggaePattern = {
            kick: [
                // Classic one drop - kick on beat 3 of each bar
                { hit: 0, timing: 1 },      // Beat 1 - silent
                { hit: 0, timing: 1 },      // Beat 2 - silent  
                { hit: 0.9, timing: 1 },    // Beat 3 - strong kick
                { hit: 0, timing: 1 },      // Beat 4 - silent
                { hit: 0, timing: 1 },      // Beat 5 - silent
                { hit: 0, timing: 1 },      // Beat 6 - silent
                { hit: 0.8, timing: 1 },    // Beat 7 - kick
                { hit: 0, timing: 1 },      // Beat 8 - silent
                { hit: 0, timing: 1 },      // Beat 9 - silent
                { hit: 0, timing: 1 },      // Beat 10 - silent
                { hit: 0.9, timing: 1 },    // Beat 11 - strong kick
                { hit: 0, timing: 1 },      // Beat 12 - silent
                { hit: 0, timing: 1 },      // Beat 13 - silent
                { hit: 0, timing: 1 },      // Beat 14 - silent
                { hit: 0.7, timing: 1 },    // Beat 15 - kick
                { hit: 0, timing: 1 }       // Beat 16 - silent
            ],
            
            snare: [
                // Rim shots on beats 2 and 4 (classic reggae backbeat)
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 1
                { hit: 0.8, timing: 1, technique: 'rim_shot' },    // Beat 2 - rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 3
                { hit: 0.9, timing: 1, technique: 'rim_shot' },    // Beat 4 - strong rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 5
                { hit: 0.7, timing: 1, technique: 'rim_shot' },    // Beat 6 - rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 7
                { hit: 0.85, timing: 1, technique: 'rim_shot' },   // Beat 8 - rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 9
                { hit: 0.8, timing: 1, technique: 'rim_shot' },    // Beat 10 - rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 11
                { hit: 0.9, timing: 1, technique: 'rim_shot' },    // Beat 12 - strong rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 13
                { hit: 0.75, timing: 1, technique: 'rim_shot' },   // Beat 14 - rim shot
                { hit: 0, timing: 1, technique: 'normal' },        // Beat 15
                { hit: 0.8, timing: 1, technique: 'rim_shot' }     // Beat 16 - rim shot
            ],
            
            hiHat: [
                // Subtle hi-hat pattern with some open/closed variations
                { hit: 0.4, timing: 1, tone: 'closed' },     // Beat 1
                { hit: 0.3, timing: 1, tone: 'closed' },     // Beat 2
                { hit: 0, timing: 1, tone: 'closed' },       // Beat 3 - silent for kick space
                { hit: 0.5, timing: 1, tone: 'semi_open' },  // Beat 4 - semi open
                { hit: 0.4, timing: 1, tone: 'closed' },     // Beat 5
                { hit: 0.3, timing: 1, tone: 'closed' },     // Beat 6
                { hit: 0, timing: 1, tone: 'closed' },       // Beat 7 - silent for kick space
                { hit: 0.6, timing: 1, tone: 'open' },       // Beat 8 - open
                { hit: 0.4, timing: 1, tone: 'closed' },     // Beat 9
                { hit: 0.3, timing: 1, tone: 'closed' },     // Beat 10
                { hit: 0, timing: 1, tone: 'closed' },       // Beat 11 - silent for kick space
                { hit: 0.5, timing: 1, tone: 'closed' },     // Beat 12
                { hit: 0.4, timing: 1, tone: 'closed' },     // Beat 13
                { hit: 0.35, timing: 1, tone: 'closed' },    // Beat 14
                { hit: 0, timing: 1, tone: 'closed' },       // Beat 15 - silent for kick space
                { hit: 0.7, timing: 1, tone: 'semi_open' }   // Beat 16 - semi open
            ]
        };
        
        // Define the context for synthesis
        const context = {
            duration: 8,      // 8 seconds (2 bars at 75 BPM)
            tempo: 75,        // Classic reggae tempo
            timeSignature: 4, // 4/4 time
            style: 'reggae_one_drop',
            production: 'organic'
        };
        
        console.log(`🎵 Synthesizing ${context.duration}s reggae drum beat at ${context.tempo} BPM...`);
        console.log(`🥁 Pattern: One Drop style with rim shots and subtle hi-hat`);
        
        // Generate the drum beat
        const drumBeat = drumSynthesis.synthesizeRealisticDrums(reggaePattern, context);
        
        console.log(`✅ Generated ${drumBeat.length} samples (${(drumBeat.length / 44100).toFixed(2)}s)`);
        
        // Convert to WAV format
        const wavFile = await convertToWav(drumBeat, 44100);
        
        // Save the drum beat
        const outputPath = await saveDrumBeat(wavFile, {
            name: 'isolated_reggae_drum_beat',
            tempo: context.tempo,
            style: 'one_drop',
            duration: context.duration
        });
        
        console.log(`🎵 Isolated drum beat saved to: ${outputPath}`);
        
        // Generate analysis report
        const analysis = analyzeDrumBeat(drumBeat, context);
        console.log('\n📊 Drum Beat Analysis:');
        console.log(`   - Peak amplitude: ${(analysis.peakAmplitude * 100).toFixed(1)}%`);
        console.log(`   - RMS level: ${(analysis.rmsLevel * 100).toFixed(1)}%`);
        console.log(`   - Dynamic range: ${analysis.dynamicRange.toFixed(1)} dB`);
        console.log(`   - Frequency content: Bass ${(analysis.bassContent * 100).toFixed(1)}%, Mid ${(analysis.midContent * 100).toFixed(1)}%, High ${(analysis.highContent * 100).toFixed(1)}%`);
        console.log(`   - Rhythmic density: ${analysis.rhythmicDensity} hits/second`);
        
        return {
            audioData: drumBeat,
            filePath: outputPath,
            analysis: analysis,
            pattern: reggaePattern,
            context: context
        };
        
    } catch (error) {
        console.error('❌ Failed to generate isolated drum beat:', error);
        throw error;
    }
}

async function convertToWav(audioData, sampleRate) {
    console.log('🔄 Converting to WAV format...');
    
    // Convert Float32Array to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
        // Clamp and convert to 16-bit
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        pcmData[i] = Math.round(sample * 32767);
    }
    
    // Create WAV file
    const wav = new WaveFile();
    wav.fromScratch(1, sampleRate, '16', pcmData);
    
    return wav;
}

async function saveDrumBeat(wavFile, metadata) {
    // Create output directory
    const outputDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `${metadata.name}_${metadata.tempo}bpm_${metadata.style}_${timestamp}.wav`;
    const outputPath = path.join(outputDir, filename);
    
    // Save WAV file
    fs.writeFileSync(outputPath, wavFile.toBuffer());
    
    // Save metadata
    const metadataPath = outputPath.replace('.wav', '_metadata.json');
    const metadataInfo = {
        ...metadata,
        timestamp: new Date().toISOString(),
        filename: filename,
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16,
        generatedBy: 'RealisticDrumSynthesis',
        version: '1.0.0'
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadataInfo, null, 2));
    
    return outputPath;
}

function analyzeDrumBeat(audioData, context) {
    console.log('📊 Analyzing generated drum beat...');
    
    // Calculate basic audio metrics
    const peakAmplitude = Math.max(...audioData.map(Math.abs));
    const rmsLevel = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    const dynamicRange = peakAmplitude > 0 ? 20 * Math.log10(peakAmplitude / rmsLevel) : 0;
    
    // Analyze frequency content (simplified)
    const spectrum = computeSimpleSpectrum(audioData);
    const totalEnergy = spectrum.reduce((sum, bin) => sum + bin, 0);
    
    const bassContent = spectrum.slice(0, Math.floor(spectrum.length * 0.1)).reduce((sum, bin) => sum + bin, 0) / totalEnergy;
    const midContent = spectrum.slice(Math.floor(spectrum.length * 0.1), Math.floor(spectrum.length * 0.5)).reduce((sum, bin) => sum + bin, 0) / totalEnergy;
    const highContent = spectrum.slice(Math.floor(spectrum.length * 0.5)).reduce((sum, bin) => sum + bin, 0) / totalEnergy;
    
    // Detect rhythmic activity
    const onsets = detectOnsets(audioData);
    const rhythmicDensity = onsets.length / context.duration;
    
    return {
        peakAmplitude,
        rmsLevel,
        dynamicRange,
        bassContent: bassContent || 0,
        midContent: midContent || 0,
        highContent: highContent || 0,
        rhythmicDensity: rhythmicDensity,
        onsetCount: onsets.length,
        analysisTime: new Date().toISOString()
    };
}

function computeSimpleSpectrum(audioData) {
    // Simplified spectrum computation for analysis
    const fftSize = Math.min(2048, Math.pow(2, Math.floor(Math.log2(audioData.length))));
    const spectrum = new Array(fftSize / 2).fill(0);
    
    // Simple windowed analysis
    const windowSize = 1024;
    const overlap = 512;
    
    for (let i = 0; i < audioData.length - windowSize; i += overlap) {
        const window = audioData.slice(i, i + windowSize);
        
        // Apply Hanning window
        for (let j = 0; j < window.length; j++) {
            window[j] *= 0.5 * (1 - Math.cos(2 * Math.PI * j / (window.length - 1)));
        }
        
        // Simple FFT approximation
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

function detectOnsets(audioData) {
    // Simple onset detection for analysis
    const onsets = [];
    const windowSize = 1024;
    const hopSize = 512;
    const threshold = 0.1;
    
    let previousEnergy = 0;
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
        const window = audioData.slice(i, i + windowSize);
        const energy = window.reduce((sum, sample) => sum + sample * sample, 0) / windowSize;
        
        // Detect energy increase (onset)
        if (energy > previousEnergy * 1.5 && energy > threshold) {
            onsets.push(i / 44100); // Convert to seconds
        }
        
        previousEnergy = energy * 0.9 + energy * 0.1; // Smooth energy
    }
    
    return onsets;
}

// Additional utility function to generate different drum patterns
function generateAlternativePattern(style) {
    switch (style) {
        case 'steppers':
            return {
                kick: Array(16).fill(0).map((_, i) => ({ hit: i % 2 === 0 ? 0.8 : 0, timing: 1 })),
                snare: Array(16).fill(0).map((_, i) => ({ hit: i % 4 === 2 ? 0.9 : 0, timing: 1, technique: 'rim_shot' })),
                hiHat: Array(16).fill(0).map((_, i) => ({ hit: 0.4, timing: 1, tone: 'closed' }))
            };
            
        case 'rockers':
            return {
                kick: Array(16).fill(0).map((_, i) => ({ hit: [0, 2, 5, 7, 10, 12, 15].includes(i) ? 0.8 : 0, timing: 1 })),
                snare: Array(16).fill(0).map((_, i) => ({ hit: i % 4 === 2 ? 0.9 : 0, timing: 1, technique: 'rim_shot' })),
                hiHat: Array(16).fill(0).map((_, i) => ({ hit: i % 2 === 1 ? 0.5 : 0.3, timing: 1, tone: i % 8 === 7 ? 'open' : 'closed' }))
            };
            
        default:
            return null;
    }
}

// Main execution
if (require.main === module) {
    generateIsolatedDrumBeat()
        .then(result => {
            console.log('\n🎵 Drum beat generation completed successfully!');
            console.log(`📁 File saved to: ${result.filePath}`);
            console.log(`⏱️  Duration: ${result.context.duration}s at ${result.context.tempo} BPM`);
            console.log(`🎭 Style: ${result.context.style}`);
        })
        .catch(error => {
            console.error('\n❌ Drum beat generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    generateIsolatedDrumBeat,
    generateAlternativePattern,
    analyzeDrumBeat
};