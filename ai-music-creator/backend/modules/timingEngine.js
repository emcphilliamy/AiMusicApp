/**
 * Timing Engine - Handles timing, quantization, and music theory rules
 * 
 * Based on industry DAW standards:
 * - 16th note grid resolution (16 steps per bar in 4/4)
 * - PPQ (Parts Per Quarter) calculations for precise timing
 * - Swing quantization following 2:1 and 3:1 ratios
 * - Support for 4/4 and 3/4 time signatures
 */

class TimingEngine {
  constructor() {
    this.sampleRate = 44100; // CD quality
    this.ppq = 192; // Parts per quarter note (industry standard)
    
    // Style-specific timing adjustments
    this.styleTimingRules = {
      jazz: { 
        swing: 0.67, // 2:1 swing ratio
        humanization: 0.05, // ±5% timing variation
        accentPlacement: [1, 5, 9, 13] // Beats 1 and 3 emphasis in 4/4
      },
      funk: {
        swing: 0.0, // Straight quantization
        humanization: 0.02, // Tight timing
        accentPlacement: [4, 12], // Strong backbeat (2 and 4)
        ghostNoteTiming: 0.03 // Slight ahead-of-beat for ghost notes
      },
      'lo-fi': {
        swing: 0.1, // Subtle swing
        humanization: 0.15, // Loose, relaxed timing
        accentPlacement: [1, 9], // Emphasis on 1 and 3
        jitter: 0.08 // Random timing offset ±8%
      },
      house: {
        swing: 0.0, // Perfect quantization
        humanization: 0.01, // Machine-like precision
        accentPlacement: [1, 5, 9, 13], // Four-on-the-floor
        offBeatHiHat: true
      },
      pop: {
        swing: 0.0, // Straight timing
        humanization: 0.03, // Slight humanization
        accentPlacement: [1, 4, 9, 12] // Kick on 1, snare on 2 and 4
      },
      upbeat: {
        swing: 0.0,
        humanization: 0.03,
        accentPlacement: [1, 4, 9, 12],
        extraKicks: [3] // Additional kick on beat 3
      },
      default: {
        swing: 0.0,
        humanization: 0.05,
        accentPlacement: [1, 4, 9, 12]
      }
    };
  }

  /**
   * Configure timing engine with musical parameters
   * @param {Object} config - Timing configuration
   * @param {number} config.bpm - Beats per minute
   * @param {string} config.timeSignature - Time signature ('4/4' or '3/4')
   * @param {number} config.bars - Number of bars
   * @param {string} config.keyword - Style keyword for timing rules
   * @returns {Object} Timing configuration object
   */
  configure({ bpm, timeSignature, bars, keyword }) {
    // Get style-specific timing rules
    const styleRules = this.styleTimingRules[keyword] || this.styleTimingRules.default;
    
    // Calculate basic timing values
    const beatsPerBar = timeSignature === '4/4' ? 4 : 3;
    const stepsPerBeat = 4; // 16th note resolution
    const stepsPerBar = beatsPerBar * stepsPerBeat;
    const totalSteps = stepsPerBar * bars;
    
    // Calculate time durations
    const beatDurationMs = (60 / bpm) * 1000; // Duration of one beat in milliseconds
    const stepDurationMs = beatDurationMs / stepsPerBeat; // Duration of one 16th note
    const barDurationMs = beatDurationMs * beatsPerBar;
    const totalDurationMs = barDurationMs * bars;
    
    // Calculate sample-accurate timing
    const samplesPerBeat = Math.round((this.sampleRate * 60) / bpm);
    const samplesPerStep = Math.round(samplesPerBeat / stepsPerBeat);
    const totalSamples = Math.round((this.sampleRate * totalDurationMs) / 1000);
    
    const config = {
      bpm,
      timeSignature,
      bars,
      keyword,
      styleRules,
      beatsPerBar,
      stepsPerBeat,
      stepsPerBar,
      totalSteps,
      beatDurationMs,
      stepDurationMs,
      barDurationMs,
      totalDurationMs,
      samplesPerBeat,
      samplesPerStep,
      totalSamples,
      sampleRate: this.sampleRate,
      ppq: this.ppq
    };
    
    console.log(`⏰ Timing Engine configured:`);
    console.log(`   BPM: ${bpm}, Time Sig: ${timeSignature}, Bars: ${bars}`);
    console.log(`   Step duration: ${stepDurationMs.toFixed(2)}ms`);
    console.log(`   Total duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
    console.log(`   Style rules: ${JSON.stringify(styleRules)}`);
    
    return config;
  }

  /**
   * Apply swing quantization to a step position
   * @param {number} stepPosition - Original step position (0-1)
   * @param {Object} timingConfig - Timing configuration
   * @returns {number} Swing-adjusted step position
   */
  applySwing(stepPosition, timingConfig) {
    const { swing } = timingConfig.styleRules;
    
    if (swing === 0) return stepPosition; // No swing
    
    const totalSteps = timingConfig.totalSteps;
    const absoluteStep = stepPosition * totalSteps;
    const stepInBeat = absoluteStep % timingConfig.stepsPerBeat;
    
    // Apply swing to off-beats (steps 1 and 3 in each beat group)
    if (stepInBeat === 1 || stepInBeat === 3) {
      const swingOffset = swing * (timingConfig.stepDurationMs / timingConfig.totalDurationMs);
      return Math.min(1, stepPosition + swingOffset);
    }
    
    return stepPosition;
  }

  /**
   * Apply humanization (timing variations) to event timing
   * @param {number} stepPosition - Original step position
   * @param {Object} timingConfig - Timing configuration
   * @param {Function} randomFn - Random function (for seeded randomness)
   * @returns {number} Humanized step position
   */
  applyHumanization(stepPosition, timingConfig, randomFn = Math.random) {
    const { humanization, jitter } = timingConfig.styleRules;
    
    let variation = 0;
    
    // Apply standard humanization
    if (humanization > 0) {
      variation += (randomFn() - 0.5) * humanization * 2;
    }
    
    // Apply additional jitter for lo-fi style
    if (jitter > 0) {
      variation += (randomFn() - 0.5) * jitter * 2;
    }
    
    // Convert variation to step position offset
    const stepOffset = variation * (timingConfig.stepDurationMs / timingConfig.totalDurationMs);
    
    return Math.max(0, Math.min(1, stepPosition + stepOffset));
  }

  /**
   * Get accent positions for the given style
   * @param {Object} timingConfig - Timing configuration
   * @returns {Array<number>} Array of step positions where accents should occur
   */
  getAccentPositions(timingConfig) {
    const { accentPlacement } = timingConfig.styleRules;
    const stepsPerBar = timingConfig.stepsPerBar;
    const totalSteps = timingConfig.totalSteps;
    
    const accentPositions = [];
    
    for (let bar = 0; bar < timingConfig.bars; bar++) {
      const barOffset = bar * stepsPerBar;
      
      accentPlacement.forEach(step => {
        const absoluteStep = barOffset + (step - 1); // Convert from 1-based to 0-based
        if (absoluteStep < totalSteps) {
          accentPositions.push(absoluteStep / totalSteps);
        }
      });
    }
    
    return accentPositions;
  }

  /**
   * Convert step position to sample position
   * @param {number} stepPosition - Normalized step position (0-1)
   * @param {Object} timingConfig - Timing configuration
   * @returns {number} Sample position in audio buffer
   */
  stepToSamplePosition(stepPosition, timingConfig) {
    return Math.round(stepPosition * timingConfig.totalSamples);
  }

  /**
   * Convert BPM and step to exact millisecond timing
   * @param {number} stepPosition - Normalized step position (0-1)
   * @param {Object} timingConfig - Timing configuration
   * @returns {number} Time in milliseconds
   */
  stepToMilliseconds(stepPosition, timingConfig) {
    return stepPosition * timingConfig.totalDurationMs;
  }

  /**
   * Validate timing accuracy (for testing)
   * @param {Array} events - Array of timed events
   * @param {Object} timingConfig - Timing configuration
   * @returns {Object} Timing accuracy report
   */
  validateTiming(events, timingConfig) {
    const toleranceMs = 1; // ±1ms tolerance as per requirements
    let accurateEvents = 0;
    let maxError = 0;
    
    events.forEach(event => {
      const expectedTimeMs = this.stepToMilliseconds(event.position, timingConfig);
      const actualTimeMs = event.timeMs || expectedTimeMs;
      const errorMs = Math.abs(expectedTimeMs - actualTimeMs);
      
      if (errorMs <= toleranceMs) {
        accurateEvents++;
      }
      
      maxError = Math.max(maxError, errorMs);
    });
    
    return {
      totalEvents: events.length,
      accurateEvents,
      accuracy: accurateEvents / events.length,
      maxErrorMs: maxError,
      withinTolerance: maxError <= toleranceMs
    };
  }
}

module.exports = { TimingEngine };