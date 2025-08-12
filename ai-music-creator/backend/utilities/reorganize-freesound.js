/**
 * Reorganize Freesound samples to match NSynth data structure
 * Converts from samples/freesound/{instrument}/*.mp3 
 * to freesound-data/{instrument}Nsynth/{midi}-{velocity}.mp3
 */

const fs = require('fs');
const path = require('path');

class FreesoundReorganizer {
  constructor() {
    this.sourceDir = './samples/freesound';
    this.targetDir = './freesound-data';
    
    // MIDI note mappings for different instrument types
    this.instrumentMappings = {
      drums: {
        // Map drum types to specific MIDI notes (GM Drum Map standard)
        kick: [36, 35], // C2, B1 - Kick drums  
        snare: [38, 40], // D2, E2 - Snare drums
        hihat: [42, 44, 46], // F#2, G#2, A#2 - Hi-hats (closed, pedal, open)
        tom: [41, 43, 45, 47, 48, 50], // F2, G2, A2, B2, C3, D3 - Toms
        ride: [51, 53, 59], // D#3, F3, B3 - Ride cymbals
        crash: [49, 52, 55, 57], // C#3, E3, G3, A3 - Crash cymbals
      },
      piano: {
        // Map to standard piano range (C3-C6)
        base: [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72] // C3 to C5
      },
      claps: {
        // Map claps to percussion range
        clap: [39, 82], // D#2, A#5 - Hand clap, shaker
        applause: [126, 127] // High percussion range
      },
      synth_lead: {
        // Map to lead synth range (C4-C6) 
        base: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84] // C4 to C6
      },
      brass: {
        // Map to brass range (C3-C5)
        trumpet: [60, 62, 64, 67, 69], // C4, D4, E4, G4, A4
        saxophone: [58, 60, 62, 65, 67], // A#3, C4, D4, F4, G4  
        trombone: [48, 50, 52, 55, 57] // C3, D3, E3, G3, A3
      }
    };

    // Velocity levels to assign
    this.velocities = [25, 50, 75, 100, 127];
  }

  /**
   * Main reorganization function
   */
  async reorganize() {
    console.log('🔄 Reorganizing Freesound samples to match NSynth structure...');
    console.log('====================================================================');

    // Create target directory
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
    }

    // Process each instrument type
    const instruments = ['drums', 'piano', 'claps', 'synth_lead', 'brass'];
    
    for (const instrument of instruments) {
      await this.processInstrument(instrument);
    }

    console.log('\n✅ Freesound reorganization completed!');
    console.log(`📁 Samples organized in: ${this.targetDir}`);
    
    // Create summary
    this.createSummary();
  }

  /**
   * Process a single instrument type
   */
  async processInstrument(instrument) {
    const sourceInstrumentDir = path.join(this.sourceDir, instrument);
    const targetInstrumentDir = path.join(this.targetDir, `${instrument}Nsynth`);

    if (!fs.existsSync(sourceInstrumentDir)) {
      console.log(`⚠️  Skipping ${instrument} - source directory not found`);
      return;
    }

    console.log(`\n🎵 Processing ${instrument}...`);

    // Create target instrument directory
    if (!fs.existsSync(targetInstrumentDir)) {
      fs.mkdirSync(targetInstrumentDir, { recursive: true });
    }

    // Get all source files
    const sourceFiles = fs.readdirSync(sourceInstrumentDir)
      .filter(file => file.endsWith('.mp3'))
      .sort();

    console.log(`   Found ${sourceFiles.length} source files`);

    // Map files to MIDI notes and velocities
    const fileMappings = this.createFileMappings(instrument, sourceFiles);
    
    let processedCount = 0;
    for (const mapping of fileMappings) {
      const sourcePath = path.join(sourceInstrumentDir, mapping.sourceFile);
      const targetPath = path.join(targetInstrumentDir, mapping.targetFile);

      try {
        // Copy file to new location with NSynth naming
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`   ✓ ${mapping.sourceFile} → ${mapping.targetFile}`);
        processedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to copy ${mapping.sourceFile}: ${error.message}`);
      }
    }

    console.log(`   ✅ Processed ${processedCount}/${sourceFiles.length} files for ${instrument}`);
  }

  /**
   * Create file mappings from source files to NSynth format
   */
  createFileMappings(instrument, sourceFiles) {
    const mappings = [];
    const instrumentMapping = this.instrumentMappings[instrument];

    if (instrument === 'drums') {
      // Map drum files based on their names to appropriate MIDI notes
      sourceFiles.forEach((file, index) => {
        const drumType = this.identifyDrumType(file);
        const midiNotes = instrumentMapping[drumType] || instrumentMapping.kick;
        const midiNote = midiNotes[index % midiNotes.length];
        const velocity = this.velocities[index % this.velocities.length];
        
        mappings.push({
          sourceFile: file,
          targetFile: `${midiNote.toString().padStart(3, '0')}-${velocity.toString().padStart(3, '0')}.mp3`,
          midiNote: midiNote,
          velocity: velocity,
          drumType: drumType
        });
      });
    } else if (instrument === 'brass') {
      // Map brass files based on their names  
      sourceFiles.forEach((file, index) => {
        const brassType = this.identifyBrassType(file);
        const midiNotes = instrumentMapping[brassType] || instrumentMapping.trumpet;
        const midiNote = midiNotes[index % midiNotes.length];
        const velocity = this.velocities[index % this.velocities.length];
        
        mappings.push({
          sourceFile: file,
          targetFile: `${midiNote.toString().padStart(3, '0')}-${velocity.toString().padStart(3, '0')}.mp3`,
          midiNote: midiNote,
          velocity: velocity,
          brassType: brassType
        });
      });
    } else if (instrument === 'claps') {
      // Map clap files
      sourceFiles.forEach((file, index) => {
        const clapType = file.toLowerCase().includes('applause') ? 'applause' : 'clap';
        const midiNotes = instrumentMapping[clapType];
        const midiNote = midiNotes[index % midiNotes.length];
        const velocity = this.velocities[index % this.velocities.length];
        
        mappings.push({
          sourceFile: file,
          targetFile: `${midiNote.toString().padStart(3, '0')}-${velocity.toString().padStart(3, '0')}.mp3`,
          midiNote: midiNote,
          velocity: velocity,
          clapType: clapType
        });
      });
    } else {
      // For piano and synth_lead, distribute across the base range
      const baseNotes = instrumentMapping.base;
      sourceFiles.forEach((file, index) => {
        const midiNote = baseNotes[index % baseNotes.length];
        const velocity = this.velocities[index % this.velocities.length];
        
        mappings.push({
          sourceFile: file,
          targetFile: `${midiNote.toString().padStart(3, '0')}-${velocity.toString().padStart(3, '0')}.mp3`,
          midiNote: midiNote,
          velocity: velocity
        });
      });
    }

    return mappings;
  }

  /**
   * Identify drum type from filename
   */
  identifyDrumType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('kick')) return 'kick';
    if (name.includes('snare')) return 'snare'; 
    if (name.includes('hihat') || name.includes('hat')) return 'hihat';
    if (name.includes('tom')) return 'tom';
    if (name.includes('ride')) return 'ride';
    if (name.includes('crash')) return 'crash';
    
    // Default based on order if no clear match
    return 'kick'; // Default fallback
  }

  /**
   * Identify brass type from filename
   */
  identifyBrassType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('trumpet') || name.includes('cornet')) return 'trumpet';
    if (name.includes('sax') || name.includes('saxophone')) return 'saxophone';
    if (name.includes('trombone')) return 'trombone';
    
    return 'trumpet'; // Default fallback
  }

  /**
   * Create a summary of the reorganization
   */
  createSummary() {
    console.log('\n📊 Reorganization Summary:');
    console.log('========================');

    const instruments = fs.readdirSync(this.targetDir)
      .filter(dir => dir.endsWith('Nsynth'))
      .sort();

    let totalFiles = 0;
    instruments.forEach(instrument => {
      const instrumentDir = path.join(this.targetDir, instrument);
      const files = fs.readdirSync(instrumentDir)
        .filter(file => file.endsWith('.mp3'));
      
      console.log(`${instrument}: ${files.length} files`);
      totalFiles += files.length;
    });

    console.log(`\nTotal: ${totalFiles} files across ${instruments.length} instruments`);
    
    // Create metadata file
    const metadata = {
      source: 'Freesound.org (reorganized)',
      reorganizedAt: new Date().toISOString(),
      format: 'NSynth-compatible',
      structure: '{MIDI_NOTE}-{VELOCITY}.mp3',
      instruments: {}
    };

    instruments.forEach(instrument => {
      const instrumentDir = path.join(this.targetDir, instrument);
      const files = fs.readdirSync(instrumentDir)
        .filter(file => file.endsWith('.mp3'));
      
      metadata.instruments[instrument] = {
        count: files.length,
        format: 'mp3',
        midiRange: this.getMidiRange(files),
        velocityRange: this.getVelocityRange(files)
      };
    });

    const metadataPath = path.join(this.targetDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\n📝 Metadata saved to: ${metadataPath}`);
  }

  /**
   * Get MIDI note range from filenames
   */
  getMidiRange(files) {
    const midiNotes = files.map(file => {
      const parts = path.basename(file, '.mp3').split('-');
      return parseInt(parts[0]);
    }).filter(note => !isNaN(note));

    if (midiNotes.length === 0) return null;
    
    return {
      min: Math.min(...midiNotes),
      max: Math.max(...midiNotes)
    };
  }

  /**
   * Get velocity range from filenames  
   */
  getVelocityRange(files) {
    const velocities = files.map(file => {
      const parts = path.basename(file, '.mp3').split('-');
      return parseInt(parts[1]);
    }).filter(vel => !isNaN(vel));

    if (velocities.length === 0) return null;
    
    return {
      min: Math.min(...velocities),
      max: Math.max(...velocities)
    };
  }
}

// Run the reorganization if this script is executed directly
if (require.main === module) {
  const reorganizer = new FreesoundReorganizer();
  reorganizer.reorganize()
    .then(() => {
      console.log('\n🎉 Freesound samples successfully reorganized to NSynth format!');
      console.log('📁 New structure: freesound-data/{instrument}Nsynth/{midi}-{velocity}.mp3');
    })
    .catch(console.error);
}

module.exports = { FreesoundReorganizer };