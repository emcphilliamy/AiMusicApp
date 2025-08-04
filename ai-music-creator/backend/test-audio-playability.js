// Test Audio Playability - Diagnose and fix audio generation issues

const { IsolatedAudioGenerator } = require('./generate-isolated-audio');
const { WaveFile } = require('wavefile');
const fs = require('fs');
const path = require('path');

async function testAudioPlayability() {
    console.log('🧪 Testing Audio Playability and Generation\n');
    
    try {
        const isolatedGenerator = new IsolatedAudioGenerator();
        
        // Generate a simple test audio
        console.log('🎵 Generating test isolated drums...');
        const context = {
            duration: 4,
            tempo: 120,
            key: 'C',
            style: 'isolated',
            instrument: 'drums',
            prompt: 'test isolated drums'
        };
        
        const audioData = await isolatedGenerator.generateInstrumentAudio('drums', context);
        
        console.log(`📊 Audio Data Analysis:`);
        console.log(`   - Length: ${audioData.length} samples`);
        console.log(`   - Duration: ${(audioData.length / 44100).toFixed(2)} seconds`);
        console.log(`   - Data type: ${audioData.constructor.name}`);
        
        // Check for common issues (process in chunks to avoid stack overflow)
        let maxAmplitude = 0;
        let minAmplitude = Infinity;
        let nonZeroSamples = 0;
        let sumSquares = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            const absValue = Math.abs(audioData[i]);
            maxAmplitude = Math.max(maxAmplitude, absValue);
            minAmplitude = Math.min(minAmplitude, absValue);
            if (absValue > 0.001) nonZeroSamples++;
            sumSquares += audioData[i] * audioData[i];
        }
        
        const rmsLevel = Math.sqrt(sumSquares / audioData.length);
        
        console.log(`   - Max amplitude: ${maxAmplitude.toFixed(4)}`);
        console.log(`   - Min amplitude: ${minAmplitude.toFixed(4)}`);
        console.log(`   - RMS level: ${rmsLevel.toFixed(4)}`);
        console.log(`   - Non-zero samples: ${nonZeroSamples}/${audioData.length} (${(nonZeroSamples/audioData.length*100).toFixed(1)}%)`);
        
        // Identify potential issues
        const issues = [];
        if (maxAmplitude === 0) {
            issues.push('⚠️ Audio is completely silent');
        } else if (maxAmplitude < 0.01) {
            issues.push('⚠️ Audio level is very low (may be inaudible)');
        } else if (maxAmplitude > 0.95) {
            issues.push('⚠️ Audio may be clipping');
        }
        
        if (nonZeroSamples < audioData.length * 0.1) {
            issues.push('⚠️ Audio has too much silence');
        }
        
        if (rmsLevel < 0.001) {
            issues.push('⚠️ RMS level is too low');
        }
        
        if (issues.length > 0) {
            console.log('\n❌ Potential Issues Found:');
            issues.forEach(issue => console.log(`   ${issue}`));
            
            // Try to fix the issues
            console.log('\n🔧 Attempting to fix audio...');
            const fixedAudioData = fixAudioIssues(audioData);
            
            // Re-analyze fixed audio
            let fixedMaxAmplitude = 0;
            let fixedSumSquares = 0;
            
            for (let i = 0; i < fixedAudioData.length; i++) {
                fixedMaxAmplitude = Math.max(fixedMaxAmplitude, Math.abs(fixedAudioData[i]));
                fixedSumSquares += fixedAudioData[i] * fixedAudioData[i];
            }
            
            const fixedRmsLevel = Math.sqrt(fixedSumSquares / fixedAudioData.length);
            
            console.log(`   - Fixed max amplitude: ${fixedMaxAmplitude.toFixed(4)}`);
            console.log(`   - Fixed RMS level: ${fixedRmsLevel.toFixed(4)}`);
            
            // Save fixed audio
            const fixedFilePath = await saveFixedAudio(fixedAudioData, 'drums', context);
            console.log(`📁 Fixed audio saved: ${path.basename(fixedFilePath)}`);
            
        } else {
            console.log('\n✅ Audio appears to be correctly generated');
            
            // Save original audio
            const filePath = await isolatedGenerator.saveIsolatedTrack(audioData, 'drums', context);
            console.log(`📁 Audio saved: ${path.basename(filePath)}`);
        }
        
        // Create a simple test tone for comparison
        console.log('\n🎵 Generating test tone for comparison...');
        const testTone = generateTestTone(440, 2); // 440Hz for 2 seconds
        const testFilePath = await saveFixedAudio(testTone, 'test-tone', { duration: 2 });
        console.log(`📁 Test tone saved: ${path.basename(testFilePath)}`);
        
        console.log('\n🎵 Audio playability test complete!');
        console.log('Try playing the generated files to verify they work.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

function fixAudioIssues(audioData) {
    console.log('🔧 Applying audio fixes...');
    
    const fixedData = new Float32Array(audioData.length);
    
    // Find the maximum absolute value for normalization
    let maxAbs = 0;
    for (let i = 0; i < audioData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(audioData[i]));
    }
    
    if (maxAbs === 0) {
        // If completely silent, generate a simple test pattern
        console.log('   - Generating test pattern for silent audio');
        for (let i = 0; i < audioData.length; i++) {
            const t = i / 44100;
            fixedData[i] = Math.sin(2 * Math.PI * 220 * t) * 0.3 * Math.exp(-t * 0.5);
        }
    } else {
        // Normalize to reasonable level (target -6dB = 0.5)
        const targetLevel = 0.5;
        const normalizationFactor = targetLevel / maxAbs;
        
        console.log(`   - Normalizing audio (factor: ${normalizationFactor.toFixed(3)})`);
        
        for (let i = 0; i < audioData.length; i++) {
            fixedData[i] = audioData[i] * normalizationFactor;
        }
        
        // Apply gentle compression to even out levels
        for (let i = 0; i < fixedData.length; i++) {
            const sample = fixedData[i];
            if (Math.abs(sample) > 0.1) {
                // Soft compression for louder parts
                fixedData[i] = sample * 0.8 + Math.sign(sample) * 0.1;
            }
        }
    }
    
    return fixedData;
}

function generateTestTone(frequency, duration) {
    const sampleRate = 44100;
    const samples = duration * sampleRate;
    const testTone = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        // Generate a simple sine wave with envelope
        const envelope = Math.min(1, t * 10) * Math.min(1, (duration - t) * 10); // Fade in/out
        testTone[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }
    
    return testTone;
}

async function saveFixedAudio(audioData, name, context) {
    const outputDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert to WAV format
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        pcmData[i] = Math.round(sample * 32767);
    }
    
    const wav = new WaveFile();
    wav.fromScratch(1, 44100, '16', pcmData);
    
    const filename = `fixed-${name}-${Date.now()}.wav`;
    const filePath = path.join(outputDir, filename);
    
    fs.writeFileSync(filePath, wav.toBuffer());
    
    return filePath;
}

// Run the test
if (require.main === module) {
    testAudioPlayability()
        .then(() => {
            console.log('\n✅ Audio playability test completed!');
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        });
}