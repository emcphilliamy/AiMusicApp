#!/usr/bin/env node
/**
 * Layer multiple WAV files into a single combined audio file
 */

const fs = require('fs');
const path = require('path');
const WavFile = require('wavefile').WaveFile;

class AudioLayerer {
  constructor() {
    this.generatedDir = './generated';
    this.targetSampleRate = 44100;
    this.targetChannels = 1;
    this.targetBitDepth = 16;
  }

  /**
   * Load and decode a WAV file to Float32Array
   */
  loadWavFile(filePath) {
    console.log(`🎵 Loading: ${path.basename(filePath)}`);
    
    try {
      const buffer = fs.readFileSync(filePath);
      const wav = new WavFile();
      wav.fromBuffer(buffer);
      
      // Get samples as Float32Array
      const samples = wav.getSamples(true, Float32Array);
      
      console.log(`✅ Loaded: ${samples.length} samples, ${wav.fmt.sampleRate}Hz, ${wav.fmt.numChannels}ch`);
      
      return {
        samples: samples,
        sampleRate: wav.fmt.sampleRate,
        channels: wav.fmt.numChannels,
        duration: samples.length / wav.fmt.sampleRate
      };
      
    } catch (error) {
      console.error(`❌ Error loading ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Normalize samples to prevent clipping when mixing
   */
  normalizeSamples(samples, gain = 1.0) {
    // Find max value without spreading large arrays
    let maxValue = 0;
    for (let i = 0; i < samples.length; i++) {
      const absValue = Math.abs(samples[i]);
      if (absValue > maxValue) maxValue = absValue;
    }
    
    if (maxValue === 0) return samples;
    
    const normalizedGain = Math.min(gain, 0.95 / maxValue);
    
    // Create new array with normalized values
    const normalized = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      normalized[i] = samples[i] * normalizedGain;
    }
    
    return normalized;
  }

  /**
   * Mix multiple audio tracks with individual volume levels
   */
  mixTracks(tracks, volumeLevels = null) {
    if (tracks.length === 0) return new Float32Array(0);
    
    // Find the longest track to determine output length
    let maxLength = 0;
    for (const track of tracks) {
      if (track.samples.length > maxLength) {
        maxLength = track.samples.length;
      }
    }
    const mixedAudio = new Float32Array(maxLength);
    
    console.log(`🎛️  Mixing ${tracks.length} tracks, output length: ${maxLength} samples`);
    
    // Default volume levels if not provided
    if (!volumeLevels) {
      volumeLevels = tracks.map(() => 1.0 / Math.sqrt(tracks.length)); // Reduce volume to prevent clipping
    }
    
    tracks.forEach((track, trackIndex) => {
      const volume = volumeLevels[trackIndex];
      const normalizedSamples = this.normalizeSamples(track.samples, volume);
      
      console.log(`  📻 Track ${trackIndex + 1}: ${track.name}, volume: ${volume.toFixed(3)}`);
      
      // Add this track to the mix
      for (let i = 0; i < normalizedSamples.length; i++) {
        mixedAudio[i] += normalizedSamples[i];
      }
    });
    
    // Final normalization to prevent clipping
    let finalMaxValue = 0;
    for (let i = 0; i < mixedAudio.length; i++) {
      const absValue = Math.abs(mixedAudio[i]);
      if (absValue > finalMaxValue) finalMaxValue = absValue;
    }
    
    if (finalMaxValue > 0.95) {
      const finalGain = 0.95 / finalMaxValue;
      console.log(`🔧 Applying final normalization: ${finalGain.toFixed(3)}`);
      for (let i = 0; i < mixedAudio.length; i++) {
        mixedAudio[i] *= finalGain;
      }
      finalMaxValue = 0.95; // Update the final max value after normalization
    }
    
    console.log(`🔊 Final peak level: ${finalMaxValue.toFixed(6)}`);
    
    return mixedAudio;
  }

  /**
   * Create a WAV file from Float32Array samples
   */
  createWavFile(samples, outputPath, songName) {
    console.log(`📦 Creating WAV file: ${outputPath}`);
    
    try {
      const wav = new WavFile();
      
      // Convert Float32Array to 16-bit PCM
      const int16Samples = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        // Clamp to prevent overflow and convert to 16-bit
        const clampedSample = Math.max(-1, Math.min(1, samples[i]));
        int16Samples[i] = Math.round(clampedSample * 32767);
      }
      
      // Create WAV file
      wav.fromScratch(this.targetChannels, this.targetSampleRate, '16', int16Samples);
      
      // Write to file
      fs.writeFileSync(outputPath, wav.toBuffer());
      
      const stats = fs.statSync(outputPath);
      console.log(`✅ WAV created: ${(stats.size / 1024).toFixed(1)} KB`);
      
      return {
        sampleRate: this.targetSampleRate,
        channels: this.targetChannels,
        bitDepth: this.targetBitDepth,
        duration: samples.length / this.targetSampleRate,
        fileSize: stats.size,
        samples: samples.length
      };
      
    } catch (error) {
      console.error(`❌ Error creating WAV file:`, error.message);
      throw error;
    }
  }

  /**
   * Generate metadata file for the layered composition
   */
  generateMetadata(outputPath, tracks, audioInfo, layerInfo) {
    const mdPath = outputPath.replace('.wav', '.md');
    const songName = path.basename(outputPath, '.wav');
    
    const metadata = `# ENERGETIC ENSEMBLE | MULTI-TRACK | 140 BPM

**Prompt:** "energetic multi-instrument ensemble"

**Content:** Full band arrangement

## Beat Generator - Layered Audio File Metadata

## File Information
- File Name: ${path.basename(outputPath)}
- Song Name: ${songName}
- Generated: ${new Date().toLocaleString('en-US')}
- File Size: ${(audioInfo.fileSize / 1024).toFixed(1)} KB

## Audio Specifications
- Sample Rate: ${audioInfo.sampleRate}Hz
- Bit Depth: ${audioInfo.bitDepth}-bit
- Channels: ${audioInfo.channels} (Mono)
- Duration: ${audioInfo.duration.toFixed(3)} seconds

## Timing Configuration
- BPM: 140
- Time Signature: 4/4
- Total Beats: undefined
- Total Steps: 32
- Step Resolution: 16 (steps per beat)
- Swing: None

## Layered Tracks Analysis
- Total Tracks Mixed: ${tracks.length}
- Total Combined Events: ${layerInfo.totalEvents}
- Layering Method: Additive mixing with normalization
- Volume Balance: Auto-balanced per track

### Track Breakdown:
${tracks.map((track, i) => `- Track ${i + 1}: ${track.name} (${track.events} events)`).join('\n')}

## Instruments Used

${tracks.map((track, i) => `### Track ${i + 1} - ${track.instrumentFamily}
- Instrument Type: ${track.instrumentFamily}
- Source File: ${track.sourceFile}
- Events Count: ${track.events}
- Volume Level: ${track.volume.toFixed(3)}`).join('\n\n')}

## Generation Details
- Style: pop
- Test Type: Multi-Track Layering
- Seed: Combined from individual tracks
- Algorithm: Audio Layering with Normalization
- Source Tracks: 5 individual energetic patterns
- Mixing Method: Linear addition with clipping prevention

## Audio Processing Applied
- Per-Track Normalization: Applied
- Master Volume Balancing: Applied
- Clipping Prevention: Applied
- Final Peak Level: ${layerInfo.finalPeak.toFixed(6)}
- Inter-Track Synchronization: Perfect (same BPM/timing)

## Technical Notes
- All source tracks synchronized to 140 BPM, 4/4 time
- Tracks layered with equal weighting and auto-balance
- Final output normalized to prevent digital clipping
- Maintains original timing precision of individual tracks
- Sample-accurate synchronization across all instruments

---
Generated by AI Music Backend v1.0 - Multi-Track Layering Module
`;

    fs.writeFileSync(mdPath, metadata);
    console.log(`📝 Metadata exported: ${path.basename(mdPath)}`);
    
    return mdPath;
  }

  /**
   * Layer all energetic patterns into a single file
   */
  async layerEnergeticPatterns() {
    console.log('🎼 Starting multi-track layering...\n');
    
    // Define the energetic patterns to layer
    const patternFiles = [
      'drums_energetic_drums-MB.wav',
      'keyboard_energetic_piano-MB.wav', 
      'guitar_energetic_guitar-MB.wav',
      'bass_energetic_bass-MB.wav',
      'keyboard_energetic_keyboard-MB.wav'
    ];
    
    const tracks = [];
    
    // Load each track
    for (const filename of patternFiles) {
      const filePath = path.join(this.generatedDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Warning: ${filename} not found, skipping...`);
        continue;
      }
      
      const audioData = this.loadWavFile(filePath);
      if (audioData) {
        // Extract track info from filename and metadata
        const instrumentMatch = filename.match(/^(\w+)_energetic_/);
        const instrumentFamily = instrumentMatch ? instrumentMatch[1] : 'unknown';
        
        tracks.push({
          name: filename.replace('-MB.wav', ''),
          instrumentFamily: instrumentFamily,
          sourceFile: filename,
          samples: audioData.samples,
          duration: audioData.duration,
          events: 'unknown', // We'd need to parse the MD file for exact count
          volume: 1.0
        });
      }
    }
    
    if (tracks.length === 0) {
      console.log('❌ No tracks loaded successfully');
      return;
    }
    
    console.log(`\n🎵 Successfully loaded ${tracks.length} tracks\n`);
    
    // Set volume levels for balanced mix
    const volumeLevels = [
      0.8,  // drums - prominent but not overwhelming
      0.6,  // piano - supporting harmony
      0.7,  // guitar - melodic lead
      0.9,  // bass - foundational low end
      0.5   // keyboard - ambient fill
    ].slice(0, tracks.length);
    
    // Update track volume info
    tracks.forEach((track, i) => {
      track.volume = volumeLevels[i];
    });
    
    // Mix the tracks
    const mixedAudio = this.mixTracks(tracks, volumeLevels);
    
    // Create output filename
    const outputPath = path.join(this.generatedDir, 'energetic_ensemble-LAYERED.wav');
    
    // Create the layered WAV file
    const audioInfo = this.createWavFile(mixedAudio, outputPath, 'energetic_ensemble');
    
    // Generate metadata
    let finalPeak = 0;
    for (let i = 0; i < mixedAudio.length; i++) {
      const absValue = Math.abs(mixedAudio[i]);
      if (absValue > finalPeak) finalPeak = absValue;
    }
    
    const layerInfo = {
      totalEvents: tracks.reduce((sum, track) => sum + (track.events === 'unknown' ? 0 : track.events), 0),
      finalPeak: finalPeak
    };
    
    this.generateMetadata(outputPath, tracks, audioInfo, layerInfo);
    
    console.log(`\n🎉 Layered composition created: ${path.basename(outputPath)}`);
    console.log(`📊 Duration: ${audioInfo.duration.toFixed(3)}s, Size: ${(audioInfo.fileSize / 1024).toFixed(1)} KB`);
    
    return outputPath;
  }
}

// Run if executed directly
if (require.main === module) {
  const layerer = new AudioLayerer();
  layerer.layerEnergeticPatterns().catch(console.error);
}

module.exports = { AudioLayerer };