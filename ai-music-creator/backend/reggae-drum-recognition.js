// Reggae Drum Recognition System
// Analyzes and recognizes reggae drum patterns and characteristics

const fs = require('fs');
const path = require('path');

class ReggaeDrumRecognitionSystem {
    constructor() {
        this.reggaePatternDatabase = this.initializeReggaePatternDatabase();
        this.recognitionModels = this.initializeRecognitionModels();
        this.genreClassifier = new ReggaeGenreClassifier();
        this.patternAnalyzer = new ReggaePatternAnalyzer();
        this.recognitionHistory = [];
        
        console.log('🎯 ReggaeDrumRecognitionSystem initialized - Ready to analyze reggae drum characteristics');
    }

    initializeReggaePatternDatabase() {
        return {
            // Classic reggae patterns
            classic: {
                'one_drop': {
                    pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    characteristics: ['beat_3_emphasis', 'laid_back_feel', 'minimal_kick'],
                    tempo: [70, 90],
                    confidence: 0.95
                },
                'steppers': {
                    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                    characteristics: ['four_on_floor', 'driving_rhythm', 'steady_kick'],
                    tempo: [75, 95],
                    confidence: 0.90
                },
                'rockers': {
                    pattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
                    characteristics: ['syncopated', 'rock_influence', 'strong_backbeat'],
                    tempo: [80, 120],
                    confidence: 0.85
                }
            },
            
            // Modern reggae variations
            modern: {
                'digital_reggae': {
                    pattern: [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0],
                    characteristics: ['electronic_influence', 'tighter_timing', 'programmed_feel'],
                    tempo: [85, 110],
                    confidence: 0.80
                },
                'roots_revival': {
                    pattern: [0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
                    characteristics: ['traditional_elements', 'organic_feel', 'conscious_lyrics'],
                    tempo: [70, 85],
                    confidence: 0.88
                }
            },
            
            // Reggae fusion styles
            fusion: {
                'reggae_pop': {
                    pattern: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
                    characteristics: ['pop_influence', 'commercial_appeal', 'accessible_rhythm'],
                    tempo: [90, 120],
                    confidence: 0.75
                },
                'reggae_dancehall': {
                    pattern: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
                    characteristics: ['dancehall_influence', 'aggressive_rhythm', 'digital_production'],
                    tempo: [95, 140],
                    confidence: 0.82
                }
            }
        };
    }

    initializeRecognitionModels() {
        return {
            tempoRecognition: new TempoRecognitionModel(),
            rhythmRecognition: new RhythmPatternRecognitionModel(),
            timbreRecognition: new TimbreRecognitionModel(),
            structureRecognition: new StructureRecognitionModel()
        };
    }

    async analyzeReggaeDrumCharacteristics(audioData, metadata = {}) {
        console.log(`🎵 Analyzing reggae drum characteristics...`);
        
        const analysis = {
            songId: metadata.id || 'unknown',
            songName: metadata.name || 'Unknown',
            artist: metadata.artist || 'Unknown',
            reggaeClassification: null,
            patternAnalysis: null,
            rhythmicCharacteristics: null,
            culturalAuthenticity: null,
            confidence: 0,
            timestamp: new Date().toISOString()
        };

        try {
            // Step 1: Classify as reggae and determine subgenre
            analysis.reggaeClassification = await this.classifyReggaeStyle(audioData, metadata);
            
            // Step 2: Analyze rhythmic patterns
            analysis.patternAnalysis = await this.analyzeRhythmicPatterns(audioData);
            
            // Step 3: Extract reggae-specific characteristics
            analysis.rhythmicCharacteristics = await this.extractReggaeCharacteristics(audioData);
            
            // Step 4: Assess cultural authenticity
            analysis.culturalAuthenticity = await this.assessCulturalAuthenticity(analysis);
            
            // Step 5: Calculate overall confidence
            analysis.confidence = this.calculateOverallConfidence(analysis);
            
            // Store in recognition history
            this.recognitionHistory.push(analysis);
            
            console.log(`✅ Reggae analysis complete - Style: ${analysis.reggaeClassification?.primaryStyle}, Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Reggae drum analysis failed:', error);
            analysis.error = error.message;
            return analysis;
        }
    }

    async classifyReggaeStyle(audioData, metadata) {
        console.log('🎭 Classifying reggae style and subgenre...');
        
        const classification = {
            isReggae: false,
            confidence: 0,
            primaryStyle: null,
            subStyles: [],
            genreScore: 0,
            reasons: []
        };

        // Use genre classifier to determine reggae likelihood
        const genreResults = await this.genreClassifier.classifyGenre(audioData, metadata);
        classification.isReggae = genreResults.isReggae;
        classification.genreScore = genreResults.reggaeScore;
        
        if (!classification.isReggae) {
            classification.reasons.push('Not classified as reggae music');
            return classification;
        }

        // Analyze tempo for reggae classification
        const tempo = this.extractTempo(audioData);
        console.log(`🎯 Detected tempo: ${tempo} BPM`);
        
        // Check tempo ranges for different reggae styles
        const tempoClassification = this.classifyByTempo(tempo);
        classification.reasons.push(`Tempo ${tempo} BPM matches ${tempoClassification.join(', ')}`);
        
        // Analyze rhythmic patterns against database
        const patternMatches = await this.matchReggaePatterns(audioData);
        
        if (patternMatches.length > 0) {
            const bestMatch = patternMatches[0];
            classification.primaryStyle = bestMatch.style;
            classification.confidence = bestMatch.confidence;
            classification.subStyles = patternMatches.slice(1, 4).map(match => match.style);
            classification.reasons.push(`Best pattern match: ${bestMatch.style} (${(bestMatch.confidence * 100).toFixed(1)}%)`);
        }

        return classification;
    }

    extractTempo(audioData) {
        // Extract tempo using onset detection and autocorrelation
        const onsets = this.detectOnsets(audioData);
        
        if (onsets.length < 4) {
            return 75; // Default reggae tempo
        }

        // Calculate inter-onset intervals
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }

        // Find most common interval (beat period)
        const intervalCounts = {};
        intervals.forEach(interval => {
            const quantized = Math.round(interval * 10) / 10; // Quantize to 0.1s
            intervalCounts[quantized] = (intervalCounts[quantized] || 0) + 1;
        });

        const mostCommonInterval = Object.keys(intervalCounts)
            .reduce((a, b) => intervalCounts[a] > intervalCounts[b] ? a : b);

        const beatPeriod = parseFloat(mostCommonInterval);
        return beatPeriod > 0 ? Math.round(60 / beatPeriod) : 75;
    }

    detectOnsets(audioData) {
        // Simplified onset detection for tempo analysis
        const onsets = [];
        const windowSize = 1024;
        const hopSize = 512;
        const threshold = 0.15;

        let previousEnergy = 0;

        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const energy = window.reduce((sum, sample) => sum + sample * sample, 0) / windowSize;
            
            // Detect energy increase (onset)
            if (energy > previousEnergy * 1.8 && energy > threshold) {
                onsets.push(i / 44100); // Convert to seconds
            }
            
            previousEnergy = energy * 0.9 + energy * 0.1; // Smooth energy
        }

        return onsets;
    }

    classifyByTempo(tempo) {
        const matches = [];
        
        // Check all pattern categories for tempo matches
        Object.keys(this.reggaePatternDatabase).forEach(category => {
            Object.keys(this.reggaePatternDatabase[category]).forEach(style => {
                const pattern = this.reggaePatternDatabase[category][style];
                const [minTempo, maxTempo] = pattern.tempo;
                
                if (tempo >= minTempo && tempo <= maxTempo) {
                    matches.push(style);
                }
            });
        });

        return matches.length > 0 ? matches : ['unknown_reggae'];
    }

    async matchReggaePatterns(audioData) {
        console.log('🔍 Matching against reggae pattern database...');
        
        const extractedPattern = await this.extractRhythmicPattern(audioData);
        const matches = [];

        // Compare against all known reggae patterns
        Object.keys(this.reggaePatternDatabase).forEach(category => {
            Object.keys(this.reggaePatternDatabase[category]).forEach(styleName => {
                const referencePattern = this.reggaePatternDatabase[category][styleName];
                const similarity = this.calculatePatternSimilarity(extractedPattern, referencePattern.pattern);
                
                if (similarity > 0.5) { // Minimum similarity threshold
                    matches.push({
                        style: styleName,
                        category: category,
                        similarity: similarity,
                        confidence: similarity * referencePattern.confidence,
                        characteristics: referencePattern.characteristics
                    });
                }
            });
        });

        // Sort by confidence
        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    async extractRhythmicPattern(audioData) {
        // Extract 16-step rhythmic pattern from audio
        const onsets = this.detectOnsets(audioData);
        const pattern = new Array(16).fill(0);
        
        if (onsets.length === 0) return pattern;

        // Estimate pattern duration (4 beats in reggae)
        const estimatedPatternDuration = this.estimatePatternDuration(onsets);
        const stepDuration = estimatedPatternDuration / 16;

        // Map onsets to pattern steps
        onsets.forEach(onset => {
            const step = Math.round(onset / stepDuration) % 16;
            pattern[step] = 1;
        });

        return pattern;
    }

    estimatePatternDuration(onsets) {
        if (onsets.length < 4) return 2.0; // Default 2 seconds

        // Look for repeating pattern in onsets
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }

        // Find median interval as beat duration
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        
        // 4 beats = 1 pattern
        return medianInterval * 4;
    }

    calculatePatternSimilarity(pattern1, pattern2) {
        const maxLength = Math.max(pattern1.length, pattern2.length);
        let matches = 0;

        for (let i = 0; i < maxLength; i++) {
            const p1 = i < pattern1.length ? pattern1[i] : 0;
            const p2 = i < pattern2.length ? pattern2[i] : 0;
            
            if (p1 === p2) matches++;
        }

        return matches / maxLength;
    }

    async analyzeRhythmicPatterns(audioData) {
        console.log('🎼 Analyzing rhythmic patterns in detail...');
        
        return this.patternAnalyzer.analyzePatterns(audioData);
    }

    async extractReggaeCharacteristics(audioData) {
        console.log('🇯🇲 Extracting reggae-specific characteristics...');
        
        const characteristics = {
            laidBackFeel: this.analyzeLaidBackFeel(audioData),
            skankEmphasis: this.analyzeSkankEmphasis(audioData),
            bassLineInteraction: this.analyzeBassLineInteraction(audioData),
            rimShotPresence: this.analyzeRimShotPresence(audioData),
            hiHatPattern: this.analyzeHiHatPattern(audioData),
            polyrhythmicElements: this.analyzePolyrhythmicElements(audioData),
            culturalMarkers: this.identifyCulturalMarkers(audioData)
        };

        return characteristics;
    }

    analyzeLaidBackFeel(audioData) {
        // Analyze timing variations that create the "laid back" reggae feel
        const onsets = this.detectOnsets(audioData);
        const timingDeviations = this.calculateTimingDeviations(onsets);
        
        const laidBackScore = timingDeviations.reduce((sum, deviation) => {
            return sum + (deviation > 0 ? deviation : 0); // Positive deviations = behind the beat
        }, 0) / timingDeviations.length;

        return {
            score: Math.min(1, laidBackScore * 10),
            averageDeviation: laidBackScore,
            consistency: this.calculateTimingConsistency(timingDeviations),
            confidence: laidBackScore > 0.02 ? 0.8 : 0.3
        };
    }

    calculateTimingDeviations(onsets) {
        if (onsets.length < 4) return [0];

        const deviations = [];
        const expectedBeatInterval = this.calculateAverageBeatInterval(onsets);

        for (let i = 1; i < onsets.length; i++) {
            const actualInterval = onsets[i] - onsets[i-1];
            const deviation = actualInterval - expectedBeatInterval;
            deviations.push(deviation);
        }

        return deviations;
    }

    calculateAverageBeatInterval(onsets) {
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }
        return intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    calculateTimingConsistency(deviations) {
        const variance = deviations.reduce((sum, dev) => sum + dev * dev, 0) / deviations.length;
        return 1 / (1 + variance * 100); // Convert to 0-1 consistency score
    }

    analyzeSkankEmphasis(audioData) {
        // Analyze emphasis on off-beats (skank)
        const spectrum = this.computeSpectrum(audioData);
        const midRangeEnergy = this.calculateBandEnergy(spectrum, 200, 2000); // Guitar skank range
        
        const skankPattern = this.detectSkankPattern(audioData);
        
        return {
            midRangeEmphasis: midRangeEnergy,
            offBeatEmphasis: skankPattern.offBeatRatio,
            clarity: skankPattern.clarity,
            confidence: skankPattern.confidence
        };
    }

    detectSkankPattern(audioData) {
        const onsets = this.detectOnsets(audioData);
        const beatPositions = this.quantizeToBeats(onsets);
        
        // Count on-beat vs off-beat emphasis
        let onBeatCount = 0;
        let offBeatCount = 0;
        
        beatPositions.forEach(position => {
            const beatFraction = position % 1;
            if (beatFraction < 0.25 || beatFraction > 0.75) {
                onBeatCount++;
            } else {
                offBeatCount++;
            }
        });
        
        const total = onBeatCount + offBeatCount;
        const offBeatRatio = total > 0 ? offBeatCount / total : 0;
        
        return {
            offBeatRatio,
            clarity: this.calculateSkankClarity(beatPositions),
            confidence: offBeatRatio > 0.6 ? 0.8 : 0.4
        };
    }

    quantizeToBeats(onsets) {
        if (onsets.length < 2) return [];
        
        const beatInterval = this.calculateAverageBeatInterval(onsets);
        return onsets.map(onset => onset / beatInterval);
    }

    calculateSkankClarity(beatPositions) {
        // Measure how clearly defined the off-beat emphasis is
        const offBeatPositions = beatPositions.filter(pos => {
            const beatFraction = pos % 1;
            return beatFraction > 0.25 && beatFraction < 0.75;
        });
        
        if (offBeatPositions.length === 0) return 0;
        
        // Calculate variance in off-beat positioning
        const averageOffBeatPosition = offBeatPositions.reduce((a, b) => a + (b % 1), 0) / offBeatPositions.length;
        const variance = offBeatPositions.reduce((sum, pos) => {
            const diff = (pos % 1) - averageOffBeatPosition;
            return sum + diff * diff;
        }, 0) / offBeatPositions.length;
        
        return 1 / (1 + variance * 100); // Convert to clarity score
    }

    analyzeBassLineInteraction(audioData) {
        // Analyze how drums interact with bass line
        const lowFreqSpectrum = this.analyzeLowFrequencies(audioData);
        const bassKickInteraction = this.detectBassKickInteraction(lowFreqSpectrum);
        
        return {
            bassPresence: lowFreqSpectrum.bassPresence,
            rhythmicLocking: bassKickInteraction.rhythmicLocking,
            frequencySeparation: bassKickInteraction.separation,
            confidence: bassKickInteraction.confidence
        };
    }

    analyzeLowFrequencies(audioData) {
        const spectrum = this.computeSpectrum(audioData);
        const bassRange = this.calculateBandEnergy(spectrum, 40, 120);
        const kickRange = this.calculateBandEnergy(spectrum, 50, 100);
        const totalEnergy = spectrum.reduce((sum, mag) => sum + mag, 0);
        
        return {
            bassPresence: bassRange / totalEnergy,
            kickPresence: kickRange / totalEnergy,
            separation: Math.abs(bassRange - kickRange) / (bassRange + kickRange)
        };
    }

    detectBassKickInteraction(lowFreqData) {
        // Simplified bass-kick interaction analysis
        return {
            rhythmicLocking: 0.7, // Placeholder
            separation: lowFreqData.separation,
            confidence: lowFreqData.bassPresence > 0.1 ? 0.7 : 0.3
        };
    }

    analyzeRimShotPresence(audioData) {
        // Analyze presence and characteristics of rim shots
        const rimShotFreqRange = [1500, 4000]; // Typical rim shot frequencies
        const spectrum = this.computeSpectrum(audioData);
        const rimShotEnergy = this.calculateBandEnergy(spectrum, rimShotFreqRange[0], rimShotFreqRange[1]);
        
        const rimShotOnsets = this.detectRimShotOnsets(audioData);
        
        return {
            presence: rimShotEnergy,
            frequency: rimShotOnsets.length,
            sharpness: this.calculateRimShotSharpness(rimShotOnsets, audioData),
            placement: this.analyzeRimShotPlacement(rimShotOnsets),
            confidence: rimShotEnergy > 0.05 ? 0.8 : 0.2
        };
    }

    detectRimShotOnsets(audioData) {
        // Detect sharp transients characteristic of rim shots
        const onsets = [];
        const windowSize = 512;
        const hopSize = 256;
        const threshold = 0.2;

        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const sharpness = this.calculateTransientSharpness(window);
            
            if (sharpness > threshold) {
                onsets.push({
                    time: i / 44100,
                    sharpness: sharpness
                });
            }
        }

        return onsets;
    }

    calculateTransientSharpness(window) {
        // Calculate sharpness of transient attack
        const attackSamples = Math.min(64, window.length); // First ~1.5ms
        let maxSlope = 0;
        
        for (let i = 1; i < attackSamples; i++) {
            const slope = Math.abs(window[i] - window[i-1]);
            maxSlope = Math.max(maxSlope, slope);
        }
        
        return maxSlope;
    }

    calculateRimShotSharpness(rimShotOnsets, audioData) {
        if (rimShotOnsets.length === 0) return 0;
        
        const averageSharpness = rimShotOnsets.reduce((sum, onset) => sum + onset.sharpness, 0) / rimShotOnsets.length;
        return Math.min(1, averageSharpness * 5); // Normalize
    }

    analyzeRimShotPlacement(rimShotOnsets) {
        // Analyze typical placement of rim shots in reggae (often on beat 3)
        if (rimShotOnsets.length === 0) return { onBeat3: 0, regularity: 0 };
        
        const beatPositions = rimShotOnsets.map(onset => {
            // Estimate beat position (simplified)
            const estimatedBeatLength = 0.8; // ~75 BPM
            return (onset.time / estimatedBeatLength) % 4;
        });
        
        const beat3Hits = beatPositions.filter(pos => pos >= 2 && pos < 3).length;
        const onBeat3Ratio = beat3Hits / rimShotOnsets.length;
        
        return {
            onBeat3: onBeat3Ratio,
            regularity: this.calculateRhythmicRegularity(beatPositions)
        };
    }

    calculateRhythmicRegularity(positions) {
        if (positions.length < 2) return 0;
        
        // Calculate variance in positions
        const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
        const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / positions.length;
        
        return 1 / (1 + variance);
    }

    analyzeHiHatPattern(audioData) {
        // Analyze hi-hat patterns typical in reggae
        const hiHatFreqRange = [8000, 15000];
        const spectrum = this.computeSpectrum(audioData);
        const hiHatEnergy = this.calculateBandEnergy(spectrum, hiHatFreqRange[0], hiHatFreqRange[1]);
        
        const hiHatOnsets = this.detectHiHatOnsets(audioData);
        const pattern = this.analyzeHiHatRhythmPattern(hiHatOnsets);
        
        return {
            presence: hiHatEnergy,
            density: hiHatOnsets.length,
            openClosedRatio: pattern.openClosedRatio,
            rhythmicPattern: pattern.pattern,
            confidence: hiHatEnergy > 0.02 ? 0.7 : 0.2
        };
    }

    detectHiHatOnsets(audioData) {
        // Detect hi-hat onsets using high-frequency analysis
        const onsets = [];
        const windowSize = 512;
        const hopSize = 256;

        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const hiHatEnergy = this.calculateBandEnergy(window, 8000, 15000);
            
            if (hiHatEnergy > 0.01) { // Threshold for hi-hat detection
                onsets.push({
                    time: i / 44100,
                    energy: hiHatEnergy,
                    type: hiHatEnergy > 0.05 ? 'open' : 'closed'
                });
            }
        }

        return onsets;
    }

    analyzeHiHatRhythmPattern(hiHatOnsets) {
        if (hiHatOnsets.length === 0) {
            return { openClosedRatio: 0, pattern: [] };
        }

        const openHits = hiHatOnsets.filter(onset => onset.type === 'open').length;
        const closedHits = hiHatOnsets.filter(onset => onset.type === 'closed').length;
        const openClosedRatio = openHits / (openHits + closedHits);

        // Extract rhythmic pattern
        const pattern = this.extractHiHatPattern(hiHatOnsets);

        return {
            openClosedRatio,
            pattern
        };
    }

    extractHiHatPattern(hiHatOnsets) {
        // Convert hi-hat onsets to 16-step pattern
        const pattern = new Array(16).fill(0);
        const patternDuration = 2.0; // 2 seconds
        const stepDuration = patternDuration / 16;

        hiHatOnsets.forEach(onset => {
            const step = Math.floor(onset.time / stepDuration) % 16;
            pattern[step] = onset.type === 'open' ? 2 : 1; // 2 = open, 1 = closed
        });

        return pattern;
    }

    analyzePolyrhythmicElements(audioData) {
        // Analyze polyrhythmic elements typical in reggae
        const multipleRhythms = this.detectMultipleRhythms(audioData);
        
        return {
            complexity: multipleRhythms.complexity,
            layerCount: multipleRhythms.layers,
            crossRhythms: multipleRhythms.crossRhythms,
            confidence: multipleRhythms.confidence
        };
    }

    detectMultipleRhythms(audioData) {
        // Simplified polyrhythm detection
        const onsets = this.detectOnsets(audioData);
        const rhythmPatterns = this.extractMultiplePatterns(onsets);
        
        return {
            complexity: Math.min(1, rhythmPatterns.length / 3),
            layers: rhythmPatterns.length,
            crossRhythms: this.detectCrossRhythms(rhythmPatterns),
            confidence: rhythmPatterns.length > 1 ? 0.6 : 0.3
        };
    }

    extractMultiplePatterns(onsets) {
        // Extract patterns at different time scales
        const patterns = [];
        const scales = [0.25, 0.5, 1.0, 2.0]; // Different rhythmic scales
        
        scales.forEach(scale => {
            const pattern = this.extractPatternAtScale(onsets, scale);
            if (pattern.strength > 0.3) {
                patterns.push(pattern);
            }
        });
        
        return patterns;
    }

    extractPatternAtScale(onsets, scale) {
        // Extract rhythmic pattern at specific time scale
        const gridSize = Math.floor(scale * 16);
        const pattern = new Array(gridSize).fill(0);
        const stepDuration = scale / gridSize;
        
        onsets.forEach(onset => {
            const step = Math.floor(onset / stepDuration) % gridSize;
            pattern[step]++;
        });
        
        const maxHits = Math.max(...pattern);
        const strength = maxHits / onsets.length;
        
        return { pattern, scale, strength };
    }

    detectCrossRhythms(patterns) {
        // Detect cross-rhythmic relationships between patterns
        let crossRhythms = 0;
        
        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                const relationship = this.analyzeCrossRhythmicRelationship(patterns[i], patterns[j]);
                if (relationship > 0.5) {
                    crossRhythms++;
                }
            }
        }
        
        return crossRhythms;
    }

    analyzeCrossRhythmicRelationship(pattern1, pattern2) {
        // Analyze relationship between two rhythmic patterns
        const ratio = pattern1.scale / pattern2.scale;
        
        // Common cross-rhythmic ratios in reggae
        const commonRatios = [2/3, 3/2, 3/4, 4/3];
        
        for (const commonRatio of commonRatios) {
            if (Math.abs(ratio - commonRatio) < 0.1) {
                return 0.8; // Strong cross-rhythmic relationship
            }
        }
        
        return 0; // No clear cross-rhythmic relationship
    }

    identifyCulturalMarkers(audioData) {
        // Identify cultural markers specific to Jamaican reggae
        const markers = {
            traditionalDrumSounds: this.detectTraditionalDrumSounds(audioData),
            productionStyle: this.analyzeProductionStyle(audioData),
            rhythmicPhrasiology: this.analyzeRhythmicPhrasiology(audioData),
            authenticityScore: 0
        };
        
        markers.authenticityScore = this.calculateAuthenticityScore(markers);
        
        return markers;
    }

    detectTraditionalDrumSounds(audioData) {
        // Detect sounds characteristic of traditional reggae drums
        const spectrum = this.computeSpectrum(audioData);
        
        return {
            woodBlockTone: this.detectWoodBlockTone(spectrum),
            metallicSnare: this.detectMetallicSnare(spectrum),
            deepKick: this.detectDeepKick(spectrum),
            organicTimbre: this.calculateOrganicTimbre(audioData)
        };
    }

    detectWoodBlockTone(spectrum) {
        // Detect wood block-like tones common in reggae
        const woodBlockFreqs = [800, 1200, 1600];
        let woodBlockScore = 0;
        
        woodBlockFreqs.forEach(freq => {
            const bin = Math.floor(freq * spectrum.length / 22050);
            if (bin < spectrum.length) {
                woodBlockScore += spectrum[bin];
            }
        });
        
        return Math.min(1, woodBlockScore / 3);
    }

    detectMetallicSnare(spectrum) {
        // Detect metallic snare characteristics
        const metallicFreqs = [2000, 3000, 4000, 5000];
        let metallicScore = 0;
        
        metallicFreqs.forEach(freq => {
            const bin = Math.floor(freq * spectrum.length / 22050);
            if (bin < spectrum.length) {
                metallicScore += spectrum[bin];
            }
        });
        
        return Math.min(1, metallicScore / 4);
    }

    detectDeepKick(spectrum) {
        // Detect deep kick characteristics
        const deepFreqs = [40, 60, 80];
        let deepScore = 0;
        
        deepFreqs.forEach(freq => {
            const bin = Math.floor(freq * spectrum.length / 22050);
            if (bin < spectrum.length) {
                deepScore += spectrum[bin];
            }
        });
        
        return Math.min(1, deepScore / 3);
    }

    calculateOrganicTimbre(audioData) {
        // Calculate how "organic" vs "programmed" the drums sound
        const dynamicVariation = this.calculateDynamicVariation(audioData);
        const timingVariation = this.calculateMicrotimingVariation(audioData);
        
        return (dynamicVariation + timingVariation) / 2;
    }

    calculateDynamicVariation(audioData) {
        // Calculate variation in dynamics (human-like)
        const onsets = this.detectOnsets(audioData);
        if (onsets.length < 4) return 0;
        
        const energies = onsets.map(onset => {
            const startSample = Math.floor(onset * 44100);
            const window = audioData.slice(startSample, startSample + 1024);
            return window.reduce((sum, sample) => sum + sample * sample, 0);
        });
        
        const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
        const variance = energies.reduce((sum, energy) => sum + Math.pow(energy - mean, 2), 0) / energies.length;
        
        return Math.min(1, Math.sqrt(variance) / mean);
    }

    calculateMicrotimingVariation(audioData) {
        // Calculate microtiming variations (human-like imperfections)
        const onsets = this.detectOnsets(audioData);
        const timingDeviations = this.calculateTimingDeviations(onsets);
        
        if (timingDeviations.length === 0) return 0;
        
        const averageDeviation = timingDeviations.reduce((sum, dev) => sum + Math.abs(dev), 0) / timingDeviations.length;
        return Math.min(1, averageDeviation * 100); // Scale to 0-1
    }

    analyzeProductionStyle(audioData) {
        // Analyze production characteristics typical of reggae
        return {
            reverbCharacter: this.analyzeReverbCharacter(audioData),
            compressionStyle: this.analyzeCompressionStyle(audioData),
            stereoImage: this.analyzeStereoImage(audioData),
            frequencyBalance: this.analyzeFrequencyBalance(audioData)
        };
    }

    analyzeReverbCharacter(audioData) {
        // Analyze reverb characteristics
        const reverbTail = this.detectReverbTail(audioData);
        
        return {
            amount: reverbTail.amount,
            character: reverbTail.character,
            naturalness: reverbTail.naturalness
        };
    }

    detectReverbTail(audioData) {
        // Simplified reverb tail detection
        let maxAmplitude = 0;
        let tailStart = 0;
        
        // Find maximum amplitude
        for (let i = 0; i < audioData.length; i++) {
            if (Math.abs(audioData[i]) > maxAmplitude) {
                maxAmplitude = Math.abs(audioData[i]);
                tailStart = i;
            }
        }
        
        // Analyze decay after peak
        let decayTime = 0;
        const threshold = maxAmplitude * 0.1;
        
        for (let i = tailStart; i < audioData.length; i++) {
            if (Math.abs(audioData[i]) < threshold) {
                decayTime = (i - tailStart) / 44100;
                break;
            }
        }
        
        return {
            amount: Math.min(1, decayTime / 2), // Normalize to 0-1
            character: decayTime > 0.5 ? 'natural' : 'short',
            naturalness: Math.min(1, decayTime / 1.5)
        };
    }

    analyzeCompressionStyle(audioData) {
        // Analyze compression characteristics
        const dynamicRange = this.calculateDynamicRange(audioData);
        const punchiness = this.calculatePunchiness(audioData);
        
        return {
            amount: 1 - (dynamicRange / 60), // Assuming 60dB max dynamic range
            punchiness,
            style: dynamicRange < 20 ? 'heavy' : dynamicRange < 40 ? 'moderate' : 'light'
        };
    }

    calculateDynamicRange(audioData) {
        // Calculate dynamic range in dB
        const maxAmplitude = Math.max(...audioData.map(Math.abs));
        const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
        
        if (rms === 0) return 0;
        
        const peakDb = 20 * Math.log10(maxAmplitude);
        const rmsDb = 20 * Math.log10(rms);
        
        return peakDb - rmsDb;
    }

    calculatePunchiness(audioData) {
        // Calculate "punch" of the audio (transient response)
        const onsets = this.detectOnsets(audioData);
        let totalPunch = 0;
        
        onsets.forEach(onset => {
            const startSample = Math.floor(onset * 44100);
            const window = audioData.slice(startSample, startSample + 512);
            const punch = this.calculateTransientSharpness(window);
            totalPunch += punch;
        });
        
        return onsets.length > 0 ? totalPunch / onsets.length : 0;
    }

    analyzeStereoImage(audioData) {
        // Analyze stereo imaging (simplified - assuming mono input)
        return {
            width: 0.5, // Placeholder
            centerFocus: 0.8, // Drums typically centered
            balance: 0.5 // Placeholder
        };
    }

    analyzeFrequencyBalance(audioData) {
        // Analyze frequency balance typical of reggae production
        const spectrum = this.computeSpectrum(audioData);
        
        const bassEnergy = this.calculateBandEnergy(spectrum, 20, 200);
        const midEnergy = this.calculateBandEnergy(spectrum, 200, 2000);
        const highEnergy = this.calculateBandEnergy(spectrum, 2000, 20000);
        
        const totalEnergy = bassEnergy + midEnergy + highEnergy;
        
        return {
            bassRatio: bassEnergy / totalEnergy,
            midRatio: midEnergy / totalEnergy,
            highRatio: highEnergy / totalEnergy,
            balance: this.calculateFrequencyBalance(bassEnergy, midEnergy, highEnergy)
        };
    }

    calculateFrequencyBalance(bass, mid, high) {
        // Calculate overall frequency balance
        const total = bass + mid + high;
        if (total === 0) return 0;
        
        // Reggae typically has strong bass and mids, moderate highs
        const idealRatios = { bass: 0.4, mid: 0.4, high: 0.2 };
        const actualRatios = { bass: bass/total, mid: mid/total, high: high/total };
        
        let balance = 0;
        Object.keys(idealRatios).forEach(band => {
            const diff = Math.abs(idealRatios[band] - actualRatios[band]);
            balance += 1 - diff;
        });
        
        return balance / 3; // Average across bands
    }

    analyzeRhythmicPhrasiology(audioData) {
        // Analyze rhythmic phrases typical of reggae
        const phrases = this.extractRhythmicPhrases(audioData);
        
        return {
            phraseLength: this.calculateAveragePhraseLength(phrases),
            repetition: this.calculatePhraseRepetition(phrases),
            variation: this.calculatePhraseVariation(phrases),
            authenticity: this.assessPhraseAuthenticity(phrases)
        };
    }

    extractRhythmicPhrases(audioData) {
        // Extract rhythmic phrases from audio
        const onsets = this.detectOnsets(audioData);
        const phrases = [];
        
        // Group onsets into phrases (simplified)
        const phraseLength = 4.0; // 4 seconds per phrase
        
        for (let i = 0; i < audioData.length / 44100; i += phraseLength) {
            const phraseOnsets = onsets.filter(onset => 
                onset >= i && onset < i + phraseLength
            ).map(onset => onset - i); // Normalize to phrase start
            
            if (phraseOnsets.length > 0) {
                phrases.push(phraseOnsets);
            }
        }
        
        return phrases;
    }

    calculateAveragePhraseLength(phrases) {
        if (phrases.length === 0) return 0;
        
        const totalLength = phrases.reduce((sum, phrase) => {
            const lastOnset = Math.max(...phrase);
            return sum + lastOnset;
        }, 0);
        
        return totalLength / phrases.length;
    }

    calculatePhraseRepetition(phrases) {
        // Calculate how much phrases repeat (typical in reggae)
        if (phrases.length < 2) return 0;
        
        let similarPhrases = 0;
        
        for (let i = 0; i < phrases.length - 1; i++) {
            const similarity = this.calculatePhraseSimilarity(phrases[i], phrases[i + 1]);
            if (similarity > 0.7) {
                similarPhrases++;
            }
        }
        
        return similarPhrases / (phrases.length - 1);
    }

    calculatePhraseSimilarity(phrase1, phrase2) {
        // Calculate similarity between two rhythmic phrases
        const maxLength = Math.max(phrase1.length, phrase2.length);
        if (maxLength === 0) return 1;
        
        let matches = 0;
        const tolerance = 0.1; // 100ms tolerance
        
        phrase1.forEach(onset1 => {
            const hasMatch = phrase2.some(onset2 => 
                Math.abs(onset1 - onset2) < tolerance
            );
            if (hasMatch) matches++;
        });
        
        return matches / maxLength;
    }

    calculatePhraseVariation(phrases) {
        // Calculate variation between phrases
        if (phrases.length < 2) return 0;
        
        let totalVariation = 0;
        
        for (let i = 0; i < phrases.length - 1; i++) {
            const similarity = this.calculatePhraseSimilarity(phrases[i], phrases[i + 1]);
            totalVariation += 1 - similarity;
        }
        
        return totalVariation / (phrases.length - 1);
    }

    assessPhraseAuthenticity(phrases) {
        // Assess how authentic the rhythmic phrases are to reggae
        let authenticityScore = 0;
        
        phrases.forEach(phrase => {
            // Check for typical reggae phrase characteristics
            const hasOffBeatEmphasis = this.checkOffBeatEmphasis(phrase);
            const hasProperLength = phrase.length >= 2 && phrase.length <= 8;
            const hasReggaeSpacing = this.checkReggaeSpacing(phrase);
            
            let phraseScore = 0;
            if (hasOffBeatEmphasis) phraseScore += 0.4;
            if (hasProperLength) phraseScore += 0.3;
            if (hasReggaeSpacing) phraseScore += 0.3;
            
            authenticityScore += phraseScore;
        });
        
        return phrases.length > 0 ? authenticityScore / phrases.length : 0;
    }

    checkOffBeatEmphasis(phrase) {
        // Check if phrase emphasizes off-beats
        let offBeatCount = 0;
        
        phrase.forEach(onset => {
            const beatPosition = (onset * 2) % 1; // Assume 120 BPM
            if (beatPosition > 0.25 && beatPosition < 0.75) {
                offBeatCount++;
            }
        });
        
        return offBeatCount / phrase.length > 0.5;
    }

    checkReggaeSpacing(phrase) {
        // Check for typical reggae onset spacing
        if (phrase.length < 2) return false;
        
        const intervals = [];
        for (let i = 1; i < phrase.length; i++) {
            intervals.push(phrase[i] - phrase[i-1]);
        }
        
        // Check for typical reggae intervals
        const reggaeIntervals = [0.25, 0.5, 0.75, 1.0]; // Typical beat fractions
        
        return intervals.some(interval => 
            reggaeIntervals.some(reggaeInterval => 
                Math.abs(interval - reggaeInterval) < 0.1
            )
        );
    }

    calculateAuthenticityScore(markers) {
        // Calculate overall cultural authenticity score
        const scores = [
            markers.traditionalDrumSounds.woodBlockTone * 0.2,
            markers.traditionalDrumSounds.metallicSnare * 0.2,
            markers.traditionalDrumSounds.deepKick * 0.2,
            markers.traditionalDrumSounds.organicTimbre * 0.2,
            markers.productionStyle.reverbCharacter.naturalness * 0.1,
            markers.productionStyle.frequencyBalance.balance * 0.1
        ];
        
        return scores.reduce((sum, score) => sum + score, 0);
    }

    async assessCulturalAuthenticity(analysis) {
        console.log('🇯🇲 Assessing cultural authenticity...');
        
        const authenticity = {
            overallScore: 0,
            factors: {
                rhythmicAuthenticity: this.assessRhythmicAuthenticity(analysis),
                productionAuthenticity: this.assessProductionAuthenticity(analysis),
                culturalMarkers: analysis.rhythmicCharacteristics?.culturalMarkers?.authenticityScore || 0,
                genreConsistency: this.assessGenreConsistency(analysis)
            },
            confidence: 0,
            recommendations: []
        };
        
        // Calculate weighted overall score
        authenticity.overallScore = (
            authenticity.factors.rhythmicAuthenticity * 0.4 +
            authenticity.factors.productionAuthenticity * 0.2 +
            authenticity.factors.culturalMarkers * 0.2 +
            authenticity.factors.genreConsistency * 0.2
        );
        
        authenticity.confidence = this.calculateAuthenticityConfidence(authenticity);
        authenticity.recommendations = this.generateAuthenticityRecommendations(authenticity);
        
        return authenticity;
    }

    assessRhythmicAuthenticity(analysis) {
        // Assess rhythmic authenticity to reggae tradition
        let score = 0;
        
        if (analysis.rhythmicCharacteristics?.laidBackFeel?.score > 0.5) score += 0.3;
        if (analysis.rhythmicCharacteristics?.skankEmphasis?.offBeatEmphasis > 0.6) score += 0.3;
        if (analysis.rhythmicCharacteristics?.rimShotPresence?.placement?.onBeat3 > 0.5) score += 0.2;
        if (analysis.rhythmicCharacteristics?.hiHatPattern?.presence > 0.3) score += 0.2;
        
        return score;
    }

    assessProductionAuthenticity(analysis) {
        // Assess production authenticity to reggae tradition
        let score = 0;
        
        const production = analysis.rhythmicCharacteristics?.culturalMarkers?.productionStyle;
        if (production) {
            if (production.reverbCharacter?.naturalness > 0.5) score += 0.3;
            if (production.compressionStyle?.style === 'moderate') score += 0.3;
            if (production.frequencyBalance?.bassRatio > 0.3) score += 0.4;
        }
        
        return score;
    }

    assessGenreConsistency(analysis) {
        // Assess consistency with reggae genre expectations
        let score = 0;
        
        if (analysis.reggaeClassification?.isReggae) score += 0.5;
        if (analysis.reggaeClassification?.confidence > 0.7) score += 0.3;
        if (analysis.reggaeClassification?.primaryStyle) score += 0.2;
        
        return score;
    }

    calculateAuthenticityConfidence(authenticity) {
        // Calculate confidence in authenticity assessment
        const factorCount = Object.keys(authenticity.factors).length;
        const averageScore = authenticity.overallScore;
        const scoreVariance = this.calculateScoreVariance(Object.values(authenticity.factors));
        
        // Higher confidence when scores are high and consistent
        const consistency = 1 / (1 + scoreVariance);
        return (averageScore + consistency) / 2;
    }

    calculateScoreVariance(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return variance;
    }

    generateAuthenticityRecommendations(authenticity) {
        const recommendations = [];
        
        if (authenticity.factors.rhythmicAuthenticity < 0.6) {
            recommendations.push('Enhance laid-back timing and off-beat emphasis');
        }
        
        if (authenticity.factors.productionAuthenticity < 0.6) {
            recommendations.push('Adjust frequency balance to emphasize bass and mids');
        }
        
        if (authenticity.factors.culturalMarkers < 0.5) {
            recommendations.push('Incorporate more traditional drum sounds and organic timbre');
        }
        
        if (authenticity.factors.genreConsistency < 0.7) {
            recommendations.push('Strengthen reggae genre characteristics');
        }
        
        return recommendations;
    }

    calculateOverallConfidence(analysis) {
        // Calculate overall confidence in the analysis
        const confidenceFactors = [
            analysis.reggaeClassification?.confidence || 0,
            analysis.patternAnalysis?.confidence || 0,
            analysis.culturalAuthenticity?.confidence || 0
        ];
        
        return confidenceFactors.reduce((sum, conf) => sum + conf, 0) / confidenceFactors.length;
    }

    // Utility methods
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

    calculateBandEnergy(spectrum, minFreq, maxFreq) {
        // Calculate energy in frequency band
        const sampleRate = 44100;
        const startBin = Math.floor(minFreq * spectrum.length * 2 / sampleRate);
        const endBin = Math.floor(maxFreq * spectrum.length * 2 / sampleRate);
        
        let energy = 0;
        for (let i = startBin; i <= endBin && i < spectrum.length; i++) {
            energy += spectrum[i];
        }
        
        return energy;
    }

    // API methods for external use
    getRecognitionStats() {
        return {
            totalAnalyses: this.recognitionHistory.length,
            reggaeDetectionRate: this.calculateReggaeDetectionRate(),
            averageConfidence: this.calculateAverageConfidence(),
            mostCommonStyles: this.getMostCommonStyles(),
            recentAnalyses: this.getRecentAnalyses()
        };
    }

    calculateReggaeDetectionRate() {
        if (this.recognitionHistory.length === 0) return 0;
        
        const reggaeCount = this.recognitionHistory.filter(analysis => 
            analysis.reggaeClassification?.isReggae
        ).length;
        
        return (reggaeCount / this.recognitionHistory.length) * 100;
    }

    calculateAverageConfidence() {
        if (this.recognitionHistory.length === 0) return 0;
        
        const confidences = this.recognitionHistory.map(analysis => analysis.confidence);
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    getMostCommonStyles() {
        const styleCounts = {};
        
        this.recognitionHistory.forEach(analysis => {
            const style = analysis.reggaeClassification?.primaryStyle;
            if (style) {
                styleCounts[style] = (styleCounts[style] || 0) + 1;
            }
        });
        
        return Object.entries(styleCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([style, count]) => ({ style, count }));
    }

    getRecentAnalyses() {
        return this.recognitionHistory
            .slice(-10)
            .map(analysis => ({
                songName: analysis.songName,
                artist: analysis.artist,
                style: analysis.reggaeClassification?.primaryStyle,
                confidence: analysis.confidence,
                timestamp: analysis.timestamp
            }));
    }
}

// Supporting Classes

class ReggaeGenreClassifier {
    constructor() {
        this.genreFeatures = this.initializeGenreFeatures();
    }

    initializeGenreFeatures() {
        return {
            tempo: { min: 60, max: 140, optimal: [70, 95] },
            rhythmicComplexity: { min: 0.3, max: 0.8 },
            bassPresence: { min: 0.2, max: 0.6 },
            offBeatEmphasis: { min: 0.4, max: 0.9 }
        };
    }

    async classifyGenre(audioData, metadata) {
        // Simplified genre classification
        const features = this.extractGenreFeatures(audioData);
        const reggaeScore = this.calculateReggaeScore(features);
        
        return {
            isReggae: reggaeScore > 0.6,
            reggaeScore: reggaeScore,
            confidence: Math.min(1, reggaeScore * 1.2),
            features: features
        };
    }

    extractGenreFeatures(audioData) {
        // Extract basic genre classification features
        return {
            tempo: 75, // Placeholder
            rhythmicComplexity: 0.6, // Placeholder
            bassPresence: 0.4, // Placeholder
            offBeatEmphasis: 0.7 // Placeholder
        };
    }

    calculateReggaeScore(features) {
        let score = 0;
        
        // Tempo scoring
        if (features.tempo >= this.genreFeatures.tempo.optimal[0] && 
            features.tempo <= this.genreFeatures.tempo.optimal[1]) {
            score += 0.3;
        } else if (features.tempo >= this.genreFeatures.tempo.min && 
                   features.tempo <= this.genreFeatures.tempo.max) {
            score += 0.15;
        }
        
        // Other feature scoring
        if (features.offBeatEmphasis > 0.6) score += 0.3;
        if (features.bassPresence > 0.25) score += 0.2;
        if (features.rhythmicComplexity > 0.4 && features.rhythmicComplexity < 0.8) score += 0.2;
        
        return score;
    }
}

class ReggaePatternAnalyzer {
    constructor() {
        this.patternDatabase = this.initializePatternDatabase();
    }

    initializePatternDatabase() {
        return {
            kick: {
                one_drop: [0, 0, 1, 0],
                steppers: [1, 0, 1, 0],
                rockers: [1, 0, 0, 1]
            },
            snare: {
                rim_shot: [0, 0, 1, 0],
                cross_stick: [0, 1, 0, 1],
                ghost_notes: [0, 0.3, 1, 0.3]
            },
            hihat: {
                closed: [1, 1, 1, 1],
                open_closed: [1, 2, 1, 2],
                sparse: [1, 0, 1, 0]
            }
        };
    }

    async analyzePatterns(audioData) {
        console.log('🔍 Analyzing detailed rhythmic patterns...');
        
        const patterns = {
            kickPattern: this.extractKickPattern(audioData),
            snarePattern: this.extractSnarePattern(audioData),
            hihatPattern: this.extractHihatPattern(audioData),
            overallComplexity: 0,
            confidence: 0
        };
        
        patterns.overallComplexity = this.calculateOverallComplexity(patterns);
        patterns.confidence = this.calculatePatternConfidence(patterns);
        
        return patterns;
    }

    extractKickPattern(audioData) {
        // Extract kick pattern from low frequencies
        const lowFreqData = this.filterFrequencyRange(audioData, 20, 120);
        return this.extractPattern(lowFreqData, 'kick');
    }

    extractSnarePattern(audioData) {
        // Extract snare pattern from mid frequencies
        const midFreqData = this.filterFrequencyRange(audioData, 150, 300);
        return this.extractPattern(midFreqData, 'snare');
    }

    extractHihatPattern(audioData) {
        // Extract hi-hat pattern from high frequencies
        const highFreqData = this.filterFrequencyRange(audioData, 8000, 15000);
        return this.extractPattern(highFreqData, 'hihat');
    }

    filterFrequencyRange(audioData, minFreq, maxFreq) {
        // Simplified frequency filtering
        // In practice, would use proper bandpass filter
        return audioData; // Placeholder
    }

    extractPattern(audioData, elementType) {
        // Extract 4/4 pattern for drum element
        const onsets = this.detectElementOnsets(audioData, elementType);
        const pattern = new Array(16).fill(0);
        
        // Map onsets to 16-step pattern
        const patternDuration = 2.0; // 2 seconds at ~75 BPM
        const stepDuration = patternDuration / 16;
        
        onsets.forEach(onset => {
            const step = Math.floor(onset / stepDuration) % 16;
            pattern[step] = 1;
        });
        
        return {
            pattern: pattern,
            onsets: onsets,
            density: onsets.length,
            regularity: this.calculatePatternRegularity(pattern)
        };
    }

    detectElementOnsets(audioData, elementType) {
        // Detect onsets specific to drum element type
        const onsets = [];
        const windowSize = 512;
        const hopSize = 256;
        
        // Element-specific thresholds
        const thresholds = {
            kick: 0.2,
            snare: 0.15,
            hihat: 0.1
        };
        
        const threshold = thresholds[elementType] || 0.15;
        
        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const energy = window.reduce((sum, sample) => sum + sample * sample, 0) / windowSize;
            
            if (energy > threshold) {
                onsets.push(i / 44100);
            }
        }
        
        return onsets;
    }

    calculatePatternRegularity(pattern) {
        // Calculate how regular/repetitive the pattern is
        if (pattern.length < 4) return 0;
        
        let regularity = 0;
        const quarterPattern = pattern.slice(0, 4);
        
        // Check if pattern repeats every 4 steps
        for (let i = 4; i < pattern.length; i += 4) {
            const quarter = pattern.slice(i, i + 4);
            const similarity = this.calculateArraySimilarity(quarterPattern, quarter);
            regularity += similarity;
        }
        
        return regularity / Math.floor(pattern.length / 4);
    }

    calculateArraySimilarity(arr1, arr2) {
        const maxLength = Math.max(arr1.length, arr2.length);
        let matches = 0;
        
        for (let i = 0; i < maxLength; i++) {
            const val1 = i < arr1.length ? arr1[i] : 0;
            const val2 = i < arr2.length ? arr2[i] : 0;
            
            if (val1 === val2) matches++;
        }
        
        return matches / maxLength;
    }

    calculateOverallComplexity(patterns) {
        // Calculate overall rhythmic complexity
        const complexities = [
            patterns.kickPattern?.density || 0,
            patterns.snarePattern?.density || 0,
            patterns.hihatPattern?.density || 0
        ];
        
        const averageDensity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
        return Math.min(1, averageDensity / 10); // Normalize
    }

    calculatePatternConfidence(patterns) {
        // Calculate confidence in pattern analysis
        const confidences = [
            patterns.kickPattern?.regularity || 0,
            patterns.snarePattern?.regularity || 0,
            patterns.hihatPattern?.regularity || 0
        ];
        
        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
}

// Recognition models (simplified implementations)
class TempoRecognitionModel {
    detect(audioData) {
        return 75; // Placeholder
    }
}

class RhythmPatternRecognitionModel {
    recognize(audioData) {
        return { pattern: 'one_drop', confidence: 0.8 }; // Placeholder
    }
}

class TimbreRecognitionModel {
    analyze(audioData) {
        return { brightness: 0.6, warmth: 0.7 }; // Placeholder
    }
}

class StructureRecognitionModel {
    detect(audioData) {
        return { structure: 'verse-chorus', confidence: 0.7 }; // Placeholder
    }
}

module.exports = {
    ReggaeDrumRecognitionSystem,
    ReggaeGenreClassifier,
    ReggaePatternAnalyzer
};