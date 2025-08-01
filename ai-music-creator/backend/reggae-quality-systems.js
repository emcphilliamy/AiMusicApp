// Reggae Quality Assessment and Conflict Resolution Systems
// Phase 2 & 3 Implementation - Enhanced AI Architecture

// Enhanced Conflict Resolution for Reggae
class ReggaeConflictResolver {
    constructor() {
        this.reggaeRules = this.loadReggaeMusicalRules();
        this.culturalConstraints = this.loadCulturalConstraints();
        this.resolutionStrategies = this.setupResolutionStrategies();
        
        console.log('🎵 ReggaeConflictResolver initialized with cultural authenticity rules');
    }

    loadReggaeMusicalRules() {
        return {
            tempo: {
                min: 60,
                max: 120,
                optimal: [70, 95],
                subgenreRanges: {
                    roots: [65, 85],
                    rockers: [85, 110],
                    lovers_rock: [75, 100],
                    dub: [70, 95]
                }
            },
            rhythmicRules: {
                bassDrumRelationship: 'tight_pocket',
                skankTiming: 'upbeat_emphasis',
                oneDropCharacteristic: 'beat_3_emphasis',
                laidBackFeel: 0.03 // 3% behind beat
            },
            harmonicRules: {
                bassProminence: 'fundamental_focus',
                chordVoicings: 'jazz_influenced',
                keyPreferences: ['A', 'D', 'E', 'G', 'C'],
                modalInfluences: ['mixolydian', 'dorian']
            },
            mixingRules: {
                bassLevel: 0.8,     // Prominent bass
                drumsLevel: 0.75,   // Strong rhythm section
                skankLevel: 0.5,    // Supporting rhythm
                keysLevel: 0.6,     // Harmonic color
                separation: 'distinct_frequency_bands'
            }
        };
    }

    loadCulturalConstraints() {
        return {
            authenticityMarkers: {
                rhythm: ['one_drop', 'rockers', 'steppers'],
                instrumentation: ['electric_bass', 'clean_guitar', 'hammond_organ', 'acoustic_drums'],
                techniques: ['upstroke_guitar', 'rim_shot_snare', 'fingerstyle_bass', 'drawbar_organ'],
                feel: ['laid_back_timing', 'syncopated_emphasis', 'organic_humanization']
            },
            culturalSignificance: {
                spiritualElements: ['roots_progression', 'natural_harmonics', 'space_for_reflection'],
                politicalElements: ['militant_rhythms', 'forward_momentum', 'collective_energy'],
                socialElements: ['danceable_groove', 'community_feel', 'uplifting_harmony']
            }
        };
    }

    setupResolutionStrategies() {
        return {
            tempo: this.resolveTempoConflicts.bind(this),
            rhythm_sync: this.resolveRhythmConflicts.bind(this),
            bass_drum_relationship: this.resolveBassDrumConflicts.bind(this),
            skank_timing: this.resolveSkankTimingConflicts.bind(this),
            harmonic_consistency: this.resolveHarmonicConflicts.bind(this),
            instrument_balance: this.resolveInstrumentBalanceConflicts.bind(this),
            cultural_authenticity: this.resolveCulturalConflicts.bind(this)
        };
    }

    async resolveReggaeConflicts(conflicts, context) {
        console.log(`🔧 Resolving ${conflicts.length} reggae-specific conflicts`);
        
        const resolutions = [];
        
        for (const conflict of conflicts) {
            const strategy = this.resolutionStrategies[conflict.type];
            if (strategy) {
                const resolution = await strategy(conflict, context);
                resolutions.push({
                    ...resolution,
                    originalConflict: conflict,
                    resolutionStrategy: conflict.type
                });
            } else {
                // Fallback to generic resolution
                resolutions.push(await this.genericReggaeResolution(conflict, context));
            }
        }
        
        return this.validateReggaeCoherence(resolutions, context);
    }

    async resolveTempoConflicts(conflict, context) {
        const { proposedTempo, subgenre } = conflict;
        const rules = this.reggaeRules.tempo;
        
        // Determine target tempo based on subgenre
        let targetRange = rules.optimal;
        if (subgenre && rules.subgenreRanges[subgenre]) {
            targetRange = rules.subgenreRanges[subgenre];
        }
        
        // Find optimal tempo within constraints
        let resolvedTempo = Math.max(rules.min, Math.min(rules.max, proposedTempo));
        
        // Prefer subgenre-specific range
        if (resolvedTempo < targetRange[0]) {
            resolvedTempo = targetRange[0];
        } else if (resolvedTempo > targetRange[1]) {
            resolvedTempo = targetRange[1];
        }
        
        return {
            resolution: resolvedTempo,
            confidence: this.calculateTempoFitness(resolvedTempo, targetRange),
            justification: `Constrained to ${subgenre || 'reggae'} tempo range (${targetRange[0]}-${targetRange[1]} BPM)`,
            culturalAuthenticity: this.assessTempoAuthenticity(resolvedTempo, subgenre)
        };
    }

    async resolveRhythmConflicts(conflict, context) {
        const { conflictingRhythms } = conflict;
        
        // Find the most authentic reggae rhythm
        let bestRhythm = null;
        let bestScore = 0;
        
        for (const rhythm of conflictingRhythms) {
            const authenticityScore = this.assessRhythmAuthenticity(rhythm);
            if (authenticityScore > bestScore) {
                bestScore = authenticityScore;
                bestRhythm = rhythm;
            }
        }
        
        // Apply reggae groove adjustments
        const resolvedRhythm = this.applyReggaeGrooveRules(bestRhythm, context);
        
        return {
            resolution: resolvedRhythm,
            confidence: bestScore,
            justification: 'Selected most culturally authentic reggae rhythm pattern',
            adjustments: ['laid_back_timing', 'syncopated_emphasis', 'organic_humanization']
        };
    }

    async resolveBassDrumConflicts(conflict, context) {
        const { bassPattern, drumPattern } = conflict;
        
        // Ensure tight rhythmic relationship
        const synchronizedPatterns = this.synchronizeBassDrumPocket(bassPattern, drumPattern);
        
        // Apply reggae-specific timing relationships
        const reggaeAdjusted = this.applyReggaeBassDrumRules(synchronizedPatterns);
        
        return {
            resolution: reggaeAdjusted,
            confidence: 0.9,
            justification: 'Aligned bass and drums to traditional reggae pocket relationship',
            techniques: ['shared_rhythmic_foundation', 'complementary_accents', 'locked_groove']
        };
    }

    async resolveSkankTimingConflicts(conflict, context) {
        const { skankPattern, tempo } = conflict;
        
        // Ensure upbeat emphasis (beats 2 and 4)
        const correctedSkank = this.enforceUpbeatEmphasis(skankPattern);
        
        // Apply proper reggae skank timing
        const reggaeSkank = this.applyReggaeSkankTiming(correctedSkank, tempo);
        
        return {
            resolution: reggaeSkank,
            confidence: 0.85,
            justification: 'Corrected guitar skank to emphasize upbeats with proper reggae timing',
            characteristics: ['upstroke_technique', 'beat_2_4_emphasis', 'percussive_attack']
        };
    }

    async resolveHarmonicConflicts(conflict, context) {
        const { conflictingChords, key } = conflict;
        
        // Apply reggae harmonic preferences
        const reggaeChords = this.selectReggaeAppropriateCords(conflictingChords, key);
        
        // Ensure jazz-influenced voicings
        const voicedChords = this.applyReggaeVoicings(reggaeChords);
        
        return {
            resolution: voicedChords,
            confidence: 0.8,
            justification: 'Selected chords that support reggae harmonic conventions',
            voicingStyle: 'jazz_influenced_reggae'
        };
    }

    async resolveInstrumentBalanceConflicts(conflict, context) {
        const { instrumentLevels } = conflict;
        const rules = this.reggaeRules.mixingRules;
        
        // Apply reggae-specific mix balance
        const resolvedLevels = {
            bass: Math.max(instrumentLevels.bass || 0, rules.bassLevel),
            drums: Math.max(instrumentLevels.drums || 0, rules.drumsLevel),
            guitar: Math.min(instrumentLevels.guitar || 1, rules.skankLevel),
            keys: instrumentLevels.keys || rules.keysLevel
        };
        
        // Ensure frequency separation
        const separatedMix = this.applyFrequencySeparation(resolvedLevels);
        
        return {
            resolution: separatedMix,
            confidence: 0.9,
            justification: 'Applied traditional reggae mix balance with prominent bass and tight rhythm section',
            separation: rules.separation
        };
    }

    async resolveCulturalConflicts(conflict, context) {
        const { culturalElements, authenticity } = conflict;
        
        // Assess cultural authenticity of elements
        const authenticElements = this.filterCulturallyAuthentic(culturalElements);
        
        // Apply cultural enhancement
        const enhanced = this.applyCulturalEnhancement(authenticElements, context);
        
        return {
            resolution: enhanced,
            confidence: this.calculateCulturalScore(enhanced),
            justification: 'Enhanced cultural authenticity based on traditional Jamaican reggae practices',
            culturalMarkers: this.identifyCulturalMarkers(enhanced)
        };
    }

    // Assessment and validation methods
    calculateTempoFitness(tempo, targetRange) {
        if (tempo >= targetRange[0] && tempo <= targetRange[1]) {
            return 0.9; // Within optimal range
        }
        
        const distance = Math.min(
            Math.abs(tempo - targetRange[0]),
            Math.abs(tempo - targetRange[1])
        );
        
        return Math.max(0.3, 0.9 - (distance / 30)); // Decrease fitness with distance
    }

    assessTempoAuthenticity(tempo, subgenre) {
        const authenticityMap = {
            roots: tempo >= 65 && tempo <= 85 ? 0.9 : 0.6,
            rockers: tempo >= 85 && tempo <= 110 ? 0.9 : 0.6,
            lovers_rock: tempo >= 75 && tempo <= 100 ? 0.9 : 0.6,
            dub: tempo >= 70 && tempo <= 95 ? 0.9 : 0.6
        };
        
        return authenticityMap[subgenre] || (tempo >= 70 && tempo <= 95 ? 0.8 : 0.5);
    }

    assessRhythmAuthenticity(rhythm) {
        let score = 0;
        
        // Check for reggae characteristics
        if (rhythm.characteristics) {
            const reggaeMarkers = ['one_drop', 'rockers', 'steppers', 'beat_3_emphasis'];
            const matches = rhythm.characteristics.filter(char => 
                reggaeMarkers.some(marker => char.includes(marker))
            );
            score += matches.length * 0.2;
        }
        
        // Check for cultural authenticity
        if (rhythm.culturalAuthenticity) {
            score += rhythm.culturalAuthenticity * 0.4;
        }
        
        // Check for proper timing feel
        if (rhythm.feel && rhythm.feel.includes('laid_back')) {
            score += 0.2;
        }
        
        return Math.min(1.0, score);
    }

    // Implementation helper methods
    applyReggaeGrooveRules(rhythm, context) {
        return {
            ...rhythm,
            timing: {
                ...rhythm.timing,
                laidBack: this.reggaeRules.rhythmicRules.laidBackFeel,
                pocket: 'deep_reggae_groove'
            },
            feel: 'authentic_jamaican',
            humanization: this.applyReggaeHumanization(rhythm, context.tempo)
        };
    }

    synchronizeBassDrumPocket(bassPattern, drumPattern) {
        return {
            bass: {
                ...bassPattern,
                timing: this.alignWithDrumPocket(bassPattern, drumPattern),
                pocket: 'locked_with_drums'
            },
            drums: {
                ...drumPattern,
                timing: this.alignWithBassPocket(drumPattern, bassPattern),
                pocket: 'locked_with_bass'
            }
        };
    }

    applyReggaeBassDrumRules(patterns) {
        const { bass, drums } = patterns;
        
        return {
            bass: {
                ...bass,
                emphasis: 'root_note_foundation',
                relationship: 'complementary_accents'
            },
            drums: {
                ...drums,
                emphasis: 'beat_3_accent',
                relationship: 'rhythmic_foundation'
            },
            interaction: 'tight_pocket_feel'
        };
    }

    enforceUpbeatEmphasis(skankPattern) {
        return {
            ...skankPattern,
            pattern: skankPattern.pattern.map((hit, index) => {
                // Emphasize beats 2 and 4 (upbeats)
                if (index % 4 === 1 || index % 4 === 3) {
                    return Math.max(hit, 0.8);
                }
                return Math.min(hit, 0.3); // Minimize downbeats
            }),
            emphasis: 'upbeat_dominant'
        };
    }

    applyReggaeSkankTiming(skankPattern, tempo) {
        return {
            ...skankPattern,
            timing: skankPattern.pattern.map((hit, index) => {
                if (hit > 0) {
                    // Upstrokes are slightly ahead of beat
                    const isUpbeat = index % 2 === 1;
                    return {
                        velocity: hit,
                        timing: isUpbeat ? 0.98 : 1.01, // Upbeats early, downbeats late
                        technique: 'upstroke_emphasis'
                    };
                }
                return { velocity: 0, timing: 1, technique: 'muted' };
            }),
            feel: 'reggae_skank_groove'
        };
    }

    selectReggaeAppropriateCords(chords, key) {
        // Prefer chords that fit reggae harmonic conventions
        const reggaeChordPreferences = ['maj', 'min', 'dom7', 'min7', 'maj7'];
        
        return chords.filter(chord => {
            return reggaeChordPreferences.some(type => chord.type === type);
        });
    }

    applyReggaeVoicings(chords) {
        return chords.map(chord => ({
            ...chord,
            voicing: this.getReggaeVoicing(chord),
            inversion: this.getOptimalInversion(chord),
            spacing: 'jazz_influenced'
        }));
    }

    applyFrequencySeparation(levels) {
        return {
            ...levels,
            frequencyBands: {
                bass: [40, 300],      // Deep bass frequencies
                drums: [50, 8000],    // Full drum spectrum
                guitar: [200, 5000],  // Guitar skank range
                keys: [100, 8000]     // Organ frequency range
            },
            separation: 'distinct_eq_bands'
        };
    }

    filterCulturallyAuthentic(elements) {
        const authentic = this.culturalConstraints.authenticityMarkers;
        
        return elements.filter(element => {
            return Object.values(authentic).some(category =>
                category.includes(element.type) || category.includes(element.technique)
            );
        });
    }

    applyCulturalEnhancement(elements, context) {
        return elements.map(element => ({
            ...element,
            culturalContext: this.getCulturalContext(element),
            authenticity: this.calculateElementAuthenticity(element),
            enhancement: this.getCulturalEnhancement(element, context)
        }));
    }

    calculateCulturalScore(elements) {
        if (!elements || elements.length === 0) return 0;
        
        const totalScore = elements.reduce((sum, element) => {
            return sum + (element.authenticity || 0);
        }, 0);
        
        return totalScore / elements.length;
    }

    identifyCulturalMarkers(elements) {
        const markers = [];
        
        elements.forEach(element => {
            if (element.culturalContext) {
                markers.push(...element.culturalContext.markers);
            }
        });
        
        return [...new Set(markers)]; // Remove duplicates
    }

    async validateReggaeCoherence(resolutions, context) {
        const validation = {
            coherent: true,
            score: 0,
            issues: [],
            recommendations: []
        };
        
        // Check tempo consistency
        const tempos = resolutions.filter(r => r.resolution.tempo)
                                 .map(r => r.resolution.tempo);
        if (tempos.length > 1 && this.hasTempoInconsistency(tempos)) {
            validation.issues.push('tempo_inconsistency');
            validation.coherent = false;
        }
        
        // Check rhythmic coherence
        const rhythmicCoherence = this.assessRhythmicCoherence(resolutions);
        validation.score += rhythmicCoherence * 0.3;
        
        // Check cultural authenticity
        const culturalCoherence = this.assessCulturalCoherence(resolutions);
        validation.score += culturalCoherence * 0.4;
        
        // Check mix balance
        const mixCoherence = this.assessMixCoherence(resolutions);
        validation.score += mixCoherence * 0.3;
        
        // Generate recommendations
        if (validation.score < 0.8) {
            validation.recommendations = this.generateImprovementRecommendations(resolutions);
        }
        
        console.log(`🎵 Reggae coherence validation: ${(validation.score * 100).toFixed(1)}% authentic`);
        
        return validation;
    }

    // Helper methods for validation and enhancement
    applyReggaeHumanization(rhythm, tempo) {
        const humanizationAmount = tempo < 80 ? 0.03 : 0.02;
        
        return {
            timing: humanizationAmount,
            velocity: 0.15,
            feel: 'organic_human_pocket'
        };
    }

    alignWithDrumPocket(bassPattern, drumPattern) {
        // Align bass timing with drum pocket
        return bassPattern.timing?.map((hit, index) => {
            if (hit && drumPattern.timing?.[index]) {
                return {
                    ...hit,
                    timing: drumPattern.timing[index].timing + 0.01 // Slightly behind drums
                };
            }
            return hit;
        }) || bassPattern.timing;
    }

    alignWithBassPocket(drumPattern, bassPattern) {
        // Ensure drums provide solid foundation for bass
        return drumPattern.timing?.map((hit, index) => {
            if (hit && bassPattern.timing?.[index]) {
                return {
                    ...hit,
                    foundation: 'bass_support'
                };
            }
            return hit;
        }) || drumPattern.timing;
    }

    getReggaeVoicing(chord) {
        const reggaeVoicings = {
            'maj': 'open_triad',
            'min': 'close_triad',
            'dom7': 'rootless_voicing',
            'min7': 'jazz_voicing',
            'maj7': 'spread_voicing'
        };
        
        return reggaeVoicings[chord.type] || 'open_triad';
    }

    getOptimalInversion(chord) {
        // Prefer inversions that support bass line
        const inversionPreferences = ['root', 'first', 'second'];
        return inversionPreferences[Math.floor(Math.random() * inversionPreferences.length)];
    }

    getCulturalContext(element) {
        return {
            era: 'classic_reggae_1970s',
            origin: 'jamaican_tradition',
            markers: this.extractCulturalMarkers(element),
            significance: this.assessCulturalSignificance(element)
        };
    }

    calculateElementAuthenticity(element) {
        const authenticMarkers = this.culturalConstraints.authenticityMarkers;
        let score = 0;
        
        Object.values(authenticMarkers).forEach(category => {
            if (category.includes(element.type)) score += 0.25;
            if (category.includes(element.technique)) score += 0.25;
        });
        
        return Math.min(1.0, score);
    }

    getCulturalEnhancement(element, context) {
        return {
            traditional_technique: true,
            cultural_appropriateness: 'authentic',
            enhancement_applied: this.selectCulturalEnhancement(element.type)
        };
    }

    selectCulturalEnhancement(elementType) {
        const enhancements = {
            rhythm: 'jamaican_timing_feel',
            bass: 'fingerstyle_warmth',
            guitar: 'upstroke_technique',
            keys: 'hammond_character'
        };
        
        return enhancements[elementType] || 'general_authenticity';
    }

    extractCulturalMarkers(element) {
        const markers = [];
        
        if (element.technique) markers.push(element.technique);
        if (element.style) markers.push(element.style);
        if (element.feel) markers.push(element.feel);
        
        return markers;
    }

    assessCulturalSignificance(element) {
        const significance = this.culturalConstraints.culturalSignificance;
        
        let score = 0;
        Object.values(significance).forEach(category => {
            if (category.some(marker => element.characteristics?.includes(marker))) {
                score += 0.33;
            }
        });
        
        return Math.min(1.0, score);
    }

    hasTempoInconsistency(tempos) {
        const maxDifference = Math.max(...tempos) - Math.min(...tempos);
        return maxDifference > 10; // More than 10 BPM difference
    }

    assessRhythmicCoherence(resolutions) {
        // Assess how well rhythmic elements work together
        let score = 0.8; // Start with good baseline
        
        const rhythmicElements = resolutions.filter(r => r.resolutionStrategy?.includes('rhythm'));
        
        if (rhythmicElements.length > 0) {
            const avgConfidence = rhythmicElements.reduce((sum, el) => sum + el.confidence, 0) / rhythmicElements.length;
            score = avgConfidence;
        }
        
        return score;
    }

    assessCulturalCoherence(resolutions) {
        let score = 0.7; // Baseline cultural score
        
        const culturalElements = resolutions.filter(r => r.culturalAuthenticity !== undefined);
        
        if (culturalElements.length > 0) {
            const avgAuthenticity = culturalElements.reduce((sum, el) => sum + (el.culturalAuthenticity || 0), 0) / culturalElements.length;
            score = avgAuthenticity;
        }
        
        return score;
    }

    assessMixCoherence(resolutions) {
        const mixElements = resolutions.filter(r => r.resolutionStrategy === 'instrument_balance');
        
        if (mixElements.length > 0) {
            return mixElements[0].confidence || 0.8;
        }
        
        return 0.8; // Default good mix coherence
    }

    generateImprovementRecommendations(resolutions) {
        const recommendations = [];
        
        // Analyze resolution confidence scores
        const lowConfidenceResolutions = resolutions.filter(r => r.confidence < 0.7);
        
        lowConfidenceResolutions.forEach(resolution => {
            switch(resolution.resolutionStrategy) {
                case 'tempo':
                    recommendations.push('Consider adjusting tempo to better fit reggae subgenre');
                    break;
                case 'rhythm_sync':
                    recommendations.push('Improve rhythmic synchronization between instruments');
                    break;
                case 'cultural_authenticity':
                    recommendations.push('Enhance cultural authenticity with traditional Jamaican techniques');
                    break;
                default:
                    recommendations.push(`Improve ${resolution.resolutionStrategy} resolution quality`);
            }
        });
        
        return recommendations;
    }

    async genericReggaeResolution(conflict, context) {
        // Fallback resolution with reggae considerations
        return {
            resolution: conflict.defaultResolution || conflict.options?.[0],
            confidence: 0.6,
            justification: 'Applied generic reggae-aware resolution',
            fallback: true
        };
    }
}

// Reggae-Specific Quality Assessment AI
class ReggaeQualityAssessmentAI {
    constructor() {
        this.reggaeMetrics = this.setupReggaeMetrics();
        this.culturalValidators = this.setupCulturalValidators();
        this.qualityWeights = this.setupQualityWeights();
        
        console.log('🎵 ReggaeQualityAssessmentAI initialized with cultural authenticity metrics');
    }

    setupReggaeMetrics() {
        return {
            // Standard musical metrics
            harmony: {
                weight: 0.15,
                evaluator: this.evaluateReggaeHarmony.bind(this)
            },
            rhythm: {
                weight: 0.25, // Higher weight for reggae
                evaluator: this.evaluateReggaeRhythm.bind(this)
            },
            arrangement: {
                weight: 0.15,
                evaluator: this.evaluateReggaeArrangement.bind(this)
            },
            
            // Reggae-specific metrics
            oneDropPresence: {
                weight: 0.20, // Critical for reggae authenticity
                evaluator: this.detectOneDropPattern.bind(this)
            },
            skankAuthenticity: {
                weight: 0.15,
                evaluator: this.evaluateSkankTechnique.bind(this)
            },
            bassProminence: {
                weight: 0.20, // Bass is fundamental in reggae
                evaluator: this.evaluateBassRole.bind(this)
            },
            grooveTightness: {
                weight: 0.15,
                evaluator: this.evaluateRhythmSection.bind(this)
            },
            reggaeGenreAdherence: {
                weight: 0.10,
                evaluator: this.evaluateReggaeCharacteristics.bind(this)
            },
            instrumentalSeparation: {
                weight: 0.10,
                evaluator: this.evaluateInstrumentClarity.bind(this)
            }
        };
    }

    setupCulturalValidators() {
        return {
            jamaican_timing: this.validateJamaicanTiming.bind(this),
            traditional_instrumentation: this.validateTraditionalInstrumentation.bind(this),
            authentic_techniques: this.validateAuthenticTechniques.bind(this),
            cultural_appropriateness: this.validateCulturalAppropriateness.bind(this)
        };
    }

    setupQualityWeights() {
        return {
            technical: 0.3,    // Audio quality, mix, etc.
            musical: 0.4,      // Harmony, rhythm, arrangement
            cultural: 0.3      // Reggae-specific authenticity
        };
    }

    async evaluateReggaeGeneration(audioData, context) {
        console.log('🔍 Evaluating reggae generation quality and authenticity...');
        
        const metrics = {};
        let overallScore = 0;
        
        // Evaluate each metric
        for (const [metricName, config] of Object.entries(this.reggaeMetrics)) {
            try {
                const result = await config.evaluator(audioData, context);
                metrics[metricName] = result;
                overallScore += result.score * config.weight;
            } catch (error) {
                console.warn(`Failed to evaluate ${metricName}:`, error.message);
                metrics[metricName] = { score: 0.5, error: error.message };
                overallScore += 0.5 * config.weight;
            }
        }
        
        // Cultural authenticity assessment
        const culturalAssessment = await this.assessCulturalAuthenticity(audioData, context);
        
        // Calculate weighted reggae score
        const reggaeScore = this.calculateReggaeScore(metrics, culturalAssessment);
        
        const assessment = {
            overallScore: reggaeScore,
            metrics: metrics,
            culturalAuthenticity: culturalAssessment,
            recommendations: this.generateImprovementRecommendations(metrics),
            authenticity: {
                traditional: culturalAssessment.traditional,
                contemporary: culturalAssessment.contemporary,
                overall: culturalAssessment.overall
            }
        };
        
        console.log(`🎵 Reggae quality score: ${(reggaeScore * 100).toFixed(1)}%`);
        return assessment;
    }

    async evaluateReggaeHarmony(audioData, context) {
        // Analyze chord progressions for reggae appropriateness
        const chordAnalysis = this.analyzeChordProgression(audioData);
        const voicingQuality = this.analyzeChordVoicings(audioData);
        const modalCharacter = this.analyzeModalCharacteristics(audioData);
        
        const score = (chordAnalysis.reggaeCompatibility * 0.4 +
                      voicingQuality.jazzInfluence * 0.3 +
                      modalCharacter.authenticity * 0.3);
        
        return {
            score: score,
            details: {
                chordProgression: chordAnalysis,
                voicings: voicingQuality,
                modalCharacter: modalCharacter
            },
            recommendations: this.generateHarmonyRecommendations(score)
        };
    }

    async evaluateReggaeRhythm(audioData, context) {
        // Comprehensive rhythm analysis for reggae
        const tempoStability = this.analyzeTempoStability(audioData);
        const rhythmicPocket = this.analyzeRhythmicPocket(audioData);
        const syncopation = this.analyzeSyncopation(audioData);
        const humanFeel = this.analyzeHumanFeel(audioData);
        
        const score = (tempoStability * 0.25 +
                      rhythmicPocket * 0.35 +
                      syncopation * 0.25 +
                      humanFeel * 0.15);
        
        return {
            score: score,
            details: {
                tempo: tempoStability,
                pocket: rhythmicPocket,
                syncopation: syncopation,
                humanization: humanFeel
            },
            characteristics: this.identifyRhythmicCharacteristics(audioData)
        };
    }

    async evaluateReggaeArrangement(audioData, context) {
        // Analyze instrument arrangement for reggae style
        const instrumentBalance = this.analyzeInstrumentBalance(audioData);
        const frequencyDistribution = this.analyzeFrequencyDistribution(audioData);
        const spatialArrangement = this.analyzeSpatialArrangement(audioData);
        
        const score = (instrumentBalance * 0.4 +
                      frequencyDistribution * 0.35 +
                      spatialArrangement * 0.25);
        
        return {
            score: score,
            details: {
                balance: instrumentBalance,
                frequency: frequencyDistribution,
                spatial: spatialArrangement
            }
        };
    }

    async detectOneDropPattern(audioData, context) {
        // Analyze beat 3 emphasis in drum track
        const drumTrack = this.isolateDrumTrack(audioData);
        const beatEmphasis = this.analyzeBeatEmphasis(drumTrack);
        const oneDropCharacteristics = this.analyzeOneDropCharacteristics(drumTrack);
        
        const score = beatEmphasis[2] > beatEmphasis[0] ? 0.9 : 0.3; // Beat 3 > Beat 1
        const detected = beatEmphasis[2] > 0.7;
        const confidence = this.calculateDetectionConfidence(beatEmphasis);
        
        return {
            score: score,
            detected: detected,
            confidence: confidence,
            characteristics: oneDropCharacteristics,
            beatEmphasis: beatEmphasis,
            authenticity: this.validateOneDropAuthenticity(oneDropCharacteristics)
        };
    }

    async evaluateSkankTechnique(audioData, context) {
        // Analyze guitar skank authenticity
        const guitarTrack = this.isolateGuitarTrack(audioData);
        const upbeatEmphasis = this.analyzeUpbeatEmphasis(guitarTrack);
        const percussiveAttack = this.analyzePercussiveAttack(guitarTrack);
        const chordVoicing = this.analyzeChordVoicing(guitarTrack);
        
        const score = (upbeatEmphasis * 0.4 +
                      percussiveAttack * 0.35 +
                      chordVoicing * 0.25);
        
        return {
            score: score,
            upbeatEmphasis: upbeatEmphasis,
            attack: percussiveAttack,
            voicing: chordVoicing,
            technique: this.classifySkankTechnique(guitarTrack),
            authenticity: this.validateSkankAuthenticity(score)
        };
    }

    async evaluateBassRole(audioData, context) {
        // Analyze bass prominence and role in reggae context
        const bassTrack = this.isolateBassTrack(audioData);
        const prominence = this.analyzeBassProminence(bassTrack);
        const fundamentalEmphasis = this.analyzeFundamentalFrequencies(bassTrack);
        const rhythmicRole = this.analyzeBassRhythmicRole(bassTrack);
        const tonalCharacter = this.analyzeBassTonalCharacter(bassTrack);
        
        const score = (prominence * 0.3 +
                      fundamentalEmphasis * 0.25 +
                      rhythmicRole * 0.25 +
                      tonalCharacter * 0.2);
        
        return {
            score: score,
            prominence: prominence,
            fundamentalEmphasis: fundamentalEmphasis,
            rhythmicRole: rhythmicRole,
            tonalCharacter: tonalCharacter,
            technique: this.classifyBassTechnique(bassTrack)
        };
    }

    async evaluateRhythmSection(audioData, context) {
        // Analyze bass-drum relationship and groove tightness
        const bassTrack = this.isolateBassTrack(audioData);
        const drumTrack = this.isolateDrumTrack(audioData);
        
        const synchronization = this.analyzeBassDrumSync(bassTrack, drumTrack);
        const pocketFeel = this.analyzePocketFeel(bassTrack, drumTrack);
        const grooveTightness = this.analyzeGrooveTightness(bassTrack, drumTrack);
        
        const score = (synchronization * 0.4 +
                      pocketFeel * 0.35 +
                      grooveTightness * 0.25);
        
        return {
            score: score,
            synchronization: synchronization,
            pocketFeel: pocketFeel,
            tightness: grooveTightness,
            relationship: this.classifyRhythmSectionRelationship(bassTrack, drumTrack)
        };
    }

    async evaluateReggaeCharacteristics(audioData, context) {
        // Overall reggae genre adherence
        const genreMarkers = this.identifyGenreMarkers(audioData);
        const culturalElements = this.identifyCulturalElements(audioData);
        const stylisticAuthenticity = this.analyzeStylisticAuthenticity(audioData);
        
        const score = (genreMarkers.score * 0.4 +
                      culturalElements.score * 0.35 +
                      stylisticAuthenticity * 0.25);
        
        return {
            score: score,
            genreMarkers: genreMarkers,
            culturalElements: culturalElements,
            authenticity: stylisticAuthenticity,
            subgenre: this.classifyReggaeSubgenre(audioData)
        };
    }

    async evaluateInstrumentClarity(audioData, context) {
        // Analyze instrument separation and clarity
        const separationAnalysis = this.analyzeInstrumentSeparation(audioData);
        const clarityMetrics = this.analyzeClarityMetrics(audioData);
        const mixBalance = this.analyzeMixBalance(audioData);
        
        const score = (separationAnalysis * 0.4 +
                      clarityMetrics * 0.35 +
                      mixBalance * 0.25);
        
        return {
            score: score,
            separation: separationAnalysis,
            clarity: clarityMetrics,
            balance: mixBalance,
            issues: this.identifyMixIssues(audioData)
        };
    }

    async assessCulturalAuthenticity(audioData, context) {
        const assessments = {};
        
        // Run cultural validators
        for (const [validator, func] of Object.entries(this.culturalValidators)) {
            assessments[validator] = await func(audioData, context);
        }
        
        // Calculate overall cultural authenticity
        const traditional = (assessments.jamaican_timing.score * 0.3 +
                           assessments.traditional_instrumentation.score * 0.3 +
                           assessments.authentic_techniques.score * 0.4);
        
        const contemporary = assessments.cultural_appropriateness.score;
        
        const overall = (traditional * 0.7 + contemporary * 0.3);
        
        return {
            traditional: traditional,
            contemporary: contemporary,
            overall: overall,
            details: assessments,
            culturalMarkers: this.extractCulturalMarkers(assessments)
        };
    }

    calculateReggaeScore(metrics, culturalAssessment) {
        let technicalScore = 0;
        let musicalScore = 0;
        let culturalScore = culturalAssessment.overall;
        
        // Calculate technical score (instrument separation, clarity)
        if (metrics.instrumentalSeparation) {
            technicalScore = metrics.instrumentalSeparation.score;
        }
        
        // Calculate musical score (harmony, rhythm, arrangement)
        const musicalMetrics = ['harmony', 'rhythm', 'arrangement'];
        let musicalTotal = 0;
        let musicalCount = 0;
        
        musicalMetrics.forEach(metric => {
            if (metrics[metric]) {
                musicalTotal += metrics[metric].score;
                musicalCount++;
            }
        });
        
        if (musicalCount > 0) {
            musicalScore = musicalTotal / musicalCount;
        }
        
        // Weight the final score
        const weights = this.qualityWeights;
        return (technicalScore * weights.technical +
                musicalScore * weights.musical +
                culturalScore * weights.cultural);
    }

    generateImprovementRecommendations(metrics) {
        const recommendations = [];
        
        Object.entries(metrics).forEach(([metric, result]) => {
            if (result.score < 0.7) {
                recommendations.push(...this.getMetricRecommendations(metric, result));
            }
        });
        
        return recommendations;
    }

    getMetricRecommendations(metric, result) {
        const recommendationMap = {
            oneDropPresence: [
                'Emphasize beat 3 in drum pattern',
                'Use rim shot technique on snare',
                'Reduce beat 1 kick drum emphasis'
            ],
            skankAuthenticity: [
                'Focus on upbeat guitar strokes (beats 2 & 4)',
                'Use clean, bright guitar tone',
                'Apply percussive attack to guitar chords'
            ],
            bassProminence: [
                'Increase bass level in mix',
                'Emphasize fundamental frequencies (40-120 Hz)',
                'Use fingerstyle bass technique'
            ],
            grooveTightness: [
                'Tighten bass-drum synchronization',
                'Apply consistent laid-back timing',
                'Enhance rhythmic pocket feel'
            ]
        };
        
        return recommendationMap[metric] || [`Improve ${metric} quality`];
    }

    // Implementation helper methods (simplified for brevity)
    analyzeChordProgression(audioData) {
        return { reggaeCompatibility: 0.8, progressions: ['I-V-vi-IV'] };
    }

    analyzeChordVoicings(audioData) {
        return { jazzInfluence: 0.7, voicingTypes: ['open', 'rootless'] };
    }

    analyzeModalCharacteristics(audioData) {
        return { authenticity: 0.75, modes: ['mixolydian'] };
    }

    analyzeTempoStability(audioData) {
        return 0.85; // 85% tempo stability
    }

    analyzeRhythmicPocket(audioData) {
        return 0.8; // Good rhythmic pocket
    }

    analyzeSyncopation(audioData) {
        return 0.9; // Strong syncopation
    }

    analyzeHumanFeel(audioData) {
        return 0.7; // Natural human feel
    }

    isolateDrumTrack(audioData) {
        // Simplified drum track isolation
        return audioData; // In real implementation, would use frequency filtering
    }

    isolateGuitarTrack(audioData) {
        return audioData;
    }

    isolateBassTrack(audioData) {
        return audioData;
    }

    analyzeBeatEmphasis(drumTrack) {
        // Analyze energy at each beat position
        return [0.6, 0.4, 0.9, 0.5]; // Beat 3 emphasized (one drop)
    }

    analyzeOneDropCharacteristics(drumTrack) {
        return {
            beat3Emphasis: true,
            rimShotPresent: true,
            laidBackFeel: true,
            authenticity: 0.85
        };
    }

    calculateDetectionConfidence(beatEmphasis) {
        const beat3Strength = beatEmphasis[2];
        const beat1Strength = beatEmphasis[0];
        return beat3Strength > beat1Strength ? 0.9 : 0.3;
    }

    validateOneDropAuthenticity(characteristics) {
        let score = 0;
        if (characteristics.beat3Emphasis) score += 0.4;
        if (characteristics.rimShotPresent) score += 0.3;
        if (characteristics.laidBackFeel) score += 0.3;
        return score;
    }

    // Additional analysis methods
    analyzeUpbeatEmphasis(guitarTrack) {
        return 0.85; // Strong upbeat emphasis
    }

    analyzePercussiveAttack(guitarTrack) {
        return 0.8; // Good percussive attack
    }

    analyzeChordVoicing(guitarTrack) {
        return 0.75; // Appropriate chord voicing
    }

    classifySkankTechnique(guitarTrack) {
        return 'upstroke_emphasis';
    }

    validateSkankAuthenticity(score) {
        return score > 0.7 ? 'authentic' : 'needs_improvement';
    }

    analyzeBassProminence(bassTrack) {
        return 0.8; // Good bass prominence
    }

    analyzeFundamentalFrequencies(bassTrack) {
        return 0.85; // Strong fundamental emphasis
    }

    analyzeBassRhythmicRole(bassTrack) {
        return 0.8; // Good rhythmic foundation
    }

    analyzeBassTonalCharacter(bassTrack) {
        return 0.75; // Warm, woody character
    }

    classifyBassTechnique(bassTrack) {
        return 'fingerstyle_warm';
    }

    analyzeBassDrumSync(bassTrack, drumTrack) {
        return 0.85; // Good synchronization
    }

    analyzePocketFeel(bassTrack, drumTrack) {
        return 0.8; // Strong pocket feel
    }

    analyzeGrooveTightness(bassTrack, drumTrack) {
        return 0.82; // Tight groove
    }

    classifyRhythmSectionRelationship(bassTrack, drumTrack) {
        return 'locked_pocket';
    }

    identifyGenreMarkers(audioData) {
        return {
            score: 0.85,
            markers: ['one_drop_rhythm', 'upbeat_skank', 'prominent_bass']
        };
    }

    identifyCulturalElements(audioData) {
        return {
            score: 0.8,
            elements: ['jamaican_timing', 'traditional_instrumentation']
        };
    }

    analyzeStylisticAuthenticity(audioData) {
        return 0.85; // High stylistic authenticity
    }

    classifyReggaeSubgenre(audioData) {
        return 'roots_reggae';
    }

    analyzeInstrumentSeparation(audioData) {
        return 0.8; // Good instrument separation
    }

    analyzeClarityMetrics(audioData) {
        return 0.85; // High clarity
    }

    analyzeMixBalance(audioData) {
        return 0.8; // Good mix balance
    }

    identifyMixIssues(audioData) {
        return []; // No major issues
    }

    // Cultural validation methods
    async validateJamaicanTiming(audioData, context) {
        return {
            score: 0.85,
            characteristics: ['laid_back_feel', 'syncopated_emphasis'],
            authenticity: 'high'
        };
    }

    async validateTraditionalInstrumentation(audioData, context) {
        return {
            score: 0.8,
            instruments: ['electric_bass', 'clean_guitar', 'acoustic_drums'],
            authenticity: 'traditional'
        };
    }

    async validateAuthenticTechniques(audioData, context) {
        return {
            score: 0.82,
            techniques: ['upstroke_guitar', 'fingerstyle_bass', 'rim_shot_snare'],
            authenticity: 'authentic'
        };
    }

    async validateCulturalAppropriateness(audioData, context) {
        return {
            score: 0.9,
            assessment: 'culturally_appropriate',
            respectfulness: 'high'
        };
    }

    extractCulturalMarkers(assessments) {
        const markers = [];
        Object.values(assessments).forEach(assessment => {
            if (assessment.characteristics) {
                markers.push(...assessment.characteristics);
            }
            if (assessment.techniques) {
                markers.push(...assessment.techniques);
            }
        });
        return [...new Set(markers)]; // Remove duplicates
    }

    identifyRhythmicCharacteristics(audioData) {
        return ['one_drop_pattern', 'laid_back_timing', 'syncopated_accents'];
    }

    analyzeInstrumentBalance(audioData) {
        return 0.8; // Good instrument balance
    }

    analyzeFrequencyDistribution(audioData) {
        return 0.85; // Good frequency separation
    }

    analyzeSpatialArrangement(audioData) {
        return 0.8; // Good stereo arrangement
    }

    generateHarmonyRecommendations(score) {
        if (score < 0.7) {
            return [
                'Use more jazz-influenced chord voicings',
                'Incorporate modal characteristics (mixolydian/dorian)',
                'Ensure chord progressions support reggae feel'
            ];
        }
        return [];
    }

    async assessReggaeQuality(musicData, context) {
        console.log('🎵 DEBUG: ReggaeQualityAssessmentAI.assessReggaeQuality called');
        console.log('🎯 Evaluating reggae authenticity and quality metrics...');
        
        try {
            // Use the main evaluation method
            const evaluation = await this.evaluateReggaeGeneration(musicData, context);
            
            // Format the result to match expected structure
            const qualityResult = {
                overall: evaluation.overallScore,
                score: evaluation.overallScore,
                metrics: evaluation.metrics,
                recommendations: evaluation.recommendations,
                issues: evaluation.issues || [],
                culturalAuthenticity: evaluation.culturalAuthenticity
            };
            
            console.log(`✅ Reggae quality assessment complete - Score: ${(qualityResult.overall * 100).toFixed(1)}%`);
            return qualityResult;
            
        } catch (error) {
            console.error('❌ Reggae quality assessment failed:', error);
            throw error;
        }
    }
}

module.exports = {
    ReggaeConflictResolver,
    ReggaeQualityAssessmentAI
};