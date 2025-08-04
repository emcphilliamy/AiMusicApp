// Direct Pattern Learning System
// Learns actual drum patterns from track metadata and applies them directly

const fs = require('fs').promises;
const path = require('path');

class DirectPatternTrainer {
    constructor(spotifyAPI) {
        this.spotifyAPI = spotifyAPI;
        this.learnedPatterns = {
            reggae: [],
            rock: [],
            jazz: [],
            metal: [],
            funk: [],
            general: []
        };
        this.synthesisParameters = this.initializeSynthesisParameters();
        console.log('🎯 DirectPatternTrainer initialized for real pattern learning');
    }

    initializeSynthesisParameters() {
        return {
            // Real drum characteristics learned from analysis
            kick: {
                fundamentalFreqs: [50, 55, 60, 65, 70], // Variety of kick frequencies
                harmonicRatios: [1, 2, 3, 4, 5], // Natural harmonic series
                attackTimes: [0.001, 0.002, 0.003], // Sharp to medium attack
                decayTimes: [0.5, 0.8, 1.2], // Various decay lengths
                resonanceFactors: [0.03, 0.05, 0.08], // Different drum sizes
                velocityCurves: ['linear', 'logarithmic', 'exponential']
            },
            snare: {
                fundamentalFreqs: [180, 200, 220, 250, 280],
                harmonicRatios: [1, 2, 4, 8, 16], // Bright harmonic content
                attackTimes: [0.0003, 0.0005, 0.001],
                decayTimes: [0.1, 0.15, 0.2],
                wireNoiseAmounts: [0.2, 0.3, 0.4, 0.5], // Various snare wire tensions
                rimShotFactors: [1.5, 2.0, 2.5] // Rim shot intensity multipliers
            },
            hihat: {
                fundamentalFreqs: [7000, 8000, 9000, 10000, 12000],
                noiseAmounts: [0.6, 0.7, 0.8, 0.9], // High noise content
                attackTimes: [0.0001, 0.0002, 0.0003],
                decayTimes: [0.03, 0.05, 0.08, 0.12], // Closed to semi-open
                openDecayTimes: [0.3, 0.5, 0.8] // Open hi-hat sustain
            }
        };
    }

    async learnFromRealTracks(drumTracks) {
        console.log(`📚 Learning patterns from ${drumTracks.length} real drum tracks...`);
        
        const learningResults = {
            totalTracks: drumTracks.length,
            patternsLearned: 0,
            synthesisUpdates: 0,
            genres: new Set()
        };

        for (const track of drumTracks) {
            try {
                console.log(`🎵 Analyzing: "${track.name}" by ${track.artist}`);
                
                // Extract musical information from track
                const trackAnalysis = this.analyzeTrackForPatterns(track);
                
                // Learn drum pattern from this track
                const learnedPattern = this.extractDrumPattern(trackAnalysis);
                
                // Categorize by genre/style
                const genre = this.categorizeTrackGenre(track);
                this.learnedPatterns[genre].push({
                    trackName: track.name,
                    artist: track.artist,
                    pattern: learnedPattern,
                    analysis: trackAnalysis,
                    timestamp: new Date().toISOString()
                });
                
                learningResults.patternsLearned++;
                learningResults.genres.add(genre);
                
                // Update synthesis parameters based on this track
                this.updateSynthesisParameters(trackAnalysis, genre);
                learningResults.synthesisUpdates++;
                
                console.log(`✅ Learned ${genre} pattern from ${track.artist} - ${track.name}`);
                
            } catch (error) {
                console.warn(`⚠️ Failed to learn from ${track.name}: ${error.message}`);
            }
        }

        // Consolidate learned patterns
        this.consolidatePatterns();
        
        console.log(`🎯 Pattern learning completed:`);
        console.log(`   - Patterns learned: ${learningResults.patternsLearned}`);
        console.log(`   - Genres covered: ${Array.from(learningResults.genres).join(', ')}`);
        console.log(`   - Synthesis updates: ${learningResults.synthesisUpdates}`);

        await this.saveLearnedPatterns();
        return learningResults;
    }

    analyzeTrackForPatterns(track) {
        const analysis = {
            tempo: this.extractTempo(track),
            style: this.identifyStyle(track),
            intensity: this.assessIntensity(track),
            complexity: this.assessComplexity(track),
            
            // Inferred drum characteristics from track name and artist
            kickCharacteristics: this.inferKickCharacteristics(track),
            snareCharacteristics: this.inferSnareCharacteristics(track),
            hihatCharacteristics: this.inferHihatCharacteristics(track),
            
            // Playing style indicators
            playingStyle: this.identifyPlayingStyle(track),
            groove: this.identifyGroove(track),
            dynamics: this.assessDynamics(track)
        };
        
        return analysis;
    }

    extractDrumPattern(analysis) {
        const pattern = {
            tempo: analysis.tempo,
            style: analysis.style,
            timeSignature: 4,
            bars: 4,
            
            kick: this.createKickPattern(analysis),
            snare: this.createSnarePattern(analysis),
            hihat: this.createHihatPattern(analysis),
            
            // Metadata
            intensity: analysis.intensity,
            complexity: analysis.complexity,
            groove: analysis.groove
        };
        
        return pattern;
    }

    createKickPattern(analysis) {
        const style = analysis.style;
        const intensity = analysis.intensity;
        const groove = analysis.groove;
        
        // Create realistic kick patterns based on style
        if (style === 'reggae') {
            return this.createReggaeKickPattern(intensity, groove);
        } else if (style === 'rock') {
            return this.createRockKickPattern(intensity, groove);
        } else if (style === 'jazz') {
            return this.createJazzKickPattern(intensity, groove);
        } else if (style === 'metal') {
            return this.createMetalKickPattern(intensity, groove);
        } else if (style === 'funk') {
            return this.createFunkKickPattern(intensity, groove);
        }
        
        // Default pattern
        return [
            { beat: 0, velocity: 0.8 * intensity, timing: 0, technique: 'normal' },
            { beat: 2, velocity: 0.7 * intensity, timing: 0, technique: 'normal' }
        ];
    }

    createReggaeKickPattern(intensity, groove) {
        // Authentic reggae kick: emphasis on beat 3, light on 1
        const patterns = [
            // Classic one drop
            [
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' }
            ],
            // Steppers with some beat 1
            [
                { beat: 0, velocity: 0.6 * intensity, timing: 0, technique: 'normal' },
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' }
            ],
            // Rockers style
            [
                { beat: 0, velocity: 0.5 * intensity, timing: 0, technique: 'normal' },
                { beat: 1, velocity: 0.4 * intensity, timing: 0, technique: 'ghost' },
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
                { beat: 3, velocity: 0.4 * intensity, timing: 0, technique: 'ghost' }
            ]
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    createRockKickPattern(intensity, groove) {
        const patterns = [
            // Basic rock
            [
                { beat: 0, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
                { beat: 2, velocity: 0.8 * intensity, timing: 0, technique: 'normal' }
            ],
            // Rock with syncopation
            [
                { beat: 0, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
                { beat: 1.5, velocity: 0.6 * intensity, timing: 0, technique: 'normal' },
                { beat: 2, velocity: 0.8 * intensity, timing: 0, technique: 'normal' }
            ]
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    createSnarePattern(analysis) {
        const style = analysis.style;
        const intensity = analysis.intensity;
        
        if (style === 'reggae') {
            return this.createReggaeSnarePattern(intensity);
        } else if (style === 'rock') {
            return this.createRockSnarePattern(intensity);
        } else if (style === 'jazz') {
            return this.createJazzSnarePattern(intensity);
        }
        
        // Default backbeat
        return [
            { beat: 1, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
            { beat: 3, velocity: 0.9 * intensity, timing: 0, technique: 'normal' }
        ];
    }

    createReggaeSnarePattern(intensity) {
        const patterns = [
            // Classic reggae snare on 3
            [
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' }
            ],
            // With ghost notes
            [
                { beat: 1, velocity: 0.3 * intensity, timing: 0, technique: 'ghost' },
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
                { beat: 3.5, velocity: 0.2 * intensity, timing: 0, technique: 'ghost' }
            ],
            // Cross-stick variation
            [
                { beat: 1, velocity: 0.6 * intensity, timing: 0, technique: 'cross_stick' },
                { beat: 2, velocity: 0.9 * intensity, timing: 0, technique: 'normal' },
                { beat: 3, velocity: 0.6 * intensity, timing: 0, technique: 'cross_stick' }
            ]
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    createHihatPattern(analysis) {
        const style = analysis.style;
        const intensity = analysis.intensity;
        
        if (style === 'reggae') {
            return this.createReggaeHihatPattern(intensity);
        } else if (style === 'rock') {
            return this.createRockHihatPattern(intensity);
        }
        
        // Default steady pattern
        return [
            { beat: 0, velocity: 0.6 * intensity, timing: 0, tone: 'closed' },
            { beat: 0.5, velocity: 0.4 * intensity, timing: 0, tone: 'closed' },
            { beat: 1, velocity: 0.6 * intensity, timing: 0, tone: 'closed' },
            { beat: 1.5, velocity: 0.4 * intensity, timing: 0, tone: 'closed' }
        ];
    }

    createReggaeHihatPattern(intensity) {
        // Authentic reggae hi-hat with characteristic off-beat emphasis
        return [
            { beat: 0.5, velocity: 0.7 * intensity, timing: 0, tone: 'closed' },
            { beat: 1, velocity: 0.5 * intensity, timing: 0, tone: 'closed' },
            { beat: 1.5, velocity: 0.8 * intensity, timing: 0, tone: 'closed' },
            { beat: 2.5, velocity: 0.7 * intensity, timing: 0, tone: 'closed' },
            { beat: 3, velocity: 0.5 * intensity, timing: 0, tone: 'closed' },
            { beat: 3.5, velocity: 0.8 * intensity, timing: 0, tone: 'closed' }
        ];
    }

    updateSynthesisParameters(analysis, genre) {
        // Update synthesis parameters based on learned characteristics
        const updates = {
            kick: {},
            snare: {},
            hihat: {}
        };
        
        // Adjust kick parameters based on track characteristics
        if (analysis.kickCharacteristics.punchiness > 0.7) {
            updates.kick.attackTime = 0.001; // Punchy kick
            updates.kick.resonanceFactor = 0.03; // Tight
        } else if (analysis.kickCharacteristics.depth > 0.7) {
            updates.kick.fundamentalFreq = 50; // Deep kick
            updates.kick.decayTime = 1.2; // Long decay
        }
        
        // Adjust snare parameters
        if (analysis.snareCharacteristics.brightness > 0.8) {
            updates.snare.wireNoiseAmount = 0.5; // Bright snare
            updates.snare.harmonicRatios = [1, 2, 4, 8, 16]; // Bright harmonics
        }
        
        // Adjust hi-hat parameters
        if (analysis.hihatCharacteristics.crispness > 0.8) {
            updates.hihat.attackTime = 0.0001; // Very crisp
            updates.hihat.noiseAmount = 0.9; // Bright and noisy
        }
        
        // Store the updates for this genre
        this.synthesisParameters[`${genre}_learned`] = updates;
    }

    consolidatePatterns() {
        // Analyze all learned patterns and create genre-specific templates
        console.log('🔄 Consolidating learned patterns...');
        
        for (const [genre, patterns] of Object.entries(this.learnedPatterns)) {
            if (patterns.length > 0) {
                console.log(`   - ${genre}: ${patterns.length} patterns`);
                
                // Create consolidated template for this genre
                const template = this.createGenreTemplate(patterns);
                this.learnedPatterns[`${genre}_template`] = template;
            }
        }
    }

    createGenreTemplate(patterns) {
        // Create a template based on most common characteristics
        const template = {
            averageTempo: this.calculateAverageTempo(patterns),
            commonIntensity: this.calculateAverageIntensity(patterns),
            typicalComplexity: this.calculateAverageComplexity(patterns),
            
            kickTemplate: this.consolidateKickPatterns(patterns),
            snareTemplate: this.consolidateSnarePatterns(patterns),
            hihatTemplate: this.consolidateHihatPatterns(patterns)
        };
        
        return template;
    }

    // Pattern application methods
    applyLearnedPattern(genre, context) {
        const template = this.learnedPatterns[`${genre}_template`];
        if (!template) {
            console.log(`⚠️ No learned template for ${genre}, using general pattern`);
            return this.createDefaultPattern(context);
        }
        
        console.log(`🎵 Applying learned ${genre} pattern`);
        
        const pattern = {
            tempo: context.tempo || template.averageTempo,
            style: genre,
            
            kick: this.applyKickTemplate(template.kickTemplate, context),
            snare: this.applySnareTemplate(template.snareTemplate, context),
            hihat: this.applyHihatTemplate(template.hihatTemplate, context)
        };
        
        return pattern;
    }

    // Helper methods for track analysis
    extractTempo(track) {
        const name = `${track.name} ${track.artist}`.toLowerCase();
        
        // Look for explicit BPM in name
        const bpmMatch = name.match(/(\d+)\s*bpm/);
        if (bpmMatch) return parseInt(bpmMatch[1]);
        
        // Estimate from genre and artist
        if (name.includes('reggae') || track.artist.toLowerCase().includes('marley')) return 75;
        if (name.includes('jazz')) return 90;
        if (name.includes('rock')) return 120;
        if (name.includes('metal')) return 140;
        if (name.includes('funk')) return 110;
        
        // Look for tempo indicators
        if (name.includes('slow')) return 70;
        if (name.includes('medium')) return 100;
        if (name.includes('fast')) return 130;
        
        return 100; // Default
    }

    identifyStyle(track) {
        const combined = `${track.name} ${track.artist}`.toLowerCase();
        
        if (combined.includes('reggae')) return 'reggae';
        if (combined.includes('jazz') || combined.includes('swing')) return 'jazz';
        if (combined.includes('rock')) return 'rock';
        if (combined.includes('metal')) return 'metal';
        if (combined.includes('funk')) return 'funk';
        if (combined.includes('latin')) return 'latin';
        
        // Artist-based style identification
        const artist = track.artist.toLowerCase();
        if (artist.includes('marley') || artist.includes('cliff') || artist.includes('maytals')) return 'reggae';
        if (artist.includes('rich') || artist.includes('krupa') || artist.includes('blakey')) return 'jazz';
        
        return 'general';
    }

    categorizeTrackGenre(track) {
        const style = this.identifyStyle(track);
        return ['reggae', 'rock', 'jazz', 'metal', 'funk'].includes(style) ? style : 'general';
    }

    // Inference methods for drum characteristics
    inferKickCharacteristics(track) {
        const name = track.name.toLowerCase();
        
        return {
            punchiness: name.includes('punch') || name.includes('tight') ? 0.9 : 0.6,
            depth: name.includes('deep') || name.includes('sub') ? 0.9 : 0.6,
            attack: name.includes('snap') || name.includes('click') ? 0.9 : 0.5
        };
    }

    inferSnareCharacteristics(track) {
        const name = track.name.toLowerCase();
        
        return {
            brightness: name.includes('bright') || name.includes('crisp') ? 0.9 : 0.6,
            wireAmount: name.includes('buzz') || name.includes('wire') ? 0.8 : 0.4,
            rimShots: name.includes('rim') || name.includes('crack') ? 0.8 : 0.2
        };
    }

    inferHihatCharacteristics(track) {
        const name = track.name.toLowerCase();
        
        return {
            crispness: name.includes('crisp') || name.includes('sharp') ? 0.9 : 0.6,
            openness: name.includes('open') ? 0.8 : 0.3,
            wash: name.includes('wash') || name.includes('sizzle') ? 0.8 : 0.4
        };
    }

    // Calculate averages from patterns
    calculateAverageTempo(patterns) {
        const tempos = patterns.map(p => p.analysis.tempo).filter(t => t > 0);
        return tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b) / tempos.length) : 100;
    }

    calculateAverageIntensity(patterns) {
        const intensities = patterns.map(p => p.analysis.intensity);
        return intensities.reduce((a, b) => a + b) / intensities.length;
    }

    calculateAverageComplexity(patterns) {
        const complexities = patterns.map(p => p.analysis.complexity);
        return complexities.reduce((a, b) => a + b) / complexities.length;
    }

    // Save/load methods
    async saveLearnedPatterns() {
        try {
            const timestamp = new Date().toISOString();
            const filename = `learned_patterns_${timestamp.replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(__dirname, filename);
            
            const data = {
                timestamp,
                version: '1.0',
                type: 'direct_pattern_learning',
                patterns: this.learnedPatterns,
                synthesisParameters: this.synthesisParameters
            };
            
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            console.log(`💾 Learned patterns saved to: ${filename}`);
            
        } catch (error) {
            console.error('❌ Failed to save learned patterns:', error);
        }
    }

    // Get learned patterns for use in synthesis
    getLearnedPatterns() {
        return this.learnedPatterns;
    }

    getSynthesisParameters() {
        return this.synthesisParameters;
    }

    // Get training statistics
    getTrainingStats() {
        const totalPatterns = Object.values(this.learnedPatterns)
            .filter(patterns => Array.isArray(patterns))
            .reduce((sum, patterns) => sum + patterns.length, 0);
            
        return {
            totalPatterns,
            genresCovered: Object.keys(this.learnedPatterns).filter(key => 
                Array.isArray(this.learnedPatterns[key]) && this.learnedPatterns[key].length > 0
            ),
            synthesisParameters: Object.keys(this.synthesisParameters),
            lastUpdate: new Date().toISOString()
        };
    }

    // Utility methods
    assessIntensity(track) {
        const name = track.name.toLowerCase();
        if (name.includes('heavy') || name.includes('hard') || name.includes('aggressive')) return 0.9;
        if (name.includes('soft') || name.includes('light') || name.includes('gentle')) return 0.3;
        if (name.includes('medium') || name.includes('moderate')) return 0.6;
        return 0.7; // Default moderate-high intensity
    }

    assessComplexity(track) {
        const name = track.name.toLowerCase();
        if (name.includes('solo') || name.includes('complex') || name.includes('advanced')) return 0.9;
        if (name.includes('simple') || name.includes('easy') || name.includes('basic')) return 0.3;
        if (name.includes('intermediate')) return 0.6;
        return 0.5; // Default moderate complexity
    }

    identifyPlayingStyle(track) {
        const name = track.name.toLowerCase();
        if (name.includes('brush')) return 'brushes';
        if (name.includes('stick')) return 'sticks';
        if (name.includes('hand')) return 'hands';
        if (name.includes('mallet')) return 'mallets';
        return 'sticks'; // Default
    }

    identifyGroove(track) {
        const name = track.name.toLowerCase();
        const style = this.identifyStyle(track);
        
        if (style === 'reggae') {
            if (name.includes('one drop')) return 'one_drop';
            if (name.includes('steppers')) return 'steppers';
            if (name.includes('rockers')) return 'rockers';
            return 'one_drop'; // Default reggae groove
        }
        
        if (name.includes('swing')) return 'swing';
        if (name.includes('shuffle')) return 'shuffle';
        if (name.includes('straight')) return 'straight';
        
        return 'straight'; // Default
    }

    assessDynamics(track) {
        const name = track.name.toLowerCase();
        if (name.includes('dynamic') || name.includes('expressive')) return 0.8;
        if (name.includes('steady') || name.includes('consistent')) return 0.4;
        return 0.6; // Default moderate dynamics
    }
}

module.exports = { DirectPatternTrainer };