/**
 * Beat Generator - Modular JavaScript Beat Generator for Single-Instrument Tracks
 * 
 * Creates single-instrument beats using NSynth samples following DAW and music theory conventions.
 * Supports multiple genres, time signatures, and BPMs with proper swing and quantization.
 * 
 * @author AI Music Backend
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');
const crypto = require('crypto');

// Import modular components
const { TimingEngine } = require('../modules/timingEngine');
const { PatternGenerator } = require('../modules/patternGenerator');
const { ComplexBeatGenerator } = require('../modules/complexBeatGenerator');
const { MelodicPatternGenerator } = require('../modules/melodicPatternGenerator');
const { InstrumentSelector } = require('../modules/instrumentSelector');
const { WavExporter } = require('../modules/wavExporter');
const { PromptInterpreter } = require('../modules/promptInterpreter');

/**
 * Main Beat Generator class
 * Orchestrates the creation of single-instrument beats using modular components
 */
class BeatGenerator {
  constructor() {
    this.timingEngine = new TimingEngine();
    this.patternGenerator = new PatternGenerator();
    this.complexBeatGenerator = new ComplexBeatGenerator();
    this.melodicPatternGenerator = new MelodicPatternGenerator();
    this.instrumentSelector = new InstrumentSelector();
    this.wavExporter = new WavExporter();
    this.promptInterpreter = new PromptInterpreter();
    
    this.defaultOptions = {
      bpm: 120,
      timeSignature: '4/4',
      bars: 1,
      keyword: 'default',
      instrument: 'auto',
      outputPath: './generated',
      seed: null,
      complexity: 'auto' // New: auto, simple, moderate, complex, advanced
    };
  }

  /**
   * Generate a beat based on provided options
   * @param {Object} options - Configuration object
   * @param {string} options.songName - Required song name for output file
   * @param {number} [options.bpm=120] - Beats per minute (60-200)
   * @param {string} [options.timeSignature='4/4'] - Time signature ('4/4' or '3/4')
   * @param {number} [options.bars=1] - Pattern length in bars (1, 2, or 4)
   * @param {string} [options.keyword='default'] - Style keyword (jazz, funk, house, etc.)
   * @param {string} [options.instrument='auto'] - Instrument selection
   * @param {string} [options.complexity='auto'] - Beat complexity: auto, simple, moderate, complex, advanced
   * @param {string} [options.outputPath='./generated'] - Output directory
   * @param {string} [options.seed] - Random seed for reproducibility
   * @returns {Promise<string>} Path to generated WAV file
   */
  async generateBeat(options = {}) {
    try {
      // Validate and merge options
      const config = this.validateAndMergeOptions(options);
      
      console.log(`🎵 Generating beat: ${config.songName}`);
      console.log(`🎼 Style: ${config.keyword}, BPM: ${config.bpm}, Bars: ${config.bars}`);
      
      // Set random seed if provided
      if (config.seed) {
        this.setSeed(config.seed);
      }
      
      // Step 1: Configure timing engine with music theory rules
      const timingConfig = this.timingEngine.configure({
        bpm: config.bpm,
        timeSignature: config.timeSignature,
        bars: config.bars,
        keyword: config.keyword
      });
      
      console.log(`⏰ Timing configured: ${timingConfig.stepsPerBar} steps/bar, ${timingConfig.totalSteps} total steps`);
      
      // Step 2: Generate pattern based on instrument type and style
      let pattern;
      
      // Check if instrument should use melodic patterns instead of drum patterns
      if (config.instrument !== 'auto' && MelodicPatternGenerator.isMelodicInstrument(config.instrument)) {
        console.log(`🎼 Generating melodic pattern for ${config.instrument}...`);
        
        // Generate melodic pattern using music theory
        const melodicResult = this.melodicPatternGenerator.generateMelodicPattern({
          instrument: config.instrument,
          genre: config.keyword,
          bpm: config.bpm,
          bars: config.bars,
          key: 'C', // Default to C major for now
          seed: config.seed,
          playMode: config.playMode || 'auto'
        });
        
        // Convert melodic pattern to compatible format
        // Calculate total pattern duration in beats (bars * 4 beats per bar)
        const totalDurationBeats = config.bars * 4;
        
        pattern = {
          events: melodicResult.events.map(event => ({
            note: event.note, // MIDI note number instead of drum name
            time: event.time,
            position: event.time / totalDurationBeats, // Convert time to normalized position (0-1)
            velocity: event.velocity,
            duration: event.duration,
            isMelodicNote: true // Flag to identify melodic notes
          })),
          metadata: melodicResult.metadata
        };
        
        console.log(`🎵 Melodic pattern generated: ${pattern.events.length} events`);
        console.log(`🎼 Key: ${melodicResult.metadata.key} ${melodicResult.metadata.mode}`);
        console.log(`🎵 Progression: ${melodicResult.metadata.progression.join(' - ')}`);
        
      } else {
        // Generate drum pattern with complexity control
        console.log(`🥁 Generating drum pattern...`);
        
        // Determine complexity level
        const complexity = config.complexity === 'auto' ? 
          this.complexBeatGenerator.recommendComplexity(config.keyword, config.bars) : 
          config.complexity;
          
        console.log(`🎯 Beat complexity: ${complexity}`);
        
        // Choose between simple and complex beat generation
        if (complexity === 'simple' || (complexity === 'auto' && config.bars === 1)) {
          // Use simple pattern generator (backward compatible)
          pattern = this.patternGenerator.generate({
            keyword: config.keyword,
            timingConfig: timingConfig,
            seed: config.seed
          });
          
          console.log(`🥁 Simple pattern generated: ${pattern.events.length} events`);
          this.printPatternGrid(pattern, timingConfig);
          
        } else {
          // Use complex beat generator with layered architecture
          const complexPattern = this.complexBeatGenerator.generateComplexBeat({
            genre: config.keyword,
            complexity: complexity,
            timingConfig: timingConfig,
            seed: config.seed
          });
          
          // Convert complex pattern to compatible format
          pattern = {
            events: complexPattern.events.map(event => ({
              position: event.position,
              velocity: event.velocity,
              note: event.note,
              ghost: event.ghost || false,
              layer: event.layer,
              technique: event.technique,
              humanized: event.humanized,
              swung: event.swung
            })),
            style: complexPattern.genre,
            complexity: complexity,
            metadata: {
              ...complexPattern.metadata,
              layersUsed: complexPattern.metadata.layersUsed,
              totalComplexity: complexPattern.metadata.totalComplexity
            }
          };
          
          console.log(`🎭 Complex pattern generated: ${pattern.events.length} events`);
          console.log(`🔧 Layers used: ${pattern.metadata.layersUsed.join(', ')}`);
          console.log(`📊 Complexity score: ${pattern.metadata.totalComplexity}`);
          this.printPatternGrid(pattern, timingConfig);
        }
      }
      
      // Step 3: Select appropriate instrument samples
      const instrumentData = await this.instrumentSelector.select({
        instrument: config.instrument,
        keyword: config.keyword,
        pattern: pattern
      });
      
      console.log(`🎹 Instrument selected: ${instrumentData.type} (${instrumentData.samples.length} samples)`);
      
      // Step 4: Create timing-accurate WAV file
      // Add suffix based on pattern type: DB (Drum-Based), MB (Melodic-Based), or CB (Complex Beat)
      let suffix = '-DB'; // Default drum-based
      if (config.instrument !== 'auto') {
        suffix = '-MB'; // Melodic-based
      } else if (pattern.complexity && pattern.complexity !== 'simple') {
        suffix = '-CB'; // Complex beat
      }
      const outputFilename = `${config.songName}${suffix}.wav`;
      const outputPath = path.join(config.outputPath, outputFilename);
      
      // Collect comprehensive generation metadata
      const generationMetadata = {
        style: config.keyword,
        seed: config.seed || 'Random',
        algorithm: pattern.complexity ? 'Complex Multi-Layer Beat Generator' : 'Modular Pattern Generator',
        testType: this.getTestType(config.songName),
        originalPrompt: config.originalPrompt || null,
        interpretedParams: config.interpretedParams || null,
        spotifyWarnings: config.spotifyWarnings || null,
        parameters: {
          bpm: config.bpm,
          timeSignature: config.timeSignature,
          bars: config.bars,
          instrument: config.instrument,
          complexity: config.complexity,
          outputPath: config.outputPath
        },
        patternInfo: {
          totalEvents: pattern.events.length,
          patternComplexity: this.calculatePatternComplexity(pattern),
          dominantNotes: this.getDominantNotes(pattern),
          // Add complex beat metadata if available
          ...(pattern.metadata && {
            layersUsed: pattern.metadata.layersUsed,
            totalComplexityScore: pattern.metadata.totalComplexity,
            genreRules: pattern.metadata.genreRules
          })
        },
        generatedAt: new Date().toISOString()
      };
      
      await this.wavExporter.export({
        pattern: pattern,
        timingConfig: timingConfig,
        instrumentData: instrumentData,
        outputPath: outputPath,
        songName: config.songName,
        generationMetadata: generationMetadata
      });
      
      console.log(`✅ Beat generated successfully: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      console.error(`❌ Beat generation failed:`, error);
      throw error;
    }
  }

  /**
   * Validate and merge user options with defaults
   * @private
   */
  validateAndMergeOptions(options) {
    if (!options.songName) {
      throw new Error('songName is required');
    }
    
    const config = { ...this.defaultOptions, ...options };
    
    // Validate BPM range
    if (config.bpm < 60 || config.bpm > 200) {
      throw new Error('BPM must be between 60 and 200');
    }
    
    // Validate time signature
    if (!['4/4', '3/4'].includes(config.timeSignature)) {
      throw new Error('Time signature must be 4/4 or 3/4');
    }
    
    // Validate bars (allow more bars for complex beats)
    // For auto complexity, determine based on recommended complexity
    let effectiveComplexity = config.complexity;
    if (config.complexity === 'auto') {
      effectiveComplexity = this.complexBeatGenerator.recommendComplexity(config.keyword, config.bars);
    }
    
    const maxBars = effectiveComplexity === 'advanced' ? 8 : (effectiveComplexity === 'complex' ? 4 : 4);
    if (config.bars < 1 || config.bars > maxBars || ![1, 2, 4, 8].includes(config.bars)) {
      throw new Error(`Bars must be 1, 2, 4, or ${maxBars === 8 ? '8 (for advanced complexity)' : '4'}`);
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(config.outputPath)) {
      fs.mkdirSync(config.outputPath, { recursive: true });
    }
    
    return config;
  }

  /**
   * Set random seed for reproducible results
   * @private
   */
  setSeed(seed) {
    if (typeof seed === 'string') {
      // Convert string to numeric seed
      const hash = crypto.createHash('md5').update(seed).digest('hex');
      this.randomSeed = parseInt(hash.substring(0, 8), 16);
    } else {
      this.randomSeed = seed;
    }
    
    // Set seed for all modules
    this.patternGenerator.setSeed(this.randomSeed);
    this.instrumentSelector.setSeed(this.randomSeed);
  }

  /**
   * Print visual representation of the generated pattern
   * @private
   */
  printPatternGrid(pattern, timingConfig) {
    const grid = Array(timingConfig.totalSteps).fill('·');
    
    pattern.events.forEach(event => {
      const stepIndex = Math.floor(event.position * timingConfig.totalSteps);
      if (stepIndex >= 0 && stepIndex < timingConfig.totalSteps) {
        grid[stepIndex] = this.getEventSymbol(event);
      }
    });
    
    console.log(`📊 Pattern Grid (${timingConfig.stepsPerBar} steps per bar):`);
    
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      const barStart = bar * timingConfig.stepsPerBar;
      const barEnd = barStart + timingConfig.stepsPerBar;
      const barGrid = grid.slice(barStart, barEnd);
      
      // Add beat markers (every 4 steps in 4/4, every 3 in 3/4)
      const beatsPerBar = timingConfig.timeSignature === '4/4' ? 4 : 3;
      const stepsPerBeat = timingConfig.stepsPerBar / beatsPerBar;
      
      let barDisplay = '';
      for (let i = 0; i < barGrid.length; i++) {
        if (i % stepsPerBeat === 0) {
          barDisplay += '|';
        }
        barDisplay += barGrid[i];
      }
      barDisplay += '|';
      
      console.log(`   Bar ${bar + 1}: ${barDisplay}`);
    }
    
    console.log(`   Legend: X=accent, x=normal, g=ghost, ·=rest`);
  }

  /**
   * Get display symbol for pattern event
   * @private
   */
  getEventSymbol(event) {
    if (event.velocity >= 0.8) return 'X'; // Accent
    if (event.velocity <= 0.3) return 'g'; // Ghost note
    return 'x'; // Normal hit
  }

  /**
   * Determine test type based on song name
   * @private
   */
  getTestType(songName) {
    if (songName.includes('TimingTest')) return 'Timing Accuracy Test';
    if (songName.includes('StyleTest')) return 'Style Implementation Test';
    if (songName.includes('ModuleTest')) return 'Module Integration Test';
    if (songName.includes('EdgeTest')) return 'Edge Case Test';
    if (songName.includes('TrailSong') || songName.includes('LateNight') || songName.includes('HouseTest')) {
      return 'Required Example Test';
    }
    return 'Manual Generation';
  }

  /**
   * Calculate pattern complexity score
   * @private
   */
  calculatePatternComplexity(pattern) {
    if (!pattern.events || pattern.events.length === 0) return 0;
    
    // Factors: event count, velocity variation, timing variation, ghost notes
    const eventCount = pattern.events.length;
    const velocities = pattern.events.map(e => e.velocity || 0.8);
    const velocityVariation = Math.max(...velocities) - Math.min(...velocities);
    const ghostNotes = pattern.events.filter(e => e.ghost).length;
    const uniqueTimings = new Set(pattern.events.map(e => Math.round((e.position || 0) * 16))).size;
    
    // Normalize to 0-1 scale
    const complexityScore = Math.min(1, 
      (eventCount / 32) * 0.4 +           // Event density (max 32 events)
      velocityVariation * 0.3 +           // Dynamic range
      (ghostNotes / eventCount) * 0.2 +   // Ghost note ratio
      (uniqueTimings / 16) * 0.1          // Timing diversity
    );
    
    return Math.round(complexityScore * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get dominant notes in pattern
   * @private
   */
  getDominantNotes(pattern) {
    if (!pattern.events || pattern.events.length === 0) return [];
    
    const noteCounts = {};
    pattern.events.forEach(event => {
      const note = event.note || 'Unknown';
      noteCounts[note] = (noteCounts[note] || 0) + 1;
    });
    
    // Sort by frequency and return top 3
    return Object.entries(noteCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([note, count]) => ({ note, count, percentage: Math.round((count / pattern.events.length) * 100) }));
  }
}

// Export main class and create convenience function
const beatGenerator = new BeatGenerator();

/**
 * Convenience function for generating beats
 * @param {Object} options - Beat generation options
 * @returns {Promise<string>} Path to generated WAV file
 */
async function generateBeat(options) {
  return await beatGenerator.generateBeat(options);
}

module.exports = {
  BeatGenerator,
  generateBeat
};

// CLI usage when run directly
if (require.main === module) {
  const examples = [
    { songName: "TrailSong1", keyword: "funk", bpm: 110, instrument: "auto" },
    { songName: "LateNight", keyword: "lo-fi", bpm: 75, bars: 2 },
    { songName: "HouseTest", keyword: "house", bpm: 125, bars: 2, instrument: "auto" }
  ];
  
  console.log('🎵 Beat Generator - Running Examples...\n');
  
  async function runExamples() {
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      console.log(`\n=== Example ${i + 1}: ${example.songName} ===`);
      
      try {
        const outputPath = await generateBeat(example);
        console.log(`✅ Generated: ${outputPath}\n`);
      } catch (error) {
        console.error(`❌ Example ${i + 1} failed:`, error.message);
      }
    }
    
    console.log('🎉 All examples completed!');
  }
  
  runExamples().catch(console.error);
}