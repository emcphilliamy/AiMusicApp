/**
 * Freesound API Downloader
 * Downloads drum, piano, clap, and other missing instrument samples from Freesound
 * Organizes them in NSynth-compatible format
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const { execSync } = require('child_process');

class FreesoundDownloader {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://freesound.org/apiv2';
    this.samplesDir = './samples/freesound';
    this.downloadDelay = 1000; // 1 second between downloads to be respectful
    
    // Ensure samples directory exists
    this.ensureDirectories();
  }

  /**
   * Main download function - downloads all needed instruments
   */
  async downloadAllInstruments() {
    console.log('🎵 Starting Freesound sample downloads...');
    console.log('=====================================');
    
    const instrumentSpecs = {
      drums: {
        searches: [
          { query: 'acoustic kick drum hit', count: 4, tags: ['kick', 'drum', 'acoustic', 'hit', 'oneshot'] },
          { query: 'snare drum acoustic hit', count: 4, tags: ['snare', 'drum', 'acoustic', 'hit', 'oneshot'] },
          { query: 'tom drum acoustic single', count: 4, tags: ['tom', 'drum', 'acoustic', 'hit', 'oneshot'] },
          { query: 'floor tom drum hit', count: 2, tags: ['floor', 'tom', 'drum', 'acoustic', 'hit'] },
          { query: 'bass drum acoustic', count: 2, tags: ['bass', 'drum', 'kick', 'acoustic', 'hit'] },
          { query: 'drum stick hit snare', count: 2, tags: ['snare', 'stick', 'drum', 'acoustic', 'hit'] }
        ]
      },
      piano: {
        searches: [
          { query: 'piano note C', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note D', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note E', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note F', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note G', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note A', count: 2, tags: ['piano', 'note', 'key'] },
          { query: 'piano note B', count: 2, tags: ['piano', 'note', 'key'] }
        ]
      },
      claps: {
        searches: [
          { query: 'hand clap', count: 3, tags: ['clap', 'hand', 'percussion'] },
          { query: 'applause clap', count: 2, tags: ['clap', 'applause'] }
        ]
      },
      synth_lead: {
        searches: [
          { query: 'synthesizer lead', count: 3, tags: ['synth', 'lead', 'synthesizer'] },
          { query: 'electronic lead', count: 2, tags: ['electronic', 'synth', 'lead'] }
        ]
      },
      brass: {
        searches: [
          { query: 'trumpet note', count: 2, tags: ['trumpet', 'brass', 'note'] },
          { query: 'saxophone note', count: 2, tags: ['saxophone', 'sax', 'brass'] },
          { query: 'trombone note', count: 1, tags: ['trombone', 'brass', 'note'] }
        ]
      }
    };

    for (const [instrument, config] of Object.entries(instrumentSpecs)) {
      console.log(`\\n🎹 Downloading ${instrument} samples...`);
      await this.downloadInstrumentSamples(instrument, config.searches);
    }

    console.log('\\n✅ All Freesound downloads completed!');
    console.log('📁 Samples saved to:', this.samplesDir);
  }

  /**
   * Download samples for a specific instrument
   */
  async downloadInstrumentSamples(instrument, searches) {
    const instrumentDir = path.join(this.samplesDir, instrument);
    let sampleCount = 0;

    for (const searchSpec of searches) {
      console.log(`  🔍 Searching: "${searchSpec.query}"`);
      
      try {
        const searchResults = await this.searchSounds(searchSpec.query, {
          filter: this.buildSearchFilter(searchSpec.tags),
          sort: 'rating_desc',
          page_size: Math.max(searchSpec.count * 3, 10) // Get more results to filter from
        });

        const selectedSounds = this.selectBestSounds(searchResults.results, searchSpec.count);
        
        for (const sound of selectedSounds) {
          const filename = this.generateFilename(sound, instrument, sampleCount);
          const filepath = path.join(instrumentDir, filename);
          
          if (!fs.existsSync(filepath)) {
            console.log(`    ⬇️  Downloading: ${sound.name} (ID: ${sound.id})`);
            await this.downloadSound(sound, filepath);
            sampleCount++;
            
            // Add delay to be respectful to the API
            await this.delay(this.downloadDelay);
          } else {
            console.log(`    ⏭️  Skipping: ${sound.name} (already exists)`);
          }
        }
        
      } catch (error) {
        console.error(`    ❌ Error searching "${searchSpec.query}": ${error.message}`);
      }
    }

    console.log(`  ✅ Downloaded ${sampleCount} ${instrument} samples`);
  }

  /**
   * Search for sounds using Freesound API
   */
  async searchSounds(query, options = {}) {
    const params = new URLSearchParams({
      query: query,
      token: this.apiKey,
      format: 'json',
      fields: 'id,name,tags,previews,download,filesize,duration,bitdepth,samplerate',
      page_size: options.page_size || 15,
      sort: options.sort || 'score',
      ...options
    });

    if (options.filter) {
      params.set('filter', options.filter);
    }

    const url = `${this.baseUrl}/search/text/?${params.toString()}`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse search results: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Build search filter for better results
   */
  buildSearchFilter(tags) {
    // Filter for good quality samples
    const qualityFilters = [
      'duration:[0.1 TO 3.0]', // 0.1 to 3 seconds max - short samples only
      'bitdepth:16', // 16-bit samples
      'samplerate:44100' // 44.1kHz
    ];

    if (tags && tags.length > 0) {
      const tagFilter = `tag:(${tags.join(' OR ')})`;
      qualityFilters.push(tagFilter);
    }

    return qualityFilters.join(' AND ');
  }

  /**
   * Select best sounds from search results
   */
  selectBestSounds(results, count) {
    return results
      .filter(sound => {
        const name = sound.name.toLowerCase();
        
        // Filter for good one-shot samples
        return sound.download && 
               sound.duration > 0.1 && 
               sound.duration < 3.0 &&  // Max 3 seconds for one-shots
               sound.filesize < 2000000 && // Less than 2MB
               !name.includes('loop') && // No loops
               !name.includes('beat') && // No beats
               !name.includes('pattern') && // No patterns
               !name.includes('sequence') && // No sequences
               !name.includes('electronic') && // No electronic drums
               !name.includes('synthesized') && // No synthesized
               !name.includes('house') && // No house music drums
               !name.includes('techno') && // No techno drums
               !name.includes('drum kit') && // Avoid full kit samples
               !name.includes('cymbal'); // Exclude cymbals for traditional drums
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioritize acoustic samples
        const aIsAcoustic = aName.includes('acoustic') || aName.includes('live') || aName.includes('real');
        const bIsAcoustic = bName.includes('acoustic') || bName.includes('live') || bName.includes('real');
        
        if (aIsAcoustic && !bIsAcoustic) return -1;
        if (!aIsAcoustic && bIsAcoustic) return 1;
        
        // Then prefer shorter samples (closer to 1 second)
        const idealDuration = 1.0;
        const aDiff = Math.abs(a.duration - idealDuration);
        const bDiff = Math.abs(b.duration - idealDuration);
        return aDiff - bDiff;
      })
      .slice(0, count);
  }

  /**
   * Download a single sound file
   */
  async downloadSound(sound, filepath) {
    // Use preview URL if download requires OAuth (which it does)
    // Preview is usually sufficient for our needs and doesn't require OAuth
    const downloadUrl = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'];
    
    if (!downloadUrl) {
      throw new Error('No preview URL available');
    }

    // Download as MP3 first, then convert to WAV
    const mp3Filepath = filepath.replace('.wav', '.mp3');
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(mp3Filepath);
      
      https.get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', async () => {
          file.close();
          
          try {
            // Convert MP3 to WAV using ffmpeg
            await this.convertMp3ToWav(mp3Filepath, filepath);
            
            // Clean up the MP3 file
            fs.unlinkSync(mp3Filepath);
            
            resolve();
          } catch (error) {
            // Clean up both files on error
            fs.unlink(mp3Filepath, () => {});
            fs.unlink(filepath, () => {});
            reject(error);
          }
        });
        
        file.on('error', (error) => {
          fs.unlink(mp3Filepath, () => {}); // Clean up on error
          reject(error);
        });
      }).on('error', reject);
    });
  }

  /**
   * Convert MP3 to WAV using ffmpeg
   */
  async convertMp3ToWav(mp3Path, wavPath) {
    try {
      // Use ffmpeg to convert MP3 to WAV with standard audio specs
      const command = `ffmpeg -i "${mp3Path}" -ar 44100 -ac 1 -sample_fmt s16 "${wavPath}" -y`;
      execSync(command, { stdio: 'pipe' });
      console.log(`    🔄 Converted: ${path.basename(mp3Path)} → ${path.basename(wavPath)}`);
    } catch (error) {
      throw new Error(`Failed to convert MP3 to WAV: ${error.message}`);
    }
  }

  /**
   * Generate consistent filename for samples
   */
  generateFilename(sound, instrument, index) {
    const cleanName = sound.name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 30);
    
    const extension = sound.previews['preview-hq-mp3'] ? 'mp3' : 'wav';
    return `${instrument}_${index.toString().padStart(3, '0')}_${cleanName}.${extension}`;
  }

  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    const instruments = ['drums', 'piano', 'claps', 'synth_lead', 'brass'];
    
    for (const instrument of instruments) {
      const dir = path.join(this.samplesDir, instrument);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Utility function for delays
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create metadata file for downloaded samples
   */
  async createMetadata() {
    console.log('\\n📝 Creating metadata files...');
    
    const metadata = {
      source: 'Freesound.org',
      downloadedAt: new Date().toISOString(),
      instruments: {}
    };

    const instruments = ['drums', 'piano', 'claps', 'synth_lead', 'brass'];
    
    for (const instrument of instruments) {
      const instrumentDir = path.join(this.samplesDir, instrument);
      if (fs.existsSync(instrumentDir)) {
        const files = fs.readdirSync(instrumentDir)
          .filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
        
        metadata.instruments[instrument] = {
          count: files.length,
          files: files,
          format: files.length > 0 ? path.extname(files[0]).substring(1) : 'unknown'
        };
      }
    }

    const metadataPath = path.join(this.samplesDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Metadata saved to:', metadataPath);
    return metadata;
  }
}

module.exports = { FreesoundDownloader };

// Example usage (requires API key)
if (require.main === module) {
  console.log('🚀 Freesound Downloader');
  console.log('=====================');
  console.log('');
  console.log('⚠️  To use this downloader, you need:');
  console.log('   1. A Freesound.org account');
  console.log('   2. API key from: https://freesound.org/apiv2/apply');
  console.log('   3. Set your API key as environment variable:');
  console.log('      export FREESOUND_API_KEY="your_api_key_here"');
  console.log('');
  console.log('Usage: FREESOUND_API_KEY="your_key" node freesound-downloader.js');
  console.log('');
  
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    console.log('❌ Missing FREESOUND_API_KEY environment variable');
    process.exit(1);
  }
  
  const downloader = new FreesoundDownloader(apiKey);
  downloader.downloadAllInstruments()
    .then(() => downloader.createMetadata())
    .then((metadata) => {
      console.log('\\n🎯 Download Summary:');
      Object.entries(metadata.instruments).forEach(([instrument, info]) => {
        console.log(`   ${instrument}: ${info.count} files (${info.format})`);
      });
    })
    .catch(console.error);
}