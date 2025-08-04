// Iterative Drum Training System
// Implements: Generate → Compare → Improve cycle for realistic drum synthesis

const fs = require('fs');
const path = require('path');
const { DrumIsolationSystem } = require('./drum-isolation-system');
const { RealisticDrumSynthesis } = require('./realistic-drum-synthesis');

class IterativeDrumTrainer {
    constructor() {
        this.drumIsolator = new DrumIsolationSystem();
        this.drumSynthesizer = new RealisticDrumSynthesis();
        this.trainingModels = new Map();
        this.trainingHistory = [];
        this.convergenceThreshold = 0.95; // 95% similarity target
        this.maxIterationsPerSong = 20;
        
        console.log('🔄 IterativeDrumTrainer initialized - Ready for generate→compare→improve cycles');
    }

    async trainOnSongCollection(songCollection, trainingConfig = {}) {
        console.log(`🎓 Starting iterative training on ${songCollection.length} songs...`);
        
        const config = {
            maxIterationsPerSong: trainingConfig.maxIterationsPerSong || this.maxIterationsPerSong,
            convergenceThreshold: trainingConfig.convergenceThreshold || this.convergenceThreshold,
            learningRate: trainingConfig.learningRate || 0.1,
            batchSize: trainingConfig.batchSize || 5,
            ...trainingConfig
        };

        const trainingResults = {
            totalSongs: songCollection.length,
            successfulTraining: 0,
            failedTraining: 0,
            averageIterations: 0,
            convergenceResults: [],
            modelEvolution: [],
            startTime: new Date().toISOString()
        };

        // Process songs in batches for better memory management
        for (let i = 0; i < songCollection.length; i += config.batchSize) {
            const batch = songCollection.slice(i, i + config.batchSize);
            console.log(`📦 Processing batch ${Math.floor(i/config.batchSize) + 1}/${Math.ceil(songCollection.length/config.batchSize)}`);
            
            for (const song of batch) {
                try {
                    const songResult = await this.iterativeTrainOnSong(song, config);
                    trainingResults.convergenceResults.push(songResult);
                    
                    if (songResult.converged) {
                        trainingResults.successfulTraining++;
                    } else {
                        trainingResults.failedTraining++;
                    }
                    
                    console.log(`✅ Song "${song.name}" training ${songResult.converged ? 'converged' : 'completed'} in ${songResult.iterations} iterations`);
                    
                } catch (error) {
                    console.error(`❌ Failed to train on "${song.name}":`, error.message);
                    trainingResults.failedTraining++;
                }
            }
            
            // Save intermediate progress
            await this.saveTrainingProgress(trainingResults);
        }

        // Calculate final statistics
        trainingResults.averageIterations = trainingResults.convergenceResults
            .reduce((sum, result) => sum + result.iterations, 0) / trainingResults.convergenceResults.length;
        
        trainingResults.endTime = new Date().toISOString();
        
        console.log(`🎯 Iterative training complete:`);
        console.log(`   - Success rate: ${(trainingResults.successfulTraining / trainingResults.totalSongs * 100).toFixed(1)}%`);
        console.log(`   - Average iterations: ${trainingResults.averageIterations.toFixed(1)}`);
        console.log(`   - Total training time: ${this.calculateTrainingTime(trainingResults)}`);

        return trainingResults;
    }

    async iterativeTrainOnSong(song, config) {
        console.log(`🔄 Starting iterative training on "${song.name}" by ${song.artist}`);
        
        const trainingSession = {
            songId: song.id,
            songName: song.name,
            artist: song.artist,
            targetPattern: null,
            generatedPatterns: [],
            similarities: [],
            iterations: 0,
            converged: false,
            startTime: Date.now(),
            modelSnapshots: []
        };

        try {
            // Step 1: Extract target drum pattern from original song
            console.log('🎯 Extracting target drum pattern...');
            const targetPattern = await this.extractTargetPattern(song);
            trainingSession.targetPattern = targetPattern;
            
            if (!targetPattern || targetPattern.confidence < 0.3) {
                throw new Error('Failed to extract reliable drum pattern from song');
            }

            // Step 2: Initialize model for this song
            const modelId = `drum_model_${song.id}`;
            await this.initializeModelForSong(modelId, targetPattern);

            // Step 3: Iterative training loop
            let currentSimilarity = 0;
            let bestSimilarity = 0;
            let consecutiveImprovements = 0;
            
            while (trainingSession.iterations < config.maxIterationsPerSong && 
                   currentSimilarity < config.convergenceThreshold) {
                
                trainingSession.iterations++;
                console.log(`🔄 Iteration ${trainingSession.iterations}/${config.maxIterationsPerSong}`);
                
                // Generate drum pattern with current model
                const generatedPattern = await this.generateDrumPattern(modelId, targetPattern.metadata);
                trainingSession.generatedPatterns.push(generatedPattern);
                
                // Compare generated pattern with target
                const similarity = await this.comparePatterns(targetPattern, generatedPattern);
                trainingSession.similarities.push(similarity);
                currentSimilarity = similarity.overallSimilarity;
                
                console.log(`📊 Similarity: ${(currentSimilarity * 100).toFixed(1)}% (target: ${(config.convergenceThreshold * 100).toFixed(1)}%)`);
                
                // Check for improvement
                if (currentSimilarity > bestSimilarity) {
                    bestSimilarity = currentSimilarity;
                    consecutiveImprovements++;
                    
                    // Save model snapshot at best performance
                    trainingSession.modelSnapshots.push({
                        iteration: trainingSession.iterations,
                        similarity: currentSimilarity,
                        modelState: await this.captureModelSnapshot(modelId)
                    });
                } else {
                    consecutiveImprovements = 0;
                }
                
                // Update model based on comparison results
                await this.updateModel(modelId, targetPattern, generatedPattern, similarity, config);
                
                // Early stopping if no improvement for several iterations
                if (consecutiveImprovements === 0 && trainingSession.iterations > 5) {
                    const recentSimilarities = trainingSession.similarities.slice(-3);
                    const stagnating = recentSimilarities.every(s => Math.abs(s.overallSimilarity - currentSimilarity) < 0.01);
                    
                    if (stagnating) {
                        console.log('⏹️ Early stopping: training has stagnated');
                        break;
                    }
                }
            }

            // Check convergence
            trainingSession.converged = currentSimilarity >= config.convergenceThreshold;
            trainingSession.finalSimilarity = currentSimilarity;
            trainingSession.endTime = Date.now();
            trainingSession.trainingDuration = trainingSession.endTime - trainingSession.startTime;

            // Store the final model
            if (trainingSession.converged) {
                await this.storeFinalModel(modelId, trainingSession);
            }

            return trainingSession;

        } catch (error) {
            console.error(`❌ Iterative training failed for "${song.name}":`, error);
            trainingSession.error = error.message;
            trainingSession.endTime = Date.now();
            return trainingSession;
        }
    }

    async extractTargetPattern(song) {
        console.log(`🎯 Extracting target pattern from "${song.name}"`);
        
        try {
            // Use drum isolation system to extract drums from song
            const audioData = await this.loadSongAudio(song);
            const isolationResult = await this.drumIsolator.isolateDrumsFromSong(audioData, song);
            
            if (isolationResult.confidence < 0.3) {
                throw new Error('Low confidence drum isolation');
            }

            // Convert isolated drums to training pattern
            const targetPattern = await this.convertToTrainingPattern(isolationResult);
            
            return {
                audioData: isolationResult.isolatedDrums,
                drumElements: isolationResult.drumElements,
                pattern: targetPattern,
                metadata: {
                    songId: song.id,
                    duration: audioData.length / 44100,
                    tempo: this.estimateTempo(isolationResult.isolatedDrums),
                    timeSignature: this.estimateTimeSignature(isolationResult.isolatedDrums),
                    key: song.key || 'C',
                    confidence: isolationResult.confidence
                },
                confidence: isolationResult.confidence
            };

        } catch (error) {
            console.error(`❌ Failed to extract target pattern from "${song.name}":`, error);
            return null;
        }
    }

    async loadSongAudio(song) {
        // In a real implementation, this would load actual audio data
        // For now, we'll simulate audio data based on song metadata
        const duration = song.duration_ms / 1000 || 30; // 30 seconds default
        const sampleRate = 44100;
        const audioData = new Float32Array(duration * sampleRate);
        
        // Generate some synthetic audio for testing
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] = (Math.random() - 0.5) * 0.1; // Low-level noise
        }
        
        return audioData;
    }

    async convertToTrainingPattern(isolationResult) {
        // Convert isolated drums to structured pattern format
        const pattern = {
            kick: this.extractElementPattern(isolationResult.drumElements.kick),
            snare: this.extractElementPattern(isolationResult.drumElements.snare),
            hihat: this.extractElementPattern(isolationResult.drumElements.hihat),
            other: this.extractElementPattern(isolationResult.drumElements.other)
        };

        return pattern;
    }

    extractElementPattern(elementData) {
        if (!elementData || !elementData.audioData) {
            return { pattern: [], timing: [], velocities: [] };
        }

        // Analyze audio data to extract pattern
        const onsets = this.detectOnsets(elementData.audioData);
        const pattern = this.quantizeOnsets(onsets);
        const velocities = this.extractVelocities(elementData.audioData, onsets);
        const timing = this.analyzeTiming(onsets);

        return {
            pattern,
            timing,
            velocities,
            characteristics: elementData.characteristics
        };
    }

    detectOnsets(audioData) {
        // Simplified onset detection
        const onsets = [];
        const windowSize = 1024;
        const hopSize = 512;
        const threshold = 0.1;

        let previousEnergy = 0;

        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const energy = window.reduce((sum, sample) => sum + sample * sample, 0);
            
            if (energy > previousEnergy * 1.5 && energy > threshold) {
                onsets.push(i / 44100); // Convert to seconds
            }
            
            previousEnergy = energy;
        }

        return onsets;
    }

    quantizeOnsets(onsets) {
        // Quantize onsets to beat grid
        const pattern = new Array(16).fill(0); // 16-step pattern
        const stepDuration = 2.0; // 2 seconds per pattern
        const stepSize = stepDuration / 16;

        onsets.forEach(onset => {
            const step = Math.round(onset / stepSize) % 16;
            pattern[step] = 1;
        });

        return pattern;
    }

    extractVelocities(audioData, onsets) {
        const velocities = [];
        const windowSize = 2205; // 50ms at 44.1kHz

        onsets.forEach(onset => {
            const startSample = Math.floor(onset * 44100);
            const window = audioData.slice(startSample, startSample + windowSize);
            const maxAmplitude = Math.max(...window.map(Math.abs));
            velocities.push(Math.min(1, maxAmplitude * 10)); // Normalize to 0-1
        });

        return velocities;
    }

    analyzeTiming(onsets) {
        // Analyze timing variations
        const timing = [];
        
        for (let i = 1; i < onsets.length; i++) {
            const interval = onsets[i] - onsets[i-1];
            const expectedInterval = 0.125; // 8th note at 120 BPM
            const timing_deviation = (interval - expectedInterval) / expectedInterval;
            timing.push(Math.max(-0.5, Math.min(0.5, timing_deviation)));
        }

        return timing;
    }

    estimateTempo(audioData) {
        // Simple tempo estimation based on onset intervals
        const onsets = this.detectOnsets(audioData);
        
        if (onsets.length < 4) return 75; // Default reggae tempo
        
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }
        
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        return averageInterval > 0 ? Math.round(60 / averageInterval) : 75;
    }

    estimateTimeSignature(audioData) {
        // Simple time signature estimation
        const onsets = this.detectOnsets(audioData);
        
        // Analyze onset groupings to determine time signature
        if (onsets.length < 8) return 4; // Default 4/4
        
        // Look for recurring patterns
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }
        
        // Find most common interval (quantized)
        const quantizedIntervals = intervals.map(interval => Math.round(interval * 4) / 4);
        const intervalCounts = {};
        
        quantizedIntervals.forEach(interval => {
            intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
        });
        
        // If most intervals are quarter notes, likely 4/4
        const mostCommonInterval = Object.keys(intervalCounts)
            .reduce((a, b) => intervalCounts[a] > intervalCounts[b] ? a : b);
        
        return parseFloat(mostCommonInterval) < 0.4 ? 4 : 3; // Simple 4/4 vs 3/4 detection
    }

    async initializeModelForSong(modelId, targetPattern) {
        console.log(`🏗️ Initializing model ${modelId} for song training`);
        
        const model = {
            id: modelId,
            type: 'iterative_drum_model',
            targetPattern: targetPattern,
            parameters: {
                // Drum synthesis parameters that will be adjusted
                kickParams: {
                    fundamentalFreq: 60,
                    harmonics: [60, 120, 180, 240],
                    attackTime: 0.001,
                    decayTime: 0.8,
                    sustainLevel: 0.1,
                    releaseTime: 0.3
                },
                snareParams: {
                    fundamentalFreq: 200,
                    harmonics: [200, 400, 800, 1600, 3200],
                    attackTime: 0.0005,
                    decayTime: 0.2,
                    sustainLevel: 0.05,
                    releaseTime: 0.1,
                    noiseAmount: 0.3
                },
                hihatParams: {
                    fundamentalFreq: 8000,
                    harmonics: [8000, 10000, 12000, 15000],
                    attackTime: 0.0002,
                    decayTime: 0.05,
                    sustainLevel: 0.0,
                    releaseTime: 0.02,
                    noiseAmount: 0.7
                }
            },
            learningState: {
                generation: 0,
                bestSimilarity: 0,
                parameterHistory: [],
                gradients: this.initializeGradients()
            },
            createdAt: new Date().toISOString()
        };

        this.trainingModels.set(modelId, model);
        return model;
    }

    initializeGradients() {
        return {
            kickParams: {
                fundamentalFreq: 0,
                attackTime: 0,
                decayTime: 0,
                sustainLevel: 0,
                releaseTime: 0
            },
            snareParams: {
                fundamentalFreq: 0,
                attackTime: 0,
                decayTime: 0,
                sustainLevel: 0,
                releaseTime: 0,
                noiseAmount: 0
            },
            hihatParams: {
                fundamentalFreq: 0,
                attackTime: 0,
                decayTime: 0,
                releaseTime: 0,
                noiseAmount: 0
            }
        };
    }

    async generateDrumPattern(modelId, metadata) {
        const model = this.trainingModels.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        console.log(`🎵 Generating drum pattern with model ${modelId} (generation ${model.learningState.generation})`);
        
        // Use current model parameters to generate drums
        const pattern = {
            kick: model.targetPattern.pattern.kick.pattern,
            snare: model.targetPattern.pattern.snare.pattern,
            hihat: model.targetPattern.pattern.hihat.pattern
        };

        // Apply current model parameters to realistic drum synthesis
        const context = {
            duration: metadata.duration,
            tempo: metadata.tempo,
            timeSignature: metadata.timeSignature
        };

        // Generate audio using current parameters
        const generatedAudio = await this.synthesizeWithParameters(pattern, model.parameters, context);
        
        model.learningState.generation++;
        
        return {
            pattern,
            audioData: generatedAudio,
            parameters: JSON.parse(JSON.stringify(model.parameters)), // Deep copy
            generation: model.learningState.generation,
            metadata: metadata
        };
    }

    async synthesizeWithParameters(pattern, parameters, context) {
        // Use the realistic drum synthesis with custom parameters
        const drumSynthesis = new RealisticDrumSynthesis();
        
        // Override default parameters with learned parameters
        drumSynthesis.drumSpecs.kick = { ...drumSynthesis.drumSpecs.kick, ...parameters.kickParams };
        drumSynthesis.drumSpecs.snare = { ...drumSynthesis.drumSpecs.snare, ...parameters.snareParams };
        drumSynthesis.drumSpecs.hihat = { ...drumSynthesis.drumSpecs.hihat, ...parameters.hihatParams };
        
        // Convert pattern format for synthesis
        const synthesisPattern = {
            kick: pattern.kick.map((hit, i) => ({ hit, timing: 1 })),
            snare: pattern.snare.map((hit, i) => ({ hit, timing: 1 })),
            hihat: pattern.hihat.map((hit, i) => ({ hit, timing: 1 }))
        };
        
        return drumSynthesis.synthesizeRealisticDrums(synthesisPattern, context);
    }

    async comparePatterns(targetPattern, generatedPattern) {
        console.log('📊 Comparing target and generated patterns...');
        
        const comparison = {
            rhythmicSimilarity: this.compareRhythmicPatterns(targetPattern.pattern, generatedPattern.pattern),
            spectralSimilarity: await this.compareSpectralCharacteristics(targetPattern.audioData, generatedPattern.audioData),
            timbreSimilarity: this.compareTimbreCharacteristics(targetPattern.drumElements, generatedPattern),
            dynamicSimilarity: this.compareDynamicCharacteristics(targetPattern.pattern, generatedPattern.pattern),
            overallSimilarity: 0
        };

        // Calculate weighted overall similarity
        comparison.overallSimilarity = (
            comparison.rhythmicSimilarity * 0.3 +
            comparison.spectralSimilarity * 0.3 +
            comparison.timbreSimilarity * 0.25 +
            comparison.dynamicSimilarity * 0.15
        );

        return comparison;
    }

    compareRhythmicPatterns(targetPattern, generatedPattern) {
        let totalSimilarity = 0;
        let elementCount = 0;

        ['kick', 'snare', 'hihat'].forEach(element => {
            if (targetPattern[element] && generatedPattern[element]) {
                const target = targetPattern[element].pattern || [];
                const generated = generatedPattern[element] || [];
                
                const maxLength = Math.max(target.length, generated.length);
                let matches = 0;
                
                for (let i = 0; i < maxLength; i++) {
                    const targetHit = i < target.length ? target[i] : 0;
                    const generatedHit = i < generated.length ? generated[i] : 0;
                    
                    if (targetHit === generatedHit) {
                        matches++;
                    }
                }
                
                const similarity = matches / maxLength;
                totalSimilarity += similarity;
                elementCount++;
            }
        });

        return elementCount > 0 ? totalSimilarity / elementCount : 0;
    }

    async compareSpectralCharacteristics(targetAudio, generatedAudio) {
        // Compare frequency domain characteristics
        const targetSpectrum = this.computeSpectrum(targetAudio);
        const generatedSpectrum = this.computeSpectrum(generatedAudio);
        
        // Calculate spectral distance
        let spectralDistance = 0;
        const minLength = Math.min(targetSpectrum.length, generatedSpectrum.length);
        
        for (let i = 0; i < minLength; i++) {
            spectralDistance += Math.abs(targetSpectrum[i] - generatedSpectrum[i]);
        }
        
        // Convert distance to similarity (0-1)
        const maxDistance = minLength * 2; // Theoretical maximum
        const similarity = 1 - (spectralDistance / maxDistance);
        
        return Math.max(0, Math.min(1, similarity));
    }

    computeSpectrum(audioData) {
        // Simplified spectrum computation
        const fftSize = Math.min(2048, Math.pow(2, Math.floor(Math.log2(audioData.length))));
        const spectrum = new Array(fftSize / 2);
        
        for (let i = 0; i < spectrum.length; i++) {
            let real = 0, imag = 0;
            
            for (let j = 0; j < fftSize && j < audioData.length; j++) {
                const angle = -2 * Math.PI * i * j / fftSize;
                real += audioData[j] * Math.cos(angle);
                imag += audioData[j] * Math.sin(angle);
            }
            
            spectrum[i] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }

    compareTimbreCharacteristics(targetElements, generatedPattern) {
        // Compare timbral characteristics of drum elements
        let timbreSimilarity = 0;
        let elementCount = 0;

        ['kick', 'snare', 'hihat'].forEach(element => {
            if (targetElements[element] && targetElements[element].characteristics) {
                const targetChar = targetElements[element].characteristics;
                
                // Compare with expected characteristics from generated parameters
                const generatedChar = this.estimateGeneratedCharacteristics(generatedPattern, element);
                
                const similarity = this.compareCharacteristics(targetChar, generatedChar);
                timbreSimilarity += similarity;
                elementCount++;
            }
        });

        return elementCount > 0 ? timbreSimilarity / elementCount : 0;
    }

    estimateGeneratedCharacteristics(generatedPattern, element) {
        // Estimate characteristics based on generated parameters
        const parameters = generatedPattern.parameters;
        
        switch(element) {
            case 'kick':
                return {
                    averageFrequency: parameters.kickParams.fundamentalFreq,
                    punch: 1 - parameters.kickParams.attackTime,
                    sustain: parameters.kickParams.sustainLevel
                };
            case 'snare':
                return {
                    averageFrequency: parameters.snareParams.fundamentalFreq,
                    snap: 1 - parameters.snareParams.attackTime,
                    brightness: parameters.snareParams.noiseAmount
                };
            case 'hihat':
                return {
                    averageFrequency: parameters.hihatParams.fundamentalFreq,
                    crispness: 1 - parameters.hihatParams.attackTime,
                    decay: parameters.hihatParams.releaseTime
                };
            default:
                return {};
        }
    }

    compareCharacteristics(target, generated) {
        const keys = Object.keys(target);
        if (keys.length === 0) return 0;
        
        let similarity = 0;
        
        keys.forEach(key => {
            if (generated[key] !== undefined) {
                const diff = Math.abs(target[key] - generated[key]);
                const maxValue = Math.max(Math.abs(target[key]), Math.abs(generated[key]), 1);
                similarity += 1 - (diff / maxValue);
            }
        });
        
        return similarity / keys.length;
    }

    compareDynamicCharacteristics(targetPattern, generatedPattern) {
        // Compare velocity and timing dynamics
        let dynamicSimilarity = 0;
        let elementCount = 0;

        ['kick', 'snare', 'hihat'].forEach(element => {
            if (targetPattern[element] && targetPattern[element].velocities && generatedPattern[element]) {
                const targetVelocities = targetPattern[element].velocities;
                const generatedPattern_element = generatedPattern[element];
                
                // For generated patterns, estimate velocities from pattern
                const generatedVelocities = generatedPattern_element.map(hit => hit || 0);
                
                const similarity = this.compareVelocityProfiles(targetVelocities, generatedVelocities);
                dynamicSimilarity += similarity;
                elementCount++;
            }
        });

        return elementCount > 0 ? dynamicSimilarity / elementCount : 0;
    }

    compareVelocityProfiles(target, generated) {
        const maxLength = Math.max(target.length, generated.length);
        let similarity = 0;
        
        for (let i = 0; i < maxLength; i++) {
            const targetVel = i < target.length ? target[i] : 0;
            const generatedVel = i < generated.length ? generated[i] : 0;
            
            const diff = Math.abs(targetVel - generatedVel);
            similarity += 1 - diff;
        }
        
        return similarity / maxLength;
    }

    async updateModel(modelId, targetPattern, generatedPattern, similarity, config) {
        const model = this.trainingModels.get(modelId);
        if (!model) return;

        console.log(`🔄 Updating model ${modelId} based on similarity feedback...`);
        
        // Calculate gradients based on similarity differences
        const gradients = this.calculateGradients(targetPattern, generatedPattern, similarity);
        
        // Update parameters using gradient descent
        this.applyGradients(model, gradients, config.learningRate);
        
        // Update learning state
        model.learningState.bestSimilarity = Math.max(model.learningState.bestSimilarity, similarity.overallSimilarity);
        model.learningState.parameterHistory.push({
            generation: model.learningState.generation,
            similarity: similarity.overallSimilarity,
            parameters: JSON.parse(JSON.stringify(model.parameters))
        });
        
        // Store gradients for momentum
        model.learningState.gradients = gradients;
    }

    calculateGradients(targetPattern, generatedPattern, similarity) {
        // Calculate gradients for parameter updates
        const gradients = this.initializeGradients();
        const learningSignal = 1 - similarity.overallSimilarity; // Error signal
        
        // Adjust gradients based on different similarity components
        
        // Rhythmic similarity affects timing parameters
        if (similarity.rhythmicSimilarity < 0.8) {
            gradients.kickParams.attackTime = learningSignal * 0.0001;
            gradients.snareParams.attackTime = learningSignal * 0.0001;
            gradients.hihatParams.attackTime = learningSignal * 0.0001;
        }
        
        // Spectral similarity affects frequency parameters
        if (similarity.spectralSimilarity < 0.8) {
            gradients.kickParams.fundamentalFreq = learningSignal * 5;
            gradients.snareParams.fundamentalFreq = learningSignal * 10;
            gradients.hihatParams.fundamentalFreq = learningSignal * 100;
        }
        
        // Timbre similarity affects envelope parameters
        if (similarity.timbreSimilarity < 0.8) {
            gradients.kickParams.decayTime = learningSignal * 0.1;
            gradients.snareParams.decayTime = learningSignal * 0.02;
            gradients.hihatParams.decayTime = learningSignal * 0.005;
            gradients.snareParams.noiseAmount = learningSignal * 0.05;
            gradients.hihatParams.noiseAmount = learningSignal * 0.05;
        }
        
        // Dynamic similarity affects sustain and release
        if (similarity.dynamicSimilarity < 0.8) {
            gradients.kickParams.sustainLevel = learningSignal * 0.02;
            gradients.kickParams.releaseTime = learningSignal * 0.05;
            gradients.snareParams.sustainLevel = learningSignal * 0.01;
            gradients.snareParams.releaseTime = learningSignal * 0.02;
        }
        
        return gradients;
    }

    applyGradients(model, gradients, learningRate) {
        // Apply gradients to model parameters with constraints
        
        // Update kick parameters
        this.updateParameterWithConstraints(model.parameters.kickParams, 'fundamentalFreq', gradients.kickParams.fundamentalFreq * learningRate, 40, 120);
        this.updateParameterWithConstraints(model.parameters.kickParams, 'attackTime', gradients.kickParams.attackTime * learningRate, 0.0005, 0.01);
        this.updateParameterWithConstraints(model.parameters.kickParams, 'decayTime', gradients.kickParams.decayTime * learningRate, 0.1, 2.0);
        this.updateParameterWithConstraints(model.parameters.kickParams, 'sustainLevel', gradients.kickParams.sustainLevel * learningRate, 0.01, 0.3);
        this.updateParameterWithConstraints(model.parameters.kickParams, 'releaseTime', gradients.kickParams.releaseTime * learningRate, 0.1, 1.0);
        
        // Update snare parameters
        this.updateParameterWithConstraints(model.parameters.snareParams, 'fundamentalFreq', gradients.snareParams.fundamentalFreq * learningRate, 150, 400);
        this.updateParameterWithConstraints(model.parameters.snareParams, 'attackTime', gradients.snareParams.attackTime * learningRate, 0.0001, 0.005);
        this.updateParameterWithConstraints(model.parameters.snareParams, 'decayTime', gradients.snareParams.decayTime * learningRate, 0.05, 0.5);
        this.updateParameterWithConstraints(model.parameters.snareParams, 'sustainLevel', gradients.snareParams.sustainLevel * learningRate, 0.01, 0.2);
        this.updateParameterWithConstraints(model.parameters.snareParams, 'releaseTime', gradients.snareParams.releaseTime * learningRate, 0.02, 0.3);
        this.updateParameterWithConstraints(model.parameters.snareParams, 'noiseAmount', gradients.snareParams.noiseAmount * learningRate, 0.1, 0.8);
        
        // Update hi-hat parameters
        this.updateParameterWithConstraints(model.parameters.hihatParams, 'fundamentalFreq', gradients.hihatParams.fundamentalFreq * learningRate, 6000, 16000);
        this.updateParameterWithConstraints(model.parameters.hihatParams, 'attackTime', gradients.hihatParams.attackTime * learningRate, 0.0001, 0.002);
        this.updateParameterWithConstraints(model.parameters.hihatParams, 'decayTime', gradients.hihatParams.decayTime * learningRate, 0.01, 0.2);
        this.updateParameterWithConstraints(model.parameters.hihatParams, 'releaseTime', gradients.hihatParams.releaseTime * learningRate, 0.005, 0.1);
        this.updateParameterWithConstraints(model.parameters.hihatParams, 'noiseAmount', gradients.hihatParams.noiseAmount * learningRate, 0.3, 0.9);
    }

    updateParameterWithConstraints(params, paramName, gradient, min, max) {
        if (params[paramName] !== undefined) {
            params[paramName] = Math.max(min, Math.min(max, params[paramName] + gradient));
        }
    }

    async captureModelSnapshot(modelId) {
        const model = this.trainingModels.get(modelId);
        if (!model) return null;

        return {
            parameters: JSON.parse(JSON.stringify(model.parameters)),
            learningState: {
                generation: model.learningState.generation,
                bestSimilarity: model.learningState.bestSimilarity
            },
            timestamp: new Date().toISOString()
        };
    }

    async storeFinalModel(modelId, trainingSession) {
        const model = this.trainingModels.get(modelId);
        if (!model) return;

        console.log(`💾 Storing final converged model ${modelId}`);
        
        const finalModel = {
            id: modelId,
            songId: trainingSession.songId,
            songName: trainingSession.songName,
            artist: trainingSession.artist,
            finalParameters: model.parameters,
            trainingResults: {
                iterations: trainingSession.iterations,
                finalSimilarity: trainingSession.finalSimilarity,
                converged: trainingSession.converged,
                trainingDuration: trainingSession.trainingDuration
            },
            modelSnapshots: trainingSession.modelSnapshots,
            createdAt: model.createdAt,
            finalizedAt: new Date().toISOString()
        };

        // Store to training history
        this.trainingHistory.push(finalModel);
        
        // Save to file system
        await this.saveModel(finalModel);
        
        return finalModel;
    }

    async saveModel(model) {
        try {
            const modelsDir = path.join(__dirname, 'trained_models');
            if (!fs.existsSync(modelsDir)) {
                fs.mkdirSync(modelsDir, { recursive: true });
            }
            
            const modelPath = path.join(modelsDir, `${model.id}.json`);
            fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
            
            console.log(`✅ Model saved to ${modelPath}`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save model:', error);
            return false;
        }
    }

    async saveTrainingProgress(trainingResults) {
        try {
            const progressPath = path.join(__dirname, 'training_progress.json');
            fs.writeFileSync(progressPath, JSON.stringify(trainingResults, null, 2));
            
            console.log('📊 Training progress saved');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save training progress:', error);
            return false;
        }
    }

    calculateTrainingTime(trainingResults) {
        if (!trainingResults.startTime || !trainingResults.endTime) {
            return 'Unknown';
        }
        
        const startTime = new Date(trainingResults.startTime);
        const endTime = new Date(trainingResults.endTime);
        const durationMs = endTime - startTime;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Utility methods for getting training statistics
    getTrainingStats() {
        return {
            totalModels: this.trainingModels.size,
            completedTraining: this.trainingHistory.length,
            averageConvergenceRate: this.calculateAverageConvergenceRate(),
            bestModel: this.getBestModel(),
            recentTraining: this.getRecentTrainingActivity()
        };
    }

    calculateAverageConvergenceRate() {
        if (this.trainingHistory.length === 0) return 0;
        
        const convergedModels = this.trainingHistory.filter(model => 
            model.trainingResults.converged
        );
        
        return (convergedModels.length / this.trainingHistory.length) * 100;
    }

    getBestModel() {
        if (this.trainingHistory.length === 0) return null;
        
        return this.trainingHistory.reduce((best, current) => 
            current.trainingResults.finalSimilarity > (best?.trainingResults.finalSimilarity || 0) 
                ? current : best
        );
    }

    getRecentTrainingActivity() {
        const recent = this.trainingHistory.slice(-5);
        return recent.map(model => ({
            songName: model.songName,
            artist: model.artist,
            similarity: model.trainingResults.finalSimilarity,
            iterations: model.trainingResults.iterations,
            converged: model.trainingResults.converged
        }));
    }
}

module.exports = {
    IterativeDrumTrainer
};