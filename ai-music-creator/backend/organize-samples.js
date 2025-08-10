const fs = require('fs');
const path = require('path');

// Get list of WAV files
const audioDir = './nsynth-data/nsynth-valid/audio';
const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.wav'));

console.log('Found', files.length, 'samples');

// Group by instrument family
const instruments = {};
files.forEach(file => {
  const parts = file.split('_');
  const instrumentFamily = parts[0];
  if (!instruments[instrumentFamily]) instruments[instrumentFamily] = [];
  instruments[instrumentFamily].push(file);
});

console.log('Instrument families found:');
Object.keys(instruments).forEach(inst => {
  console.log('  ' + inst + ': ' + instruments[inst].length + ' samples');
});

// Now organize into folders
const instrumentFolders = {
  'guitar': 'guitarNsynth',
  'piano': 'pianoNsynth',  
  'keyboard': 'keyboardNsynth',
  'bass': 'bassNsynth',
  'drums': 'drumsNsynth',
  'brass': 'brassNsynth',
  'string': 'stringNsynth',
  'flute': 'fluteNsynth',
  'mallet': 'malletNsynth',
  'organ': 'organNsynth',
  'reed': 'reedNsynth',
  'synth_lead': 'synthNsynth',
  'vocal': 'vocalNsynth'
};

console.log('\nOrganizing samples...');
let totalCopied = 0;

Object.keys(instruments).forEach(instrumentFamily => {
  if (instrumentFolders[instrumentFamily]) {
    const targetDir = path.join('./nsynth-data', instrumentFolders[instrumentFamily]);
    
    // Copy samples to target directory
    instruments[instrumentFamily].forEach(file => {
      const sourceFile = path.join(audioDir, file);
      
      // Parse filename to get pitch and velocity
      const parts = file.replace('.wav', '').split('-');
      const pitch = parts[parts.length - 2];
      const velocity = parts[parts.length - 1];
      
      // Create simplified filename: pitch-velocity.wav
      const newFilename = pitch + '-' + velocity + '.wav';
      const targetFile = path.join(targetDir, newFilename);
      
      // Only copy if target doesn't exist
      if (!fs.existsSync(targetFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        totalCopied++;
      }
    });
    
    console.log('  Organized ' + instrumentFamily + ': ' + instruments[instrumentFamily].length + ' samples');
  } else {
    console.log('  Skipped ' + instrumentFamily + ': no target folder');
  }
});

console.log('\nTotal samples copied:', totalCopied);
console.log('Sample organization complete!');