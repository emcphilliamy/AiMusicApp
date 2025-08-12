/**
 * Complex Beat Generator - Advanced Multi-Layer Beat Architecture
 * 
 * Implements sophisticated beat patterns using a modular layered approach:
 * 1. Core Foundation Layer (kick/snare backbone)
 * 2. Groove Layer (hi-hats, off-beats, swing)
 * 3. Polyrhythmic Layer (contrasting subdivisions, complexity)
 * 4. Variation Layer (fills, transitions, breaks)
 * 5. FX Layer (humanization, dynamics, processing)
 * 
 * Based on research from Splice, Waves Audio, MusicRadar, and genre analysis.
 * Maintains backward compatibility with existing simple beat generation.
 * 
 * @author AI Music Backend
 * @version 1.0.0
 */

const { PatternGenerator } = require('./patternGenerator');

class ComplexBeatGenerator extends PatternGenerator {
  constructor() {
    super();
    
    // Complex beat architecture configuration
    this.complexityLevels = {
      simple: 0.3,    // Use existing simple patterns
      moderate: 0.6,  // Add groove and light variations 
      complex: 0.8,   // Full layered approach with polyrhythms
      advanced: 1.0   // Maximum complexity with all layers
    };
    
    // Layer-specific configurations based on research
    this.layerConfigs = {
      core: {
        description: "Foundation layer - kick/snare backbone",
        priority: 1,
        velocityRange: [0.7, 0.9],
        density: 0.4  // Sparse but strong
      },
      groove: {
        description: "Groove layer - hi-hats, off-beats, swing",
        priority: 2, 
        velocityRange: [0.3, 0.6],
        density: 0.7  // More frequent
      },
      polyrhythm: {
        description: "Polyrhythmic layer - contrasting subdivisions",
        priority: 3,
        velocityRange: [0.2, 0.5],
        density: 0.3  // Subtle complexity
      },
      variation: {
        description: "Variation layer - fills, transitions, breaks",
        priority: 4,
        velocityRange: [0.4, 0.8],
        density: 0.2  // Occasional events
      },
      fx: {
        description: "FX layer - humanization, dynamics",
        priority: 5,
        velocityRange: [0.1, 0.9],
        density: 1.0  // Applied to all events
      }
    };
    
    // Genre-specific complexity patterns (researched from provided architecture)
    this.genreComplexityPatterns = {
      'hip-hop': {
        type: 'boom-bap',
        corePattern: 'trap',
        grooveStyle: 'rolling-hats',
        polyrhythm: 'triplet-hats',
        fills: 'snare-rolls',
        swing: 0.1,
        humanization: 0.15
      },
      'trap': {
        type: 'half-time',
        corePattern: 'sparse-kicks',
        grooveStyle: 'rolling-hats',
        polyrhythm: 'triplet-hats',
        fills: 'hat-rolls',
        swing: 0.0,
        humanization: 0.05
      },
      'jazz': {
        type: 'shuffle',
        corePattern: 'light-kicks',
        grooveStyle: 'swing-ride',
        polyrhythm: 'cross-stick',
        fills: 'brush-rolls',
        swing: 0.3,
        humanization: 0.25
      },
      'breakbeat': {
        type: 'syncopated',
        corePattern: 'chopped-breaks',
        grooveStyle: 'fast-hats',
        polyrhythm: 'break-chops',
        fills: 'break-fills',
        swing: 0.05,
        humanization: 0.2
      },
      'dnb': {
        type: 'fast-breaks',
        corePattern: 'jungle-kicks',
        grooveStyle: 'chopped-snares',
        polyrhythm: 'amen-variations',
        fills: 'rapid-fills',
        swing: 0.0,
        humanization: 0.1
      },
      'dub-techno': {
        type: 'sparse-minimal',
        corePattern: 'four-floor',
        grooveStyle: 'reverb-hats',
        polyrhythm: 'delay-echoes',
        fills: 'dub-delays',
        swing: 0.02,
        humanization: 0.3
      },
      'miami-bass': {
        type: 'fast-funk',
        corePattern: 'funk-kicks',
        grooveStyle: 'fast-16th-hats',
        polyrhythm: 'bass-rolls',
        fills: 'dynamic-rolls',
        swing: 0.08,
        humanization: 0.15
      },
      'funk': {
        type: 'tight-syncopated',
        corePattern: 'one-emphasis',
        grooveStyle: 'ghost-snares',
        polyrhythm: 'cross-rhythms',
        fills: 'funk-chops',
        swing: 0.05,
        humanization: 0.2
      },
      'house': {
        type: 'four-on-floor',
        corePattern: 'steady-kicks',
        grooveStyle: 'swung-hats',
        polyrhythm: 'percussion-layer',
        fills: 'build-ups',
        swing: 0.1,
        humanization: 0.1
      },
      'lo-fi': {
        type: 'relaxed-sparse',
        corePattern: 'soft-kicks',
        grooveStyle: 'dusty-hats',
        polyrhythm: 'vinyl-crackle',
        fills: 'tape-stops',
        swing: 0.2,
        humanization: 0.4
      }
    };
  }
  
  /**
   * Generate complex multi-layer beat pattern
   * @param {Object} config - Configuration object
   * @param {string} config.genre - Genre for complexity rules
   * @param {string} [config.complexity='moderate'] - Complexity level
   * @param {Object} config.timingConfig - Timing configuration
   * @param {string} [config.seed] - Random seed
   * @returns {Object} Complex layered pattern
   */
  generateComplexBeat(config) {
    const { genre, complexity = 'moderate', timingConfig, seed } = config;
    
    if (seed) this.setSeed(seed);
    
    console.log(`🎵 Generating COMPLEX beat: ${genre} (${complexity} complexity)`);
    
    // Get genre-specific complexity rules
    const genreRules = this.genreComplexityPatterns[genre] || this.genreComplexityPatterns['house'];
    const complexityLevel = this.complexityLevels[complexity];
    
    console.log(`🎯 Genre rules: ${genreRules.type}, Swing: ${genreRules.swing}, Humanization: ${genreRules.humanization}`);
    
    // Initialize multi-layer pattern structure
    const complexPattern = {
      genre: genre,
      complexity: complexity,
      complexityLevel: complexityLevel,
      layers: {},
      events: [],
      metadata: {
        genreRules: genreRules,
        layersUsed: [],
        totalComplexity: 0
      }
    };
    
    // Layer 1: Core Foundation (always present)
    console.log(`🔨 Building Layer 1: Core Foundation (${genreRules.corePattern})`);
    complexPattern.layers.core = this.buildCoreLayer(genreRules, timingConfig);
    complexPattern.metadata.layersUsed.push('core');
    
    // Layer 2: Groove Layer (moderate+ complexity)
    if (complexityLevel >= this.complexityLevels.moderate) {
      console.log(`🎶 Building Layer 2: Groove Layer (${genreRules.grooveStyle})`);
      complexPattern.layers.groove = this.buildGrooveLayer(genreRules, timingConfig);
      complexPattern.metadata.layersUsed.push('groove');
    }
    
    // Layer 3: Polyrhythmic Layer (complex+ complexity)
    if (complexityLevel >= this.complexityLevels.complex) {
      console.log(`🎭 Building Layer 3: Polyrhythmic Layer (${genreRules.polyrhythm})`);
      complexPattern.layers.polyrhythm = this.buildPolyrhythmLayer(genreRules, timingConfig);
      complexPattern.metadata.layersUsed.push('polyrhythm');
    }
    
    // Layer 4: Variation Layer (complex+ complexity)
    if (complexityLevel >= this.complexityLevels.complex && timingConfig.bars > 1) {
      console.log(`🎪 Building Layer 4: Variation Layer (${genreRules.fills})`);
      complexPattern.layers.variation = this.buildVariationLayer(genreRules, timingConfig);
      complexPattern.metadata.layersUsed.push('variation');
    }
    
    // Layer 5: FX Layer (always applied for humanization)
    console.log(`✨ Building Layer 5: FX Layer (humanization: ${genreRules.humanization})`);
    
    // Merge all layers into final event list
    this.mergeLayers(complexPattern);
    
    // Apply FX layer (humanization, swing, dynamics)
    this.applyFXLayer(complexPattern, genreRules);
    
    // Calculate final complexity score
    complexPattern.metadata.totalComplexity = this.calculateComplexityScore(complexPattern);
    
    console.log(`🏆 Complex beat generated: ${complexPattern.events.length} events, ${complexPattern.metadata.layersUsed.length} layers`);
    console.log(`📊 Complexity score: ${complexPattern.metadata.totalComplexity}`);
    
    return complexPattern;
  }
  
  /**
   * Build core foundation layer (kick/snare backbone)
   * @private
   */
  buildCoreLayer(genreRules, timingConfig) {
    const coreEvents = [];
    const stepsPerBar = timingConfig.stepsPerBar;
    
    // Generate core pattern based on genre type
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      const barOffset = bar * stepsPerBar;
      
      switch (genreRules.corePattern) {
        case 'trap':
        case 'sparse-kicks':
          // Trap: Kick on 1, snare on 5 (beat 2), optional kick on 12
          coreEvents.push(
            { step: barOffset + 1, velocity: 0.85, note: 'kick', layer: 'core' },
            { step: barOffset + 9, velocity: 0.8, note: 'snare', layer: 'core' }
          );
          if (this.seededRandom() < 0.6) {
            coreEvents.push({ step: barOffset + 13, velocity: 0.7, note: 'kick', layer: 'core' });
          }
          break;
          
        case 'one-emphasis':
        case 'funk-kicks':
          // Funk: Strong "one", syncopated kicks
          coreEvents.push(
            { step: barOffset + 1, velocity: 0.9, note: 'kick', layer: 'core' }, // The "one"
            { step: barOffset + 9, velocity: 0.8, note: 'snare', layer: 'core' },
            { step: barOffset + 16, velocity: 0.75, note: 'kick', layer: 'core' }
          );
          break;
          
        case 'four-floor':
        case 'steady-kicks':
          // House: Four-on-the-floor
          for (let beat = 1; beat <= 4; beat++) {
            coreEvents.push({
              step: barOffset + ((beat - 1) * 4) + 1,
              velocity: 0.8,
              note: 'kick',
              layer: 'core'
            });
          }
          break;
          
        case 'light-kicks':
        case 'soft-kicks':
          // Jazz/Lo-fi: Light, sparse kicks
          coreEvents.push(
            { step: barOffset + 1, velocity: 0.6, note: 'kick', layer: 'core' },
            { step: barOffset + 9, velocity: 0.5, note: 'kick', layer: 'core' }
          );
          break;
          
        case 'chopped-breaks':
        case 'jungle-kicks':
          // Breakbeat/DNB: Syncopated, complex kicks
          coreEvents.push(
            { step: barOffset + 1, velocity: 0.8, note: 'kick', layer: 'core' },
            { step: barOffset + 4, velocity: 0.7, note: 'kick', layer: 'core' },
            { step: barOffset + 7, velocity: 0.6, note: 'snare', layer: 'core' },
            { step: barOffset + 10, velocity: 0.75, note: 'kick', layer: 'core' },
            { step: barOffset + 13, velocity: 0.8, note: 'snare', layer: 'core' }
          );
          break;
          
        default:
          // Default: Basic rock pattern
          coreEvents.push(
            { step: barOffset + 1, velocity: 0.8, note: 'kick', layer: 'core' },
            { step: barOffset + 5, velocity: 0.75, note: 'snare', layer: 'core' },
            { step: barOffset + 9, velocity: 0.7, note: 'kick', layer: 'core' },
            { step: barOffset + 13, velocity: 0.75, note: 'snare', layer: 'core' }
          );
      }
    }
    
    return {
      events: coreEvents,
      type: genreRules.corePattern,
      density: this.layerConfigs.core.density
    };
  }
  
  /**
   * Build groove layer (hi-hats, off-beats, swing elements)
   * @private  
   */
  buildGrooveLayer(genreRules, timingConfig) {
    const grooveEvents = [];
    const stepsPerBar = timingConfig.stepsPerBar;
    
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      const barOffset = bar * stepsPerBar;
      
      switch (genreRules.grooveStyle) {
        case 'rolling-hats':
          // Trap-style rolling hi-hats with triplets
          for (let step = 1; step <= 16; step++) {
            if (step % 2 === 0) { // Even steps
              const velocity = 0.3 + (this.seededRandom() * 0.3);
              grooveEvents.push({
                step: barOffset + step,
                velocity: velocity,
                note: 'hihat',
                layer: 'groove'
              });
            }
          }
          // Add triplet rolls
          if (this.seededRandom() < 0.4) {
            const rollStart = barOffset + 12;
            for (let i = 0; i < 6; i++) {
              grooveEvents.push({
                step: rollStart + (i * 0.33),
                velocity: 0.4 + (i * 0.05),
                note: 'hihat',
                layer: 'groove',
                technique: 'triplet-roll'
              });
            }
          }
          break;
          
        case 'swing-ride':
          // Jazz swing ride pattern
          for (let beat = 1; beat <= 4; beat++) {
            const mainStep = barOffset + ((beat - 1) * 4) + 1;
            const swingStep = mainStep + 2.67; // Swung eighth
            
            grooveEvents.push(
              { step: mainStep, velocity: 0.6, note: 'ride', layer: 'groove' },
              { step: swingStep, velocity: 0.4, note: 'ride', layer: 'groove', technique: 'swing' }
            );
          }
          break;
          
        case 'swung-hats':
          // House-style swung hi-hats on off-beats
          for (let beat = 1; beat <= 4; beat++) {
            const offBeat = barOffset + ((beat - 1) * 4) + 3;
            const velocity = 0.5 + (this.seededRandom() * 0.2);
            grooveEvents.push({
              step: offBeat,
              velocity: velocity,
              note: 'hihat',
              layer: 'groove',
              technique: 'swung'
            });
          }
          break;
          
        case 'ghost-snares':
          // Funk ghost snares
          const ghostPositions = [3, 6, 10, 14];
          ghostPositions.forEach(pos => {
            if (this.seededRandom() < 0.6) {
              grooveEvents.push({
                step: barOffset + pos,
                velocity: 0.25,
                note: 'snare',
                layer: 'groove',
                ghost: true,
                technique: 'ghost'
              });
            }
          });
          break;
          
        case 'fast-hats':
        case 'fast-16th-hats':
          // Fast 16th note hi-hats
          for (let step = 1; step <= 16; step++) {
            const velocity = step % 4 === 1 ? 0.5 : 0.3;
            grooveEvents.push({
              step: barOffset + step,
              velocity: velocity,
              note: 'hihat',
              layer: 'groove'
            });
          }
          break;
          
        case 'dusty-hats':
        case 'reverb-hats':
          // Lo-fi/Dub sparse, textured hats
          const sparsePositions = [3, 7, 11, 15];
          sparsePositions.forEach(pos => {
            if (this.seededRandom() < 0.7) {
              grooveEvents.push({
                step: barOffset + pos,
                velocity: 0.3 + (this.seededRandom() * 0.2),
                note: 'hihat',
                layer: 'groove',
                technique: 'dusty'
              });
            }
          });
          break;
      }
    }
    
    return {
      events: grooveEvents,
      type: genreRules.grooveStyle,
      density: this.layerConfigs.groove.density
    };
  }
  
  /**
   * Build polyrhythmic layer (contrasting subdivisions)
   * @private
   */
  buildPolyrhythmLayer(genreRules, timingConfig) {
    const polyEvents = [];
    const stepsPerBar = timingConfig.stepsPerBar;
    
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      const barOffset = bar * stepsPerBar;
      
      switch (genreRules.polyrhythm) {
        case 'triplet-hats':
          // Triplet subdivision against 16th grid
          for (let triplet = 0; triplet < 12; triplet++) {
            const step = barOffset + 1 + (triplet * (16/12));
            if (this.seededRandom() < 0.4) {
              polyEvents.push({
                step: step,
                velocity: 0.3,
                note: 'hihat',
                layer: 'polyrhythm',
                technique: 'triplet'
              });
            }
          }
          break;
          
        case 'cross-stick':
        case 'cross-rhythms':
          // Cross-stick on 3/4 subdivision
          for (let cross = 0; cross < 4; cross++) {
            const step = barOffset + 1 + (cross * 3);
            polyEvents.push({
              step: step,
              velocity: 0.4,
              note: 'cross-stick',
              layer: 'polyrhythm',
              technique: 'cross-rhythm'
            });
          }
          break;
          
        case 'percussion-layer':
          // Additional percussion in different subdivision
          const percPositions = [2.5, 6.5, 10.5, 14.5]; // Between beats
          percPositions.forEach(pos => {
            if (this.seededRandom() < 0.5) {
              polyEvents.push({
                step: barOffset + pos,
                velocity: 0.35,
                note: 'perc',
                layer: 'polyrhythm'
              });
            }
          });
          break;
          
        case 'break-chops':
        case 'amen-variations':
          // Breakbeat chopped variations
          const chopPositions = [1.5, 3.8, 7.2, 11.6, 14.3];
          chopPositions.forEach(pos => {
            polyEvents.push({
              step: barOffset + pos,
              velocity: 0.6,
              note: 'snare',
              layer: 'polyrhythm',
              technique: 'chop'
            });
          });
          break;
      }
    }
    
    return {
      events: polyEvents,
      type: genreRules.polyrhythm,
      density: this.layerConfigs.polyrhythm.density
    };
  }
  
  /**
   * Build variation layer (fills, transitions, breaks)
   * @private
   */
  buildVariationLayer(genreRules, timingConfig) {
    const variationEvents = [];
    
    // Add fills at phrase boundaries
    for (let bar = 1; bar < timingConfig.bars; bar += 2) {
      if (this.seededRandom() < 0.6) {
        const fillEvents = this.generateFill(genreRules.fills, bar, timingConfig);
        variationEvents.push(...fillEvents);
      }
    }
    
    return {
      events: variationEvents,
      type: genreRules.fills,
      density: this.layerConfigs.variation.density
    };
  }
  
  /**
   * Generate fill pattern based on genre
   * @private
   */
  generateFill(fillType, bar, timingConfig) {
    const fillEvents = [];
    const fillStart = (bar * timingConfig.stepsPerBar) - 4; // Last 4 steps of bar
    
    switch (fillType) {
      case 'snare-rolls':
      case 'brush-rolls':
        // Snare roll building in intensity
        for (let i = 0; i < 4; i++) {
          fillEvents.push({
            step: fillStart + i,
            velocity: 0.4 + (i * 0.1),
            note: 'snare',
            layer: 'variation',
            technique: 'roll'
          });
        }
        break;
        
      case 'hat-rolls':
        // Fast hi-hat roll
        for (let i = 0; i < 8; i++) {
          fillEvents.push({
            step: fillStart + (i * 0.5),
            velocity: 0.5,
            note: 'hihat',
            layer: 'variation',
            technique: 'roll'
          });
        }
        break;
        
      case 'break-fills':
      case 'rapid-fills':
        // Complex tom/snare combination
        const fillNotes = ['tom', 'snare', 'tom', 'snare'];
        fillNotes.forEach((note, i) => {
          fillEvents.push({
            step: fillStart + i,
            velocity: 0.6 + (i * 0.05),
            note: note,
            layer: 'variation',
            technique: 'fill'
          });
        });
        break;
    }
    
    return fillEvents;
  }
  
  /**
   * Merge all layers into final event list
   * @private
   */
  mergeLayers(complexPattern) {
    // Combine events from all layers
    Object.keys(complexPattern.layers).forEach(layerName => {
      const layer = complexPattern.layers[layerName];
      complexPattern.events.push(...layer.events);
    });
    
    // Convert steps to normalized positions and sort
    complexPattern.events = complexPattern.events.map(event => ({
      ...event,
      position: (event.step - 1) / (complexPattern.layers.core ? 
        (16 * Math.max(1, Object.keys(complexPattern.layers).length)) : 16)
    })).sort((a, b) => a.position - b.position);
  }
  
  /**
   * Apply FX layer (humanization, swing, dynamics)
   * @private
   */
  applyFXLayer(complexPattern, genreRules) {
    const humanization = genreRules.humanization;
    const swing = genreRules.swing;
    
    complexPattern.events.forEach(event => {
      // Apply humanization (timing and velocity variations)
      if (humanization > 0) {
        const timingVariation = (this.seededRandom() - 0.5) * humanization * 0.02;
        const velocityVariation = (this.seededRandom() - 0.5) * humanization * 0.1;
        
        event.position = Math.max(0, event.position + timingVariation);
        event.velocity = Math.max(0.1, Math.min(1.0, event.velocity + velocityVariation));
        
        event.humanized = true;
      }
      
      // Apply swing feel
      if (swing > 0 && event.step % 2 === 0) {
        const swingDelay = swing * 0.05;
        event.position += swingDelay;
        event.swung = true;
      }
    });
    
    // Add final FX metadata
    complexPattern.metadata.fx = {
      humanization: humanization,
      swing: swing,
      eventsProcessed: complexPattern.events.length
    };
  }
  
  /**
   * Calculate overall complexity score
   * @private
   */
  calculateComplexityScore(complexPattern) {
    const layerCount = complexPattern.metadata.layersUsed.length;
    const eventCount = complexPattern.events.length;
    const uniqueNotes = new Set(complexPattern.events.map(e => e.note)).size;
    const techniques = new Set(complexPattern.events.map(e => e.technique).filter(Boolean)).size;
    
    // Normalize to 0-1 scale
    const score = Math.min(1.0,
      (layerCount / 5) * 0.3 +           // Layer diversity
      (eventCount / 100) * 0.3 +         // Event density
      (uniqueNotes / 10) * 0.2 +         // Note variety
      (techniques / 8) * 0.2             // Technique variety
    );
    
    return Math.round(score * 100) / 100;
  }
  
  /**
   * Generate backward-compatible simple pattern (delegates to parent)
   * @param {Object} config - Pattern configuration
   * @returns {Object} Simple pattern using parent class
   */
  generateSimpleBeat(config) {
    console.log(`🎵 Generating SIMPLE beat (backward compatible)`);
    return super.generate(config);
  }
  
  /**
   * Auto-detect appropriate complexity level based on genre and context
   * @param {string} genre - Genre name
   * @param {number} bars - Number of bars
   * @param {string} [userPreference] - User's complexity preference
   * @returns {string} Recommended complexity level
   */
  recommendComplexity(genre, bars, userPreference) {
    if (userPreference) return userPreference;
    
    // Auto-detect based on genre characteristics
    const genreComplexityMap = {
      'hip-hop': 'moderate',
      'trap': 'moderate', 
      'jazz': 'complex',
      'breakbeat': 'advanced',
      'dnb': 'advanced',
      'jungle': 'advanced',
      'dub-techno': 'complex',
      'miami-bass': 'complex',
      'funk': 'complex',
      'house': 'moderate',
      'lo-fi': 'moderate'
    };
    
    const baseComplexity = genreComplexityMap[genre] || 'moderate';
    
    // Upgrade complexity for longer patterns
    if (bars >= 4 && baseComplexity === 'moderate') return 'complex';
    if (bars >= 8 && baseComplexity === 'complex') return 'advanced';
    
    return baseComplexity;
  }
}

module.exports = { ComplexBeatGenerator };