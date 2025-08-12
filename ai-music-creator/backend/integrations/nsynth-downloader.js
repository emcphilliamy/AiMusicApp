// NSynth Dataset Downloader and Organizer
// Downloads isolated instrument notes from NSynth dataset and organizes by instrument type

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class NSynthDownloader {
  constructor() {
    this.baseDataDir = path.join(__dirname, '../nsynth-data');
    this.instrumentFolders = {
      'guitar': path.join(this.baseDataDir, 'guitarNsynth'),
      'keyboard': path.join(this.baseDataDir, 'keyboardNsynth'),
      'bass': path.join(this.baseDataDir, 'bassNsynth'),
      'drums': path.join(this.baseDataDir, 'drumsNsynth'),
      'brass': path.join(this.baseDataDir, 'brassNsynth'),
      'string': path.join(this.baseDataDir, 'stringNsynth'),
      'flute': path.join(this.baseDataDir, 'fluteNsynth'),
      'mallet': path.join(this.baseDataDir, 'malletNsynth'),
      'organ': path.join(this.baseDataDir, 'organNsynth'),
      'reed': path.join(this.baseDataDir, 'reedNsynth'),
      'synth_lead': path.join(this.baseDataDir, 'synthNsynth'),
      'vocal': path.join(this.baseDataDir, 'vocalNsynth')
    };
    
    // NSynth dataset URLs
    this.nsynthUrls = {
      train: 'http://download.magenta.tensorflow.org/datasets/nsynth/nsynth-train.jsonwav.tar.gz',
      valid: 'http://download.magenta.tensorflow.org/datasets/nsynth/nsynth-valid.jsonwav.tar.gz',
      test: 'http://download.magenta.tensorflow.org/datasets/nsynth/nsynth-test.jsonwav.tar.gz'
    };
    
    this.initializeDirectories();
  }

  initializeDirectories() {
    // Create base data directory
    if (!fs.existsSync(this.baseDataDir)) {
      fs.mkdirSync(this.baseDataDir, { recursive: true });
      console.log(`📁 Created NSynth data directory: ${this.baseDataDir}`);
    }
    
    // Create instrument-specific directories
    Object.values(this.instrumentFolders).forEach(folder => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`📁 Created instrument directory: ${path.basename(folder)}`);
      }
    });
  }

  async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      console.log(`📥 Downloading: ${url}`);
      console.log(`📂 To: ${outputPath}`);
      
      const file = fs.createWriteStream(outputPath);
      const request = protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
          process.stdout.write(`\r📊 Progress: ${progress}%`);
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`\n✅ Download completed: ${path.basename(outputPath)}`);
          resolve();
        });
      });
      
      request.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
  }

  async extractTarGz(tarPath, extractPath) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      console.log(`📦 Extracting: ${path.basename(tarPath)}`);
      
      const tar = spawn('tar', ['-xzf', tarPath, '-C', extractPath]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Extracted: ${path.basename(tarPath)}`);
          resolve();
        } else {
          reject(new Error(`Extraction failed with code: ${code}`));
        }
      });
      
      tar.on('error', reject);
    });
  }

  parseNSynthFilename(filename) {
    // NSynth filename format: instrument_family-instrument_source-pitch-velocity.wav
    // Example: keyboard_acoustic-guitar_000-069-100.wav
    const parts = filename.replace('.wav', '').split('-');
    
    if (parts.length >= 3) {
      const instrumentInfo = parts[0];
      const pitch = parseInt(parts[parts.length - 2]);
      const velocity = parseInt(parts[parts.length - 1]);
      
      // Extract instrument family (first part before underscore)
      const instrumentFamily = instrumentInfo.split('_')[0];
      
      return {
        instrumentFamily,
        pitch,
        velocity,
        originalName: filename
      };
    }
    
    return null;
  }

  organizeAudioFiles(extractedPath) {
    console.log(`🗂️  Organizing audio files by instrument...`);
    
    const audioPath = path.join(extractedPath, 'nsynth-train', 'audio'); // Adjust based on actual structure
    
    if (!fs.existsSync(audioPath)) {
      console.warn(`⚠️  Audio path not found: ${audioPath}`);
      return;
    }
    
    const audioFiles = fs.readdirSync(audioPath).filter(file => file.endsWith('.wav'));
    
    let organizationStats = {};
    
    audioFiles.forEach(file => {
      const fileInfo = this.parseNSynthFilename(file);
      
      if (fileInfo && this.instrumentFolders[fileInfo.instrumentFamily]) {
        const sourceFile = path.join(audioPath, file);
        const targetFolder = this.instrumentFolders[fileInfo.instrumentFamily];
        
        // Create note-specific filename: pitch-velocity.wav
        const newFilename = `${fileInfo.pitch}-${fileInfo.velocity}.wav`;
        const targetFile = path.join(targetFolder, newFilename);
        
        // Copy file to organized folder
        fs.copyFileSync(sourceFile, targetFile);
        
        // Update stats
        if (!organizationStats[fileInfo.instrumentFamily]) {
          organizationStats[fileInfo.instrumentFamily] = 0;
        }
        organizationStats[fileInfo.instrumentFamily]++;
      }
    });
    
    // Print organization results
    console.log(`\n📊 Organization Results:`);
    Object.entries(organizationStats).forEach(([instrument, count]) => {
      console.log(`  🎵 ${instrument}: ${count} notes`);
    });
  }

  async downloadAndOrganizeDataset(datasetType = 'train') {
    try {
      const url = this.nsynthUrls[datasetType];
      const filename = `nsynth-${datasetType}.jsonwav.tar.gz`;
      const downloadPath = path.join(this.baseDataDir, filename);
      
      // Download dataset
      if (!fs.existsSync(downloadPath)) {
        await this.downloadFile(url, downloadPath);
      } else {
        console.log(`📁 Dataset already downloaded: ${filename}`);
      }
      
      // Extract dataset
      const extractPath = this.baseDataDir;
      await this.extractTarGz(downloadPath, extractPath);
      
      // Organize by instrument
      this.organizeAudioFiles(extractPath);
      
      console.log(`\n✅ NSynth ${datasetType} dataset ready!`);
      this.printInstrumentSummary();
      
    } catch (error) {
      console.error(`❌ Error processing NSynth dataset:`, error.message);
    }
  }

  printInstrumentSummary() {
    console.log(`\n🎵 Available Instrument Folders:`);
    Object.entries(this.instrumentFolders).forEach(([instrument, folder]) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter(f => f.endsWith('.wav'));
        console.log(`  📂 ${instrument}Nsynth: ${files.length} isolated notes`);
      }
    });
  }

  // Get available notes for a specific instrument
  getInstrumentNotes(instrumentFamily) {
    const folder = this.instrumentFolders[instrumentFamily];
    
    if (!folder || !fs.existsSync(folder)) {
      return [];
    }
    
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.wav'));
    
    return files.map(file => {
      const [pitch, velocity] = file.replace('.wav', '').split('-').map(Number);
      return {
        pitch,
        velocity,
        filename: file,
        path: path.join(folder, file)
      };
    }).sort((a, b) => a.pitch - b.pitch);
  }

  // Find a specific note
  findNote(instrumentFamily, pitch, velocity = null) {
    const notes = this.getInstrumentNotes(instrumentFamily);
    
    if (velocity !== null) {
      return notes.find(note => note.pitch === pitch && note.velocity === velocity);
    }
    
    // If no velocity specified, return the first note with matching pitch
    return notes.find(note => note.pitch === pitch);
  }

  // Get note by MIDI note number (21-108)
  getNoteByMidi(instrumentFamily, midiNote, velocity = 100) {
    return this.findNote(instrumentFamily, midiNote, velocity);
  }
}

// Export for use in other modules
module.exports = { NSynthDownloader };

// CLI usage
if (require.main === module) {
  const downloader = new NSynthDownloader();
  
  const args = process.argv.slice(2);
  const datasetType = args[0] || 'train';
  
  console.log(`🎵 NSynth Dataset Downloader Starting...`);
  console.log(`📊 Dataset Type: ${datasetType}`);
  
  downloader.downloadAndOrganizeDataset(datasetType)
    .then(() => {
      console.log(`\n🎉 NSynth setup completed!`);
      console.log(`📁 Data stored in: ${downloader.baseDataDir}`);
    })
    .catch(error => {
      console.error(`💥 Setup failed:`, error);
    });
}