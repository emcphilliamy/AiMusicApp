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
const { TimingEngine } = require('./modules/timingEngine');
const { PatternGenerator } = require('./modules/patternGenerator');
const { InstrumentSelector } = require('./modules/instrumentSelector');
const { WavExporter } = require('./modules/wavExporter');

/**
 * Main Beat Generator class
 * Orchestrates the creation of single-instrument beats using modular components
 */
class BeatGenerator {
  constructor() {
    this.timingEngine = new TimingEngine();
    this.patternGenerator = new PatternGenerator();
    this.instrumentSelector = new InstrumentSelector();
    this.wavExporter = new WavExporter();
    
    this.defaultOptions = {
      bpm: 120,
      timeSignature: '4/4',
      bars: 1,
      keyword: 'default',
      instrument: 'auto',
      outputPath: './generated',
      seed: null
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
      
      // Step 2: Generate pattern based on style and timing
      const pattern = this.patternGenerator.generate({
        keyword: config.keyword,
        timingConfig: timingConfig,
        seed: config.seed
      });
      
      console.log(`🥁 Pattern generated: ${pattern.events.length} events`);
      this.printPatternGrid(pattern, timingConfig);
      
      // Step 3: Select appropriate instrument samples
      const instrumentData = await this.instrumentSelector.select({
        instrument: config.instrument,
        keyword: config.keyword,
        pattern: pattern
      });
      
      console.log(`🎹 Instrument selected: ${instrumentData.type} (${instrumentData.samples.length} samples)`);
      
      // Step 4: Create timing-accurate WAV file
      const outputFilename = `${config.songName}-drums1.wav`;
      const outputPath = path.join(config.outputPath, outputFilename);
      
      await this.wavExporter.export({
        pattern: pattern,
        timingConfig: timingConfig,
        instrumentData: instrumentData,
        outputPath: outputPath,
        songName: config.songName
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
    
    // Validate bars
    if (![1, 2, 4].includes(config.bars)) {
      throw new Error('Bars must be 1, 2, or 4');
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