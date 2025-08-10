/**
 * Pattern Generator - Creates drum patterns based on music theory and style keywords
 * 
 * Implements genre-specific drumming patterns following established music theory:
 * - Jazz: Swing feel, light accents, ghost notes, cymbal-focused
 * - Funk: Tight syncopation, strong backbeat, ghost snares
 * - House: Four-on-the-floor, swung hi-hats, steady groove
 * - Lo-fi: Sparse patterns, off-beat elements, relaxed feel
 * - Pop/Upbeat: Strong downbeats, predictable patterns
 */

class PatternGenerator {
  constructor() {
    this.randomSeed = Date.now();
    this.randomIndex = 0;
    
    // Style-specific pattern templates based on music theory
    this.stylePatterns = {
      jazz: {
        bpmRange: [90, 120],
        density: 0.6, // 60% step fill
        swingFeel: true,
        patterns: {
          // Jazz patterns emphasize rides and light snare work
          primary: [
            { step: 1, velocity: 0.8, note: 'ride' },    // Downbeat
            { step: 3, velocity: 0.4, note: 'ride' },    // Swing eighth
            { step: 5, velocity: 0.6, note: 'snare' },   // Light backbeat
            { step: 7, velocity: 0.3, note: 'ride' },    // Ghost
            { step: 9, velocity: 0.7, note: 'ride' },    // Beat 3
            { step: 11, velocity: 0.4, note: 'ride' },   // Swing eighth
            { step: 13, velocity: 0.5, note: 'snare' },  // Backbeat
            { step: 15, velocity: 0.3, note: 'ride' }    // Pickup
          ],
          variations: [
            { step: 6, velocity: 0.2, note: 'snare', ghost: true },
            { step: 14, velocity: 0.2, note: 'snare', ghost: true }
          ]
        }
      },
      
      funk: {
        bpmRange: [100, 130],
        density: 0.75,
        swingFeel: false,
        patterns: {
          // Funk emphasizes the "one" and tight 16th syncopation
          primary: [
            { step: 1, velocity: 0.9, note: 'kick' },     // The "one"
            { step: 5, velocity: 0.8, note: 'snare' },    // Backbeat
            { step: 9, velocity: 0.6, note: 'kick' },     // Beat 3
            { step: 13, velocity: 0.8, note: 'snare' },   // Beat 4 backbeat
            { step: 16, velocity: 0.7, note: 'kick' }     // Pickup to next bar
          ],
          syncopation: [
            { step: 2, velocity: 0.3, note: 'snare', ghost: true },
            { step: 4, velocity: 0.2, note: 'kick', ghost: true },
            { step: 6, velocity: 0.3, note: 'snare', ghost: true },
            { step: 10, velocity: 0.3, note: 'snare', ghost: true },
            { step: 12, velocity: 0.4, note: 'kick' },
            { step: 14, velocity: 0.3, note: 'snare', ghost: true }
          ]
        }
      },
      
      house: {
        bpmRange: [120, 128],
        density: 0.5,
        swingFeel: false,
        patterns: {
          // House: Four-on-the-floor kick with swung hi-hats
          primary: [
            { step: 1, velocity: 0.8, note: 'kick' },     // Four-on-the-floor
            { step: 5, velocity: 0.8, note: 'kick' },
            { step: 9, velocity: 0.8, note: 'kick' },
            { step: 13, velocity: 0.8, note: 'kick' }
          ],
          hiHats: [
            { step: 3, velocity: 0.6, note: 'hihat' },    // Off-beat hi-hats
            { step: 7, velocity: 0.5, note: 'hihat' },
            { step: 11, velocity: 0.6, note: 'hihat' },
            { step: 15, velocity: 0.5, note: 'hihat' }
          ],
          accents: [
            { step: 5, velocity: 0.7, note: 'snare' },    // Occasional snare
            { step: 13, velocity: 0.7, note: 'snare' }
          ]
        }
      },
      
      'lo-fi': {
        bpmRange: [60, 90],
        density: 0.4,
        swingFeel: true,
        patterns: {
          // Lo-fi: Sparse, relaxed patterns with off-beat elements
          primary: [
            { step: 1, velocity: 0.6, note: 'kick' },     // Soft kick
            { step: 6, velocity: 0.5, note: 'snare' },    // Slightly off backbeat
            { step: 10, velocity: 0.5, note: 'kick' },    // Relaxed placement
            { step: 14, velocity: 0.4, note: 'snare' }    // Soft snare
          ],
          texture: [
            { step: 3, velocity: 0.3, note: 'hihat' },    // Sparse hi-hats
            { step: 8, velocity: 0.2, note: 'hihat' },
            { step: 12, velocity: 0.3, note: 'hihat' }
          ]
        }
      },
      
      pop: {
        bpmRange: [110, 140],
        density: 0.65,
        swingFeel: false,
        patterns: {
          // Pop: Strong downbeats, predictable snare on 2 and 4
          primary: [
            { step: 1, velocity: 0.8, note: 'kick' },     // Strong downbeat
            { step: 5, velocity: 0.8, note: 'snare' },    // Snare on 2
            { step: 9, velocity: 0.6, note: 'kick' },     // Beat 3
            { step: 13, velocity: 0.8, note: 'snare' }    // Snare on 4
          ],
          fills: [
            { step: 3, velocity: 0.4, note: 'hihat' },
            { step: 7, velocity: 0.4, note: 'hihat' },
            { step: 11, velocity: 0.4, note: 'hihat' },
            { step: 15, velocity: 0.4, note: 'hihat' }
          ]
        }
      },
      
      upbeat: {
        bpmRange: [110, 140],
        density: 0.7,
        swingFeel: false,
        patterns: {
          // Upbeat: Energetic patterns with extra elements
          primary: [
            { step: 1, velocity: 0.9, note: 'kick' },     // Strong kick
            { step: 5, velocity: 0.8, note: 'snare' },    // Snare on 2
            { step: 9, velocity: 0.7, note: 'kick' },     // Additional kick on 3
            { step: 13, velocity: 0.8, note: 'snare' }    // Snare on 4
          ],
          energy: [
            { step: 2, velocity: 0.4, note: 'hihat' },
            { step: 4, velocity: 0.4, note: 'hihat' },
            { step: 6, velocity: 0.4, note: 'hihat' },
            { step: 8, velocity: 0.4, note: 'hihat' },
            { step: 10, velocity: 0.4, note: 'hihat' },
            { step: 12, velocity: 0.4, note: 'hihat' },
            { step: 14, velocity: 0.4, note: 'hihat' },
            { step: 16, velocity: 0.4, note: 'hihat' }
          ]
        }
      },
      
      default: {
        bpmRange: [100, 120],
        density: 0.6,
        swingFeel: false,
        patterns: {
          // Default: Basic rock/pop hybrid
          primary: [
            { step: 1, velocity: 0.8, note: 'kick' },
            { step: 5, velocity: 0.7, note: 'snare' },
            { step: 9, velocity: 0.6, note: 'kick' },
            { step: 13, velocity: 0.7, note: 'snare' }
          ]
        }
      }
    };
  }

  /**
   * Set random seed for reproducible pattern generation
   * @param {number} seed - Random seed
   */
  setSeed(seed) {
    this.randomSeed = seed;
    this.randomIndex = 0;
  }

  /**
   * Seeded random number generator
   * @returns {number} Random number between 0 and 1
   */
  seededRandom() {
    const x = Math.sin(this.randomSeed + this.randomIndex++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate drum pattern based on style and timing configuration
   * @param {Object} config - Pattern configuration
   * @param {string} config.keyword - Style keyword
   * @param {Object} config.timingConfig - Timing configuration from TimingEngine
   * @param {string} [config.seed] - Random seed for reproducible patterns
   * @returns {Object} Generated pattern with events array
   */
  generate({ keyword, timingConfig, seed }) {
    if (seed) this.setSeed(seed);
    
    const styleConfig = this.stylePatterns[keyword] || this.stylePatterns.default;
    
    console.log(`🥁 Generating ${keyword} pattern with ${styleConfig.density * 100}% density`);
    
    // Validate BPM against style recommendations
    if (timingConfig.bpm < styleConfig.bpmRange[0] || timingConfig.bpm > styleConfig.bpmRange[1]) {
      console.warn(`⚠️  BPM ${timingConfig.bpm} is outside recommended range for ${keyword}: ${styleConfig.bpmRange[0]}-${styleConfig.bpmRange[1]}`);
    }
    
    const pattern = {
      style: keyword,
      events: [],
      density: styleConfig.density,
      swingFeel: styleConfig.swingFeel
    };
    
    // Generate events for each bar
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      this.generateBarEvents(pattern, styleConfig, timingConfig, bar);
    }
    
    // Apply variations and fills
    this.applyVariations(pattern, styleConfig, timingConfig);
    
    // Sort events by position
    pattern.events.sort((a, b) => a.position - b.position);
    
    console.log(`🎵 Generated ${pattern.events.length} events for ${timingConfig.bars} bars`);
    
    return pattern;
  }

  /**
   * Generate events for a single bar
   * @private
   */
  generateBarEvents(pattern, styleConfig, timingConfig, barIndex) {
    const barOffset = barIndex / timingConfig.bars;
    const stepScale = 1 / timingConfig.totalSteps;
    
    // Add primary pattern elements
    Object.values(styleConfig.patterns).forEach(patternGroup => {
      patternGroup.forEach(event => {
        if (this.shouldIncludeEvent(event, styleConfig)) {
          const globalStep = barIndex * timingConfig.stepsPerBar + (event.step - 1);
          const position = globalStep * stepScale;
          
          pattern.events.push({
            position: position,
            velocity: this.applyVelocityVariation(event.velocity),
            note: event.note,
            ghost: event.ghost || false,
            bar: barIndex,
            step: event.step
          });
        }
      });
    });
  }

  /**
   * Apply pattern variations and fills
   * @private
   */
  applyVariations(pattern, styleConfig, timingConfig) {
    // Add style-specific variations
    if (styleConfig.patterns.variations) {
      const variationChance = 0.3; // 30% chance for variations
      
      styleConfig.patterns.variations.forEach(variation => {
        if (this.seededRandom() < variationChance) {
          for (let bar = 0; bar < timingConfig.bars; bar++) {
            const globalStep = bar * timingConfig.stepsPerBar + (variation.step - 1);
            const position = globalStep / timingConfig.totalSteps;
            
            pattern.events.push({
              position: position,
              velocity: this.applyVelocityVariation(variation.velocity),
              note: variation.note,
              ghost: variation.ghost || false,
              variation: true,
              bar: bar,
              step: variation.step
            });
          }
        }
      });
    }
    
    // Add fills for longer patterns
    if (timingConfig.bars > 1) {
      this.addFills(pattern, timingConfig);
    }
  }

  /**
   * Add drum fills for longer patterns
   * @private
   */
  addFills(pattern, timingConfig) {
    const fillPositions = [];
    
    // Add fills at the end of phrases (every 2 or 4 bars)
    for (let bar = 1; bar < timingConfig.bars; bar += 2) {
      if (this.seededRandom() < 0.4) { // 40% chance for fills
        const fillStart = ((bar + 1) * timingConfig.stepsPerBar - 4) / timingConfig.totalSteps;
        fillPositions.push(fillStart);
      }
    }
    
    // Generate simple tom/snare fills
    fillPositions.forEach(fillPos => {
      for (let i = 0; i < 4; i++) {
        const stepOffset = i / timingConfig.totalSteps;
        const noteType = i % 2 === 0 ? 'snare' : 'tom';
        const velocity = 0.6 + (i * 0.1); // Building intensity
        
        pattern.events.push({
          position: fillPos + stepOffset,
          velocity: velocity,
          note: noteType,
          ghost: false,
          fill: true
        });
      }
    });
  }

  /**
   * Determine if an event should be included based on pattern density
   * @private
   */
  shouldIncludeEvent(event, styleConfig) {
    // Always include primary beats
    if ([1, 5, 9, 13].includes(event.step)) return true;
    
    // Apply density-based filtering for other events
    return this.seededRandom() < styleConfig.density;
  }

  /**
   * Apply subtle velocity variations for humanization
   * @private
   */
  applyVelocityVariation(baseVelocity) {
    const variation = (this.seededRandom() - 0.5) * 0.1; // ±5% variation
    return Math.max(0.1, Math.min(1.0, baseVelocity + variation));
  }

  /**
   * Get pattern statistics for analysis
   * @param {Object} pattern - Generated pattern
   * @returns {Object} Pattern statistics
   */
  analyzePattern(pattern) {
    const stats = {
      totalEvents: pattern.events.length,
      ghostNotes: pattern.events.filter(e => e.ghost).length,
      accents: pattern.events.filter(e => e.velocity >= 0.8).length,
      noteTypes: {}
    };
    
    // Count note types
    pattern.events.forEach(event => {
      stats.noteTypes[event.note] = (stats.noteTypes[event.note] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Generate a simple pattern for testing
   * @param {number} bars - Number of bars
   * @returns {Object} Simple test pattern
   */
  generateTestPattern(bars = 1) {
    const events = [];
    const stepScale = 1 / (16 * bars); // 16 steps per bar
    
    for (let bar = 0; bar < bars; bar++) {
      const barOffset = bar * 16;
      
      // Basic rock pattern: kick on 1 and 3, snare on 2 and 4
      events.push(
        { position: (barOffset + 0) * stepScale, velocity: 0.8, note: 'kick' },
        { position: (barOffset + 4) * stepScale, velocity: 0.7, note: 'snare' },
        { position: (barOffset + 8) * stepScale, velocity: 0.6, note: 'kick' },
        { position: (barOffset + 12) * stepScale, velocity: 0.7, note: 'snare' }
      );
    }
    
    return { events, style: 'test' };
  }
}

module.exports = { PatternGenerator };