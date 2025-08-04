// Realistic Drum Synthesis System
// Based on the realistic_instrument_synthesis_plan.md
// Implements Phase 1: Immediate Fixes with Physical Modeling

class RealisticDrumSynthesis {
    constructor() {
        this.sampleRate = 44100;
        this.drumSpecs = this.initializeDrumSpecifications();
        this.spectralAnalyzer = new SpectralDrumAnalyzer();
        console.log('🥁 RealisticDrumSynthesis initialized - Advanced physical modeling enabled');
    }

    initializeDrumSpecifications() {
        return {
            kick: {
                fundamentalFreq: 60,    // Hz
                harmonics: [60, 120, 180, 240],
                attackTime: 0.001,      // 1ms sharp attack
                decayTime: 0.8,         // 800ms decay
                sustainLevel: 0.1,      // Low sustain
                releaseTime: 0.3,       // 300ms release
                resonance: {
                    bodyFreq: 55,       // Body resonance
                    dampingFactor: 0.05
                },
                velocity: {
                    min: 0.3,
                    max: 1.0,
                    curve: 'logarithmic'
                }
            },
            snare: {
                fundamentalFreq: 200,   // Hz
                harmonics: [200, 400, 800, 1600, 3200],
                attackTime: 0.0005,     // 0.5ms very sharp
                decayTime: 0.2,         // 200ms quick decay
                sustainLevel: 0.05,     // Very low sustain
                releaseTime: 0.1,       // 100ms release
                snareWires: {
                    enabled: true,
                    buzzFreq: 120,      // Wire buzz frequency
                    noiseAmount: 0.3,   // 30% noise content
                    highPassCutoff: 200 // Hz
                },
                rimshot: {
                    fundamentalFreq: 400,
                    harmonics: [400, 800, 1200, 2400],
                    attackAmplification: 2.0
                }
            },
            hihat: {
                fundamentalFreq: 8000,  // High frequency content
                harmonics: [8000, 10000, 12000, 15000],
                attackTime: 0.0002,     // 0.2ms extremely sharp
                decayTime: 0.05,        // 50ms very quick
                sustainLevel: 0.0,      // No sustain
                releaseTime: 0.02,      // 20ms quick release
                closed: {
                    noiseAmount: 0.7,   // 70% noise
                    dampingFactor: 0.8
                },
                open: {
                    noiseAmount: 0.5,   // 50% noise
                    dampingFactor: 0.2,
                    extendedDecay: 0.5  // 500ms for open
                }
            }
        };
    }

    // Main synthesis method - replaces the current reggae drum generation
    synthesizeRealisticDrums(pattern, context) {
        console.log('🎵 Synthesizing realistic drums using advanced physical modeling...');
        
        const duration = context.duration || 30; // seconds
        const drumTrack = new Float32Array(duration * this.sampleRate);
        
        // Process each drum element in the pattern
        if (pattern.kick) {
            const kickSamples = this.synthesizePhysicalKick(pattern.kick, context);
            this.mixIntoTrack(drumTrack, kickSamples, pattern.kick);
        }
        
        if (pattern.snare) {
            const snareSamples = this.synthesizePhysicalSnare(pattern.snare, context);
            this.mixIntoTrack(drumTrack, snareSamples, pattern.snare);
        }
        
        if (pattern.hiHat) {
            const hihatSamples = this.synthesizePhysicalHihat(pattern.hiHat, context);
            this.mixIntoTrack(drumTrack, hihatSamples, pattern.hiHat);
        }
        
        console.log(`✅ Realistic drum track synthesized: ${drumTrack.length} samples`);
        return drumTrack;
    }

    synthesizePhysicalKick(kickPattern, context) {
        const specs = this.drumSpecs.kick;
        const tempo = context.tempo || 75;
        const beatDuration = 60 / tempo; // seconds per beat
        
        console.log('🥁 Synthesizing physical kick drum with membrane modeling...');
        
        const kickTrack = new Float32Array(context.duration * this.sampleRate);
        
        // Process each kick hit in the pattern
        kickPattern.forEach((hit, beatIndex) => {
            if (hit && hit.hit > 0) {
                const startTime = beatIndex * beatDuration;
                const velocity = this.normalizeVelocity(hit.hit || hit, specs.velocity);
                
                // Generate individual kick sample
                const kickSample = this.generateKickSample(velocity, specs);
                
                // Place in track at correct timing
                const startSample = Math.floor(startTime * this.sampleRate);
                this.addSampleToTrack(kickTrack, kickSample, startSample);
            }
        });
        
        return kickTrack;
    }

    generateKickSample(velocity, specs) {
        const duration = specs.attackTime + specs.decayTime + specs.releaseTime;
        const samples = Math.floor(duration * this.sampleRate);
        const kickSample = new Float32Array(samples);
        
        // Generate complex harmonic content instead of simple sine wave
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            let amplitude = 0;
            
            // ADSR Envelope
            const envelope = this.calculateADSREnvelope(t, specs);
            
            // Generate harmonic content
            for (let h = 0; h < specs.harmonics.length; h++) {
                const freq = specs.harmonics[h];
                const harmonicAmplitude = 1.0 / (h + 1); // Natural harmonic decay
                
                // Add phase randomization for realism
                const phase = Math.random() * 0.1;
                amplitude += harmonicAmplitude * Math.sin(2 * Math.PI * freq * t + phase);
            }
            
            // Apply body resonance
            const resonance = this.calculateBodyResonance(t, specs.resonance);
            
            kickSample[i] = amplitude * envelope * velocity * resonance;
        }
        
        // Apply low-pass filtering for natural drum character
        return this.applyLowPassFilter(kickSample, 150); // 150Hz cutoff for kick
    }

    synthesizePhysicalSnare(snarePattern, context) {
        const specs = this.drumSpecs.snare;
        const tempo = context.tempo || 75;
        const beatDuration = 60 / tempo;
        
        console.log('🥁 Synthesizing physical snare with wire modeling...');
        
        const snareTrack = new Float32Array(context.duration * this.sampleRate);
        
        snarePattern.forEach((hit, beatIndex) => {
            if (hit && hit.hit > 0) {
                const startTime = beatIndex * beatDuration;
                const velocity = this.normalizeVelocity(hit.hit || hit, specs.velocity);
                const isRimshot = hit.technique === 'rim_shot';
                
                // Generate snare sample with wire response
                const snareSample = this.generateSnareSample(velocity, specs, isRimshot);
                
                const startSample = Math.floor(startTime * this.sampleRate);
                this.addSampleToTrack(snareTrack, snareSample, startSample);
            }
        });
        
        return snareTrack;
    }

    generateSnareSample(velocity, specs, isRimshot = false) {
        const duration = specs.attackTime + specs.decayTime + specs.releaseTime;
        const samples = Math.floor(duration * this.sampleRate);
        const snareSample = new Float32Array(samples);
        
        // Choose appropriate harmonic structure
        const harmonics = isRimshot ? specs.rimshot.harmonics : specs.harmonics;
        const fundamentalFreq = isRimshot ? specs.rimshot.fundamentalFreq : specs.fundamentalFreq;
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            let amplitude = 0;
            
            // ADSR Envelope - sharper for rimshot
            const envelope = this.calculateADSREnvelope(t, specs) * 
                             (isRimshot ? specs.rimshot.attackAmplification : 1.0);
            
            // Generate harmonic content
            for (let h = 0; h < harmonics.length; h++) {
                const freq = harmonics[h];
                const harmonicAmplitude = 1.0 / Math.sqrt(h + 1); // Modified decay for snare brightness
                
                amplitude += harmonicAmplitude * Math.sin(2 * Math.PI * freq * t);
            }
            
            snareSample[i] = amplitude * envelope * velocity;
        }
        
        // Add snare wire response
        const snareWithWires = this.addSnareWireResponse(snareSample, velocity, specs);
        
        return snareWithWires;
    }

    addSnareWireResponse(drumSound, velocity, specs) {
        if (!specs.snareWires.enabled) return drumSound;
        
        const result = new Float32Array(drumSound.length);
        
        // Generate wire noise
        const wireNoise = this.generateSnareWireNoise(drumSound.length, velocity, specs.snareWires);
        
        // High-pass filter the noise (snare wires respond to high frequencies)
        const filteredNoise = this.applyHighPassFilter(wireNoise, specs.snareWires.highPassCutoff);
        
        // Mix drum sound with wire response
        for (let i = 0; i < drumSound.length; i++) {
            result[i] = drumSound[i] + filteredNoise[i] * specs.snareWires.noiseAmount;
        }
        
        return result;
    }

    generateSnareWireNoise(length, velocity, wireSpecs) {
        const noise = new Float32Array(length);
        const decayRate = 0.0001; // Wire response decay
        
        for (let i = 0; i < length; i++) {
            const t = i / this.sampleRate;
            
            // Exponential decay envelope for wire response
            const envelope = Math.exp(-t / decayRate) * velocity;
            
            // Generate filtered noise with wire buzz characteristics
            const randomNoise = (Math.random() - 0.5) * 2;
            const buzzComponent = Math.sin(2 * Math.PI * wireSpecs.buzzFreq * t) * 0.3;
            
            noise[i] = (randomNoise + buzzComponent) * envelope;
        }
        
        return noise;
    }

    synthesizePhysicalHihat(hihatPattern, context) {
        const specs = this.drumSpecs.hihat;
        const tempo = context.tempo || 75;
        const beatDuration = 60 / tempo;
        
        console.log('🥁 Synthesizing physical hi-hat with metallic modeling...');
        
        const hihatTrack = new Float32Array(context.duration * this.sampleRate);
        
        hihatPattern.forEach((hit, beatIndex) => {
            if (hit && hit.hit > 0) {
                const startTime = beatIndex * beatDuration;
                const velocity = this.normalizeVelocity(hit.hit || hit, specs.velocity);
                const isOpen = hit.tone === 'semi_open' || hit.tone === 'open';
                
                const hihatSample = this.generateHihatSample(velocity, specs, isOpen);
                
                const startSample = Math.floor(startTime * this.sampleRate);
                this.addSampleToTrack(hihatTrack, hihatSample, startSample);
            }
        });
        
        return hihatTrack;
    }

    generateHihatSample(velocity, specs, isOpen = false) {
        const effectiveDecay = isOpen ? specs.open.extendedDecay : specs.decayTime;
        const duration = specs.attackTime + effectiveDecay + specs.releaseTime;
        const samples = Math.floor(duration * this.sampleRate);
        const hihatSample = new Float32Array(samples);
        
        const noiseAmount = isOpen ? specs.open.noiseAmount : specs.closed.noiseAmount;
        const dampingFactor = isOpen ? specs.open.dampingFactor : specs.closed.dampingFactor;
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            let amplitude = 0;
            
            // Sharp attack envelope for hi-hat
            const envelope = this.calculatePercussiveEnvelope(t, specs, effectiveDecay) * dampingFactor;
            
            // Generate high-frequency metallic content
            for (let h = 0; h < specs.harmonics.length; h++) {
                const freq = specs.harmonics[h];
                const harmonicAmplitude = 1.0 / (h + 1);
                
                amplitude += harmonicAmplitude * Math.sin(2 * Math.PI * freq * t);
            }
            
            // Add metallic noise component
            const noise = (Math.random() - 0.5) * noiseAmount;
            
            hihatSample[i] = (amplitude + noise) * envelope * velocity;
        }
        
        // Apply high-pass filtering for crisp hi-hat character
        return this.applyHighPassFilter(hihatSample, 8000); // 8kHz cutoff for hi-hat brightness
    }

    // ADSR Envelope calculation for realistic percussion dynamics
    calculateADSREnvelope(time, specs) {
        const { attackTime, decayTime, sustainLevel, releaseTime } = specs;
        
        if (time < attackTime) {
            // Attack phase - exponential rise
            return (time / attackTime);
        } else if (time < attackTime + decayTime) {
            // Decay phase - exponential decay to sustain
            const decayProgress = (time - attackTime) / decayTime;
            return 1.0 - (1.0 - sustainLevel) * decayProgress;
        } else if (time < attackTime + decayTime + 0.1) { // Brief sustain
            // Sustain phase
            return sustainLevel;
        } else {
            // Release phase - exponential decay to zero
            const releaseStart = attackTime + decayTime + 0.1;
            const releaseProgress = (time - releaseStart) / releaseTime;
            
            if (releaseProgress >= 1.0) return 0;
            return sustainLevel * (1.0 - releaseProgress);
        }
    }

    calculatePercussiveEnvelope(time, specs, effectiveDecay) {
        // Specialized envelope for percussive instruments like hi-hat
        if (time < specs.attackTime) {
            return Math.pow(time / specs.attackTime, 0.3); // Sharp attack curve
        } else {
            const decayProgress = (time - specs.attackTime) / effectiveDecay;
            if (decayProgress >= 1.0) return 0;
            
            return Math.exp(-decayProgress * 5); // Exponential decay
        }
    }

    calculateBodyResonance(time, resonanceSpecs) {
        const { bodyFreq, dampingFactor } = resonanceSpecs;
        
        // Simulate drum body resonance with damped oscillation
        const resonanceEnvelope = Math.exp(-time * dampingFactor);
        const resonanceOscillation = Math.sin(2 * Math.PI * bodyFreq * time);
        
        return 1.0 + (resonanceOscillation * resonanceEnvelope * 0.1); // 10% resonance contribution
    }

    normalizeVelocity(rawVelocity, velocitySpecs) {
        // Convert raw velocity (0-1) to realistic drum velocity curve
        // Handle case where velocitySpecs might not be properly defined
        if (!velocitySpecs || typeof velocitySpecs !== 'object') {
            // Return normalized velocity with default range
            return Math.max(0.3, Math.min(1.0, rawVelocity));
        }
        
        const { min = 0.3, max = 1.0, curve = 'linear' } = velocitySpecs;
        
        if (curve === 'logarithmic') {
            // Logarithmic velocity curve for natural drum response
            return min + (max - min) * Math.pow(rawVelocity, 0.5);
        }
        
        return min + (max - min) * rawVelocity;
    }

    // Audio processing utilities
    applyLowPassFilter(audioBuffer, cutoffFreq) {
        // Simple single-pole low-pass filter
        const rc = 1.0 / (2 * Math.PI * cutoffFreq);
        const dt = 1.0 / this.sampleRate;
        const alpha = dt / (rc + dt);
        
        const filtered = new Float32Array(audioBuffer.length);
        filtered[0] = audioBuffer[0];
        
        for (let i = 1; i < audioBuffer.length; i++) {
            filtered[i] = filtered[i-1] + alpha * (audioBuffer[i] - filtered[i-1]);
        }
        
        return filtered;
    }

    applyHighPassFilter(audioBuffer, cutoffFreq) {
        // Simple single-pole high-pass filter
        const rc = 1.0 / (2 * Math.PI * cutoffFreq);
        const dt = 1.0 / this.sampleRate;
        const alpha = rc / (rc + dt);
        
        const filtered = new Float32Array(audioBuffer.length);
        filtered[0] = audioBuffer[0];
        
        for (let i = 1; i < audioBuffer.length; i++) {
            filtered[i] = alpha * (filtered[i-1] + audioBuffer[i] - audioBuffer[i-1]);
        }
        
        return filtered;
    }

    mixIntoTrack(mainTrack, sampleTrack, pattern) {
        // Mix sample track into main track with proper timing
        for (let i = 0; i < Math.min(mainTrack.length, sampleTrack.length); i++) {
            mainTrack[i] += sampleTrack[i] * 0.8; // Mix at 80% to prevent clipping
        }
    }

    addSampleToTrack(track, sample, startSample) {
        for (let i = 0; i < sample.length && startSample + i < track.length; i++) {
            track[startSample + i] += sample[i] * 0.7; // Mix at 70% to prevent clipping
        }
    }
}

// Spectral Analysis Support Class
class SpectralDrumAnalyzer {
    constructor() {
        this.fftSize = 2048;
        this.sampleRate = 44100;
        console.log('🔍 SpectralDrumAnalyzer initialized for frequency analysis');
    }

    analyzeTransient(audioBuffer) {
        // Analyze first 10ms for transient characteristics
        const transientSamples = Math.floor(0.01 * this.sampleRate);
        const transientBuffer = audioBuffer.slice(0, transientSamples);
        
        return {
            attackTime: this.detectAttackTime(transientBuffer),
            spectralCentroid: this.calculateSpectralCentroid(transientBuffer),
            peakAmplitude: Math.max(...transientBuffer.map(Math.abs))
        };
    }

    detectAttackTime(buffer) {
        const threshold = 0.1; // 10% of max amplitude
        const maxAmplitude = Math.max(...buffer.map(Math.abs));
        const attackThreshold = maxAmplitude * threshold;
        
        for (let i = 0; i < buffer.length; i++) {
            if (Math.abs(buffer[i]) > attackThreshold) {
                return i / this.sampleRate;
            }
        }
        
        return 0.001; // Default 1ms if not detected
    }

    calculateSpectralCentroid(buffer) {
        // Simplified spectral centroid calculation
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < buffer.length; i++) {
            const magnitude = Math.abs(buffer[i]);
            const frequency = (i / buffer.length) * (this.sampleRate / 2);
            
            weightedSum += frequency * magnitude;
            magnitudeSum += magnitude;
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }
}

module.exports = {
    RealisticDrumSynthesis,
    SpectralDrumAnalyzer
};