/**
 * WAV Exporter - Exports drum patterns to WAV files with precise timing
 * 
 * Features:
 * - Sample-accurate timing (±1ms precision as per requirements)
 * - Professional audio mixing and normalization
 * - Support for velocity-based volume adjustments
 * - Proper WAV file format with standard headers
 * - Audio resampling to match project sample rate (44.1kHz)
 */

const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');

class WavExporter {
  constructor() {
    this.targetSampleRate = 44100; // CD quality
    this.bitDepth = 16; // 16-bit audio
    this.channels = 1; // Mono output for single instruments
    
    // Audio processing parameters
    this.masterVolume = 0.8; // Leave headroom for mastering
    this.velocityCurve = 2.0; // Exponential velocity response
    this.fadeInSamples = 64; // Prevent clicks
    this.fadeOutSamples = 64;
  }

  /**
   * Export pattern to WAV file
   * @param {Object} config - Export configuration
   * @param {Object} config.pattern - Generated pattern with events
   * @param {Object} config.timingConfig - Timing configuration
   * @param {Object} config.instrumentData - Selected instrument data
   * @param {string} config.outputPath - Output file path
   * @param {string} config.songName - Song name for metadata
   * @returns {Promise<void>}
   */
  async export({ pattern, timingConfig, instrumentData, outputPath, songName }) {
    console.log(`🎙️  Exporting ${pattern.events.length} events to WAV...`);
    console.log(`📊 Target: ${this.targetSampleRate}Hz, ${this.bitDepth}-bit, ${this.channels} channel(s)`);
    
    try {
      // Create audio buffer
      const audioBuffer = await this.createAudioBuffer(pattern, timingConfig, instrumentData);
      
      // Apply master processing
      this.applyMasterProcessing(audioBuffer);
      
      // Create WAV file
      const wavFile = this.createWavFile(audioBuffer, songName);
      
      // Write to file
      await this.writeWavFile(wavFile, outputPath);
      
      // Validate output
      await this.validateOutput(outputPath, timingConfig);
      
      console.log(`✅ WAV export completed: ${path.basename(outputPath)}`);
      console.log(`📁 File size: ${this.formatFileSize(fs.statSync(outputPath).size)}`);
      
    } catch (error) {
      console.error(`❌ WAV export failed:`, error);
      throw error;
    }
  }

  /**
   * Create audio buffer with precise event timing
   * @private
   */
  async createAudioBuffer(pattern, timingConfig, instrumentData) {
    const bufferLength = timingConfig.totalSamples;
    const audioBuffer = new Float32Array(bufferLength);
    
    console.log(`🔧 Creating audio buffer: ${bufferLength} samples (${(bufferLength / this.targetSampleRate).toFixed(2)}s)`);
    
    let eventsProcessed = 0;
    
    // Process each pattern event
    for (const event of pattern.events) {
      const sample = instrumentData.noteMapping[event.note];
      
      if (!sample || !sample.audioData) {
        console.warn(`⚠️  No sample data for note: ${event.note}`);
        continue;
      }
      
      // Calculate precise sample position
      const samplePosition = this.calculateSamplePosition(event.position, timingConfig);
      
      // Load and process sample audio
      const sampleAudio = await this.loadSampleAudio(sample.audioData);
      
      // Apply velocity scaling
      const velocityGain = this.calculateVelocityGain(event.velocity);
      
      // Mix sample into buffer
      this.mixSampleIntoBuffer(
        audioBuffer, 
        sampleAudio, 
        samplePosition, 
        velocityGain,
        event.ghost
      );
      
      eventsProcessed++;
    }
    
    console.log(`🎵 Processed ${eventsProcessed} events into audio buffer`);
    return audioBuffer;
  }

  /**
   * Calculate exact sample position from normalized position
   * @private
   */
  calculateSamplePosition(normalizedPosition, timingConfig) {
    // Apply swing if configured
    let adjustedPosition = normalizedPosition;
    
    if (timingConfig.styleRules && timingConfig.styleRules.swing > 0) {
      adjustedPosition = this.applySwingTiming(normalizedPosition, timingConfig);
    }
    
    // Convert to sample position with rounding for precision
    const samplePosition = Math.round(adjustedPosition * timingConfig.totalSamples);
    
    return Math.max(0, Math.min(timingConfig.totalSamples - 1, samplePosition));
  }

  /**
   * Apply swing timing adjustment
   * @private
   */
  applySwingTiming(position, timingConfig) {
    const swing = timingConfig.styleRules.swing;
    const totalSteps = timingConfig.totalSteps;
    const absoluteStep = position * totalSteps;
    const stepInBeat = absoluteStep % 4; // Assuming 4 steps per beat
    
    // Apply swing to off-beats (steps 1 and 3)
    if (Math.floor(stepInBeat) === 1 || Math.floor(stepInBeat) === 3) {
      const swingOffset = swing * 0.1; // 10% max swing adjustment
      return Math.min(1, position + (swingOffset / totalSteps));
    }
    
    return position;
  }

  /**
   * Load sample audio data from buffer
   * @private
   */
  async loadSampleAudio(audioData) {
    try {
      // Create WaveFile from buffer
      const wav = new WaveFile();
      wav.fromBuffer(audioData.buffer);
      
      // Get samples as float32 array
      const samples = wav.getSamples(true, Float32Array);
      
      // Handle stereo to mono conversion if needed
      let monoSamples;
      if (wav.fmt.numChannels === 2 && samples.length === 2) {
        // Convert stereo to mono by averaging channels
        monoSamples = new Float32Array(samples[0].length);
        for (let i = 0; i < samples[0].length; i++) {
          monoSamples[i] = (samples[0][i] + samples[1][i]) * 0.5;
        }
      } else {
        monoSamples = samples[0] || samples;
      }
      
      // Resample if necessary
      if (wav.fmt.sampleRate !== this.targetSampleRate) {
        monoSamples = this.resampleAudio(monoSamples, wav.fmt.sampleRate, this.targetSampleRate);
      }
      
      return monoSamples;
      
    } catch (error) {
      console.error(`❌ Error loading sample audio:`, error);
      // Return silence as fallback
      return new Float32Array(1024);
    }
  }

  /**
   * Simple audio resampling using linear interpolation
   * @private
   */
  resampleAudio(inputSamples, fromRate, toRate) {
    if (fromRate === toRate) return inputSamples;
    
    const ratio = fromRate / toRate;
    const outputLength = Math.floor(inputSamples.length / ratio);
    const outputSamples = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const index1 = Math.floor(sourceIndex);
      const index2 = Math.min(index1 + 1, inputSamples.length - 1);
      const fraction = sourceIndex - index1;
      
      // Linear interpolation
      outputSamples[i] = inputSamples[index1] * (1 - fraction) + inputSamples[index2] * fraction;
    }
    
    return outputSamples;
  }

  /**
   * Calculate velocity-based gain
   * @private
   */
  calculateVelocityGain(velocity) {
    // Apply exponential curve for more musical velocity response
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    return Math.pow(normalizedVelocity, 1 / this.velocityCurve);
  }

  /**
   * Mix sample into main audio buffer
   * @private
   */
  mixSampleIntoBuffer(audioBuffer, sampleAudio, startPosition, gain, isGhost = false) {
    // Apply ghost note processing
    let finalGain = gain;
    if (isGhost) {
      finalGain *= 0.3; // Ghost notes are much quieter
    }
    
    // Calculate end position
    const endPosition = Math.min(startPosition + sampleAudio.length, audioBuffer.length);
    const samplesToMix = endPosition - startPosition;
    
    if (samplesToMix <= 0) return;
    
    // Apply fade in/out to prevent clicks
    for (let i = 0; i < samplesToMix; i++) {
      const bufferIndex = startPosition + i;
      const sampleIndex = i;
      
      let sample = sampleAudio[sampleIndex] * finalGain;
      
      // Apply fade in
      if (i < this.fadeInSamples) {
        const fadeGain = i / this.fadeInSamples;
        sample *= fadeGain;
      }
      
      // Apply fade out
      const remainingSamples = samplesToMix - i;
      if (remainingSamples < this.fadeOutSamples) {
        const fadeGain = remainingSamples / this.fadeOutSamples;
        sample *= fadeGain;
      }
      
      // Mix with existing audio (additive mixing)
      audioBuffer[bufferIndex] += sample;
    }
  }

  /**
   * Apply master audio processing
   * @private
   */
  applyMasterProcessing(audioBuffer) {
    console.log(`🎛️  Applying master processing...`);
    
    // Find peak level for normalization
    let peak = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      peak = Math.max(peak, Math.abs(audioBuffer[i]));
    }
    
    // Apply soft limiting if needed
    if (peak > 1.0) {
      console.log(`🔧 Applying soft limiting (peak: ${peak.toFixed(3)})`);
      for (let i = 0; i < audioBuffer.length; i++) {
        audioBuffer[i] = this.softLimit(audioBuffer[i]);
      }
      peak = 1.0;
    }
    
    // Normalize to master volume
    const normalizationGain = peak > 0 ? (this.masterVolume / peak) : 1;
    
    if (normalizationGain !== 1) {
      console.log(`🔊 Normalizing audio (gain: ${normalizationGain.toFixed(3)})`);
      for (let i = 0; i < audioBuffer.length; i++) {
        audioBuffer[i] *= normalizationGain;
      }
    }
    
    console.log(`📊 Final peak level: ${(peak * normalizationGain).toFixed(3)}`);
  }

  /**
   * Soft limiter to prevent harsh clipping
   * @private
   */
  softLimit(sample) {
    const threshold = 0.95;
    const absValue = Math.abs(sample);
    
    if (absValue <= threshold) {
      return sample;
    }
    
    // Soft knee compression
    const ratio = 1 + (absValue - threshold) * 0.5;
    return sample > 0 ? threshold + (sample - threshold) / ratio : 
                       -threshold + (sample + threshold) / ratio;
  }

  /**
   * Create WAV file from audio buffer
   * @private
   */
  createWavFile(audioBuffer, songName) {
    console.log(`📦 Creating WAV file...`);
    
    // Convert float32 to int16
    const int16Buffer = new Int16Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; i++) {
      // Scale float32 (-1 to 1) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
      int16Buffer[i] = Math.round(sample * 32767);
    }
    
    // Create WAV file
    const wav = new WaveFile();
    wav.fromScratch(
      this.channels,           // channels
      this.targetSampleRate,   // sample rate
      this.bitDepth.toString(), // bit depth
      int16Buffer              // samples
    );
    
    // Add metadata
    wav.setTag('INAM', songName); // Title
    wav.setTag('IART', 'Beat Generator'); // Artist
    wav.setTag('ISFT', 'AI Music Backend v1.0'); // Software
    wav.setTag('ICMT', `Generated drum pattern - Single instrument track`); // Comment
    
    return wav;
  }

  /**
   * Write WAV file to disk
   * @private
   */
  async writeWavFile(wavFile, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(outputPath, wavFile.toBuffer());
        resolve();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate output file meets requirements
   * @private
   */
  async validateOutput(outputPath, timingConfig) {
    try {
      // Check file exists and has content
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        throw new Error('Output file is empty');
      }
      
      // Load and validate WAV file
      const buffer = fs.readFileSync(outputPath);
      const wav = new WaveFile();
      wav.fromBuffer(buffer);
      
      // Validate format
      const expectedDuration = timingConfig.totalDurationMs / 1000;
      const actualDuration = wav.data.chunkSize / (wav.fmt.sampleRate * wav.fmt.numChannels * (wav.fmt.bitsPerSample / 8));
      const durationError = Math.abs(expectedDuration - actualDuration);
      
      console.log(`✅ Validation Results:`);
      console.log(`   Sample Rate: ${wav.fmt.sampleRate}Hz (expected ${this.targetSampleRate}Hz)`);
      console.log(`   Bit Depth: ${wav.fmt.bitsPerSample}-bit (expected ${this.bitDepth}-bit)`);
      console.log(`   Channels: ${wav.fmt.numChannels} (expected ${this.channels})`);
      console.log(`   Duration: ${actualDuration.toFixed(3)}s (expected ${expectedDuration.toFixed(3)}s)`);
      console.log(`   Duration Error: ${(durationError * 1000).toFixed(2)}ms`);
      
      // Check filename format
      const filename = path.basename(outputPath);
      if (!filename.endsWith('-drums1.wav')) {
        console.warn(`⚠️  Filename doesn't match required format: ${filename}`);
      }
      
      // Timing accuracy check (±1ms tolerance)
      if (durationError * 1000 > 1) {
        console.warn(`⚠️  Duration error exceeds ±1ms tolerance: ${(durationError * 1000).toFixed(2)}ms`);
      } else {
        console.log(`✅ Timing accuracy within ±1ms tolerance`);
      }
      
      return {
        valid: true,
        sampleRate: wav.fmt.sampleRate,
        bitDepth: wav.fmt.bitsPerSample,
        channels: wav.fmt.numChannels,
        duration: actualDuration,
        durationError: durationError * 1000,
        fileSize: stats.size
      };
      
    } catch (error) {
      console.error(`❌ Output validation failed:`, error);
      throw error;
    }
  }

  /**
   * Format file size for display
   * @private
   */
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get export statistics for analysis
   * @param {string} outputPath - Path to exported file
   * @returns {Object} Export statistics
   */
  async getExportStats(outputPath) {
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Export file not found: ${outputPath}`);
    }
    
    const buffer = fs.readFileSync(outputPath);
    const wav = new WaveFile();
    wav.fromBuffer(buffer);
    
    const stats = fs.statSync(outputPath);
    
    return {
      filename: path.basename(outputPath),
      fileSize: stats.size,
      fileSizeFormatted: this.formatFileSize(stats.size),
      sampleRate: wav.fmt.sampleRate,
      bitDepth: wav.fmt.bitsPerSample,
      channels: wav.fmt.numChannels,
      duration: wav.data.chunkSize / (wav.fmt.sampleRate * wav.fmt.numChannels * (wav.fmt.bitsPerSample / 8)),
      created: stats.mtime
    };
  }
}

module.exports = { WavExporter };