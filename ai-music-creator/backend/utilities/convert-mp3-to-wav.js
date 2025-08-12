#!/usr/bin/env node
/**
 * Convert all existing MP3 files in freesound-data to WAV format
 * Uses ffmpeg for conversion with standard audio specifications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class Mp3ToWavConverter {
  constructor() {
    this.freesoundDataDir = './freesound-data';
    this.convertedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Main conversion function
   */
  async convertAllMp3Files() {
    console.log('🔄 Converting MP3 files to WAV format...');
    console.log('==========================================');
    
    if (!fs.existsSync(this.freesoundDataDir)) {
      console.log('❌ freesound-data directory not found');
      return;
    }

    // Find all MP3 files recursively
    const mp3Files = this.findMp3Files(this.freesoundDataDir);
    
    if (mp3Files.length === 0) {
      console.log('ℹ️  No MP3 files found to convert');
      return;
    }

    console.log(`📁 Found ${mp3Files.length} MP3 files to convert`);
    console.log();

    // Convert each file
    for (const mp3File of mp3Files) {
      await this.convertFile(mp3File);
    }

    console.log();
    console.log('📊 Conversion Summary:');
    console.log(`✅ Successfully converted: ${this.convertedCount} files`);
    if (this.errorCount > 0) {
      console.log(`❌ Failed to convert: ${this.errorCount} files`);
    }
    console.log('🎵 All MP3 files have been converted to WAV format');
  }

  /**
   * Find all MP3 files recursively
   */
  findMp3Files(dir) {
    const mp3Files = [];
    
    const traverse = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) {
          mp3Files.push(fullPath);
        }
      }
    };

    traverse(dir);
    return mp3Files;
  }

  /**
   * Convert a single MP3 file to WAV
   */
  async convertFile(mp3Path) {
    const wavPath = mp3Path.replace(/\.mp3$/i, '.wav');
    const relativePath = path.relative(process.cwd(), mp3Path);
    
    try {
      // Check if WAV already exists
      if (fs.existsSync(wavPath)) {
        console.log(`⏭️  Skipping: ${relativePath} (WAV already exists)`);
        return;
      }

      console.log(`🔄 Converting: ${relativePath}`);
      
      // Convert using ffmpeg with standard audio specs
      const command = `ffmpeg -i "${mp3Path}" -ar 44100 -ac 1 -sample_fmt s16 "${wavPath}" -y`;
      execSync(command, { stdio: 'pipe' });
      
      // Verify the WAV file was created successfully
      if (fs.existsSync(wavPath)) {
        const wavStats = fs.statSync(wavPath);
        if (wavStats.size > 0) {
          // Remove the original MP3 file
          fs.unlinkSync(mp3Path);
          console.log(`✅ Converted: ${path.basename(mp3Path)} → ${path.basename(wavPath)}`);
          this.convertedCount++;
        } else {
          throw new Error('WAV file is empty');
        }
      } else {
        throw new Error('WAV file was not created');
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${relativePath} - ${error.message}`);
      this.errorCount++;
      
      // Clean up any partially created WAV file
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
    }
  }
}

// Run the converter if this script is executed directly
if (require.main === module) {
  const converter = new Mp3ToWavConverter();
  converter.convertAllMp3Files().catch(console.error);
}

module.exports = { Mp3ToWavConverter };