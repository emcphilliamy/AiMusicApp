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
    this.masterVolume = 0.75; // Slightly lower for cleaner sound
    this.velocityCurve = 1.8; // Slightly less aggressive curve
    this.fadeInSamples = 256; // Prevent clicks - longer fade (5.8ms)
    this.fadeOutSamples = 256; // Prevent clicks - longer fade (5.8ms)
  }

  /**
   * Export pattern to WAV file
   * @param {Object} config - Export configuration
   * @param {Object} config.pattern - Generated pattern with events
   * @param {Object} config.timingConfig - Timing configuration
   * @param {Object} config.instrumentData - Selected instrument data
   * @param {string} config.outputPath - Output file path
   * @param {string} config.songName - Song name for metadata
   * @param {Object} config.generationMetadata - Additional generation metadata
   * @returns {Promise<void>}
   */
  async export({ pattern, timingConfig, instrumentData, outputPath, songName, generationMetadata = {} }) {
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
      
      // Generate metadata file
      await this.exportMetadata({ 
        pattern, 
        timingConfig, 
        instrumentData, 
        outputPath, 
        songName, 
        generationMetadata 
      });
      
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
      
      // Get samples as float32 array (normalized to -1 to 1)
      const samples = wav.getSamples(true, Float32Array);
      
      // Ensure samples are properly normalized to ±1.0 range
      // If they come in as integer values, normalize them
      const normalizeIfNeeded = (sampleArray) => {
        if (!sampleArray || sampleArray.length === 0) return sampleArray;
        
        // Check multiple points throughout the sample to detect max value efficiently
        // Sample at beginning, middle, and end + some random points for better detection
        const checkIndices = [];
        const len = sampleArray.length;
        
        // Always check first 50, middle 50, and last 50 samples
        for (let i = 0; i < Math.min(50, len); i++) checkIndices.push(i);
        for (let i = Math.max(0, Math.floor(len/2) - 25); i < Math.min(len, Math.floor(len/2) + 25); i++) checkIndices.push(i);
        for (let i = Math.max(0, len - 50); i < len; i++) checkIndices.push(i);
        
        // Add some random samples throughout for comprehensive checking
        for (let i = 0; i < 50 && checkIndices.length < 200; i++) {
          checkIndices.push(Math.floor(Math.random() * len));
        }
        
        let maxValue = 0;
        for (const idx of checkIndices) {
          maxValue = Math.max(maxValue, Math.abs(sampleArray[idx]));
        }
        
        // If samples appear to be in integer range (> 1), normalize them
        if (maxValue > 1.5) {
          const scale = 1.0 / Math.pow(2, wav.fmt.bitsPerSample - 1);
          return sampleArray.map(sample => sample * scale);
        }
        
        return sampleArray;
      };
      
      // Handle stereo to mono conversion if needed
      let monoSamples;
      if (wav.fmt.numChannels === 2 && Array.isArray(samples) && samples.length === 2) {
        // Convert stereo to mono by averaging channels
        const leftNormalized = normalizeIfNeeded(samples[0]);
        const rightNormalized = normalizeIfNeeded(samples[1]);
        
        monoSamples = new Float32Array(leftNormalized.length);
        for (let i = 0; i < leftNormalized.length; i++) {
          monoSamples[i] = (leftNormalized[i] + rightNormalized[i]) * 0.5;
        }
      } else {
        // For mono samples, samples is a Float32Array directly, not an array of channels
        monoSamples = normalizeIfNeeded(samples);
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
    // Protect against invalid velocity values
    if (!isFinite(velocity) || velocity == null) {
      console.log(`⚠️  Invalid velocity ${velocity}, using default 0.8`);
      velocity = 0.8; // Default velocity
    }
    
    // Apply exponential curve for more musical velocity response
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    const velocityGain = Math.pow(normalizedVelocity, 1 / this.velocityCurve);
    
    // Scale down to prevent excessive levels from loud NSynth samples
    const baseGain = 0.6; // Reduce base sample level
    const result = velocityGain * baseGain;
    
    return result;
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
      
      const rawSample = sampleAudio[sampleIndex];
      let sample = rawSample * finalGain;
      
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
      const sample = audioBuffer[i];
      if (isFinite(sample)) {
        peak = Math.max(peak, Math.abs(sample));
      }
    }
    
    // Apply soft limiting only if significantly over threshold
    if (peak > 1.05) { // Only limit if really needed
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
    const threshold = 0.98; // Higher threshold to reduce limiting
    const absValue = Math.abs(sample);
    
    if (absValue <= threshold) {
      return sample;
    }
    
    // Gentler soft knee compression
    const ratio = 1 + (absValue - threshold) * 0.3; // Reduced compression ratio
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
      
      // Check filename format (DB for drum-based, MB for melodic-based)
      const filename = path.basename(outputPath);
      if (filename.includes('-DB.wav')) {
        console.log(`📊 Drum-based pattern file format: ${filename}`);
      } else if (filename.includes('-MB.wav')) {
        console.log(`🎵 Melodic-based pattern file format: ${filename}`);
      } else if (filename.endsWith('.wav')) {
        console.log(`🎵 Instrument file format: ${filename}`);
      } else {
        console.warn(`⚠️  Unexpected filename format: ${filename}`);
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
   * Export detailed metadata file alongside WAV
   * @param {Object} config - Metadata export configuration
   */
  async exportMetadata({ pattern, timingConfig, instrumentData, outputPath, songName, generationMetadata }) {
    const metadataPath = outputPath.replace('.wav', '.md');
    
    try {
      // Collect all generation data
      const metadata = await this.collectMetadata({
        pattern,
        timingConfig,
        instrumentData,
        outputPath,
        songName,
        generationMetadata
      });
      
      // Format metadata as readable text
      const metadataText = this.formatMetadata(metadata);
      
      // Write metadata file
      fs.writeFileSync(metadataPath, metadataText, 'utf8');
      
      console.log(`📝 Metadata exported: ${path.basename(metadataPath)}`);
      
    } catch (error) {
      console.error(`❌ Metadata export failed:`, error);
      // Don't throw - WAV export should continue even if metadata fails
    }
  }

  /**
   * Collect comprehensive metadata about the generation
   * @private
   */
  async collectMetadata({ pattern, timingConfig, instrumentData, outputPath, songName, generationMetadata }) {
    const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    
    // Analyze pattern events
    const eventAnalysis = this.analyzePatternEvents(pattern);
    
    // Get instrument details
    const instrumentDetails = this.getInstrumentDetails(instrumentData);
    
    return {
      // Basic file info
      fileName: path.basename(outputPath),
      songName: songName,
      generatedAt: new Date().toISOString(),
      fileSize: stats ? this.formatFileSize(stats.size) : 'Unknown',
      
      // Audio specifications
      audioFormat: {
        sampleRate: this.targetSampleRate,
        bitDepth: this.bitDepth,
        channels: this.channels,
        duration: timingConfig.totalDurationMs / 1000
      },
      
      // Timing configuration
      timing: {
        bpm: timingConfig.bpm,
        timeSignature: timingConfig.timeSignature || '4/4',
        totalBeats: timingConfig.totalBeats,
        totalSteps: timingConfig.totalSteps,
        swing: timingConfig.styleRules?.swing || 0,
        stepResolution: timingConfig.stepResolution || 16
      },
      
      // Pattern analysis
      pattern: {
        totalEvents: pattern.events.length,
        activeEvents: eventAnalysis.activeEvents,
        ghostEvents: eventAnalysis.ghostEvents,
        velocityRange: eventAnalysis.velocityRange,
        noteDistribution: eventAnalysis.noteDistribution,
        timingDistribution: eventAnalysis.timingDistribution
      },
      
      // Instrument information
      instruments: instrumentDetails,
      
      // Generation metadata
      generation: {
        style: generationMetadata.style || 'Unknown',
        seed: generationMetadata.seed || 'Random',
        algorithm: generationMetadata.algorithm || 'Standard',
        parameters: generationMetadata.parameters || {},
        testType: generationMetadata.testType || 'Manual',
        originalPrompt: generationMetadata.originalPrompt || null,
        interpretedParams: generationMetadata.interpretedParams || null
      },
      
      // Spotify warnings (if any)
      spotifyWarnings: generationMetadata.spotifyWarnings || null,
      
      // Processing details
      processing: {
        masterVolume: this.masterVolume,
        velocityCurve: this.velocityCurve,
        fadeInSamples: this.fadeInSamples,
        fadeOutSamples: this.fadeOutSamples,
        normalization: 'Applied',
        softLimiting: 'Applied if needed'
      }
    };
  }

  /**
   * Analyze pattern events for statistics
   * @private
   */
  analyzePatternEvents(pattern) {
    const events = pattern.events || [];
    
    let activeEvents = 0;
    let ghostEvents = 0;
    let velocities = [];
    let noteDistribution = {};
    let timingDistribution = {};
    
    events.forEach(event => {
      if (event.ghost) {
        ghostEvents++;
      } else {
        activeEvents++;
      }
      
      velocities.push(event.velocity || 0.8);
      
      // Note distribution
      const note = event.note || 'Unknown';
      noteDistribution[note] = (noteDistribution[note] || 0) + 1;
      
      // Timing distribution (rounded to nearest 0.1)
      const timing = Math.round((event.position || 0) * 10) / 10;
      timingDistribution[timing] = (timingDistribution[timing] || 0) + 1;
    });
    
    const minVelocity = velocities.length > 0 ? Math.min(...velocities) : 0;
    const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;
    const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
    
    return {
      activeEvents,
      ghostEvents,
      velocityRange: {
        min: minVelocity,
        max: maxVelocity,
        average: avgVelocity
      },
      noteDistribution,
      timingDistribution
    };
  }

  /**
   * Get detailed instrument information
   * @private
   */
  getInstrumentDetails(instrumentData) {
    const instruments = [];
    
    if (instrumentData.noteMapping) {
      Object.entries(instrumentData.noteMapping).forEach(([note, sample]) => {
        // Extract filename from path
        const filename = sample.path ? sample.path.split('/').pop() : 'Unknown';
        
        instruments.push({
          note: note,
          instrumentFamily: sample.instrumentFamily || instrumentData.type || 'Unknown',
          instrumentName: sample.instrumentFamily || instrumentData.type || 'Unknown',
          sampleFile: filename,
          nsynthNote: `${sample.pitch || 'Unknown'}-${sample.velocity || 'Unknown'}`,
          noteType: sample.noteType || note
        });
      });
    }
    
    return instruments;
  }

  /**
   * Format metadata as human-readable text
   * @private
   */
  formatMetadata(metadata) {
    // Determine content description based on timing and pattern
    const contentDescription = this.determineContentDescription(metadata);
    
    // Build header with prompt if available
    let header = `# ${metadata.generation.style.toUpperCase()} | ${metadata.instruments[0]?.instrumentFamily?.toUpperCase() || 'UNKNOWN'} | ${metadata.timing.bpm} BPM`;
    
    if (metadata.generation.originalPrompt) {
      header += `\n\n**Prompt:** "${metadata.generation.originalPrompt}"\n\n**Content:** ${contentDescription}`;
    }
    
    return `${header}

## Beat Generator - Audio File Metadata

## File Information
- File Name: ${metadata.fileName}
- Song Name: ${metadata.songName}
- Generated: ${new Date(metadata.generatedAt).toLocaleString()}
- File Size: ${metadata.fileSize}

## Audio Specifications
- Sample Rate: ${metadata.audioFormat.sampleRate}Hz
- Bit Depth: ${metadata.audioFormat.bitDepth}-bit
- Channels: ${metadata.audioFormat.channels} (Mono)
- Duration: ${metadata.audioFormat.duration.toFixed(3)} seconds

## Timing Configuration
- BPM: ${metadata.timing.bpm}
- Time Signature: ${metadata.timing.timeSignature}
- Total Beats: ${metadata.timing.totalBeats}
- Total Steps: ${metadata.timing.totalSteps}
- Step Resolution: ${metadata.timing.stepResolution} (steps per beat)
- Swing: ${metadata.timing.swing > 0 ? `${(metadata.timing.swing * 100).toFixed(1)}%` : 'None'}

## Pattern Analysis
- Total Events: ${metadata.pattern.totalEvents}
- Active Events: ${metadata.pattern.activeEvents}
- Ghost Events: ${metadata.pattern.ghostEvents}
- Velocity Range: ${metadata.pattern.velocityRange.min.toFixed(2)} - ${metadata.pattern.velocityRange.max.toFixed(2)} (avg: ${metadata.pattern.velocityRange.average.toFixed(2)})

### Note Distribution:
${Object.entries(metadata.pattern.noteDistribution)
  .map(([note, count]) => `- ${note}: ${count} hits`)
  .join('\n')}

### Timing Distribution (position in pattern):
${Object.entries(metadata.pattern.timingDistribution)
  .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
  .slice(0, 10) // Show first 10 positions
  .map(([position, count]) => `- ${position}: ${count} events`)
  .join('\n')}${Object.keys(metadata.pattern.timingDistribution).length > 10 ? '\n- ... (showing first 10 positions)' : ''}

## Instruments Used
${metadata.instruments.map((inst, index) => `
### Instrument ${index + 1} - ${inst.noteType}
- Note Mapping: ${inst.note}
- Instrument Family: ${inst.instrumentFamily}
- Note Type: ${inst.noteType} 
- NSynth Sample: ${inst.nsynthNote}
- Sample File: ${inst.sampleFile}`).join('')}

## Generation Details
- Style: ${metadata.generation.style}
- Test Type: ${metadata.generation.testType}
- Seed: ${metadata.generation.seed}
- Algorithm: ${metadata.generation.algorithm}
- Parameters: ${JSON.stringify(metadata.generation.parameters, null, 2)}

## Audio Processing Applied
- Master Volume: ${metadata.processing.masterVolume}
- Velocity Curve: ${metadata.processing.velocityCurve}
- Fade In/Out: ${metadata.processing.fadeInSamples}/${metadata.processing.fadeOutSamples} samples
- Normalization: ${metadata.processing.normalization}
- Soft Limiting: ${metadata.processing.softLimiting}

## Technical Notes
- NSynth samples are normalized from integer range to ±1.0 float range
- Ghost notes are processed at 30% volume of regular velocity
- All samples resampled to ${metadata.audioFormat.sampleRate}Hz if needed
- Stereo samples converted to mono by channel averaging
- Sample-accurate timing with ±1ms precision target
${metadata.spotifyWarnings && metadata.spotifyWarnings.length > 0 ? `
## Spotify Integration Warnings
⚠️ The following Spotify references in your prompt could not be analyzed:
${metadata.spotifyWarnings.map(warning => `- ${warning}`).join('\n')}

This means the generated music is based on adjective analysis only, without Spotify audio features influence.
` : ''}
---
Generated by AI Music Backend v1.0 - Beat Generator Module
`;
  }

  /**
   * Determine content description based on metadata
   * @private
   */
  determineContentDescription(metadata) {
    const duration = metadata.audioFormat.duration;
    const totalEvents = metadata.pattern.totalEvents;
    const bars = Math.ceil(metadata.timing.totalSteps / (metadata.timing.stepResolution || 16));
    const isPercussive = metadata.instruments.some(inst => 
      inst.instrumentFamily === 'drums' || 
      inst.instrumentFamily === 'percussion'
    );
    
    // Determine type based on duration, events, and content
    // Check if guitar for chord description
    const isGuitar = metadata.instruments.some(inst => 
      inst.instrumentFamily === 'guitar' || 
      inst.noteType === 'guitar'
    );
    
    if (duration < 2.0) {
      return 'Short musical phrase';
    } else if (duration < 4.0) {
      if (totalEvents <= 4) {
        if (isPercussive) return 'Short drum pattern';
        if (isGuitar) return 'Guitar chord';
        return 'Simple melodic phrase';
      } else {
        return isPercussive ? 'Drum loop' : 'Melodic pattern';
      }
    } else if (duration < 8.0) {
      if (bars === 1) {
        if (isPercussive) return 'Extended drum pattern';
        if (isGuitar) return 'Guitar chord progression';
        return 'Extended melodic phrase';
      } else {
        return isPercussive ? 'Multi-bar drum sequence' : 'Multi-bar melodic sequence';
      }
    } else {
      return isPercussive ? 'Extended drum composition' : 'Extended musical composition';
    }
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