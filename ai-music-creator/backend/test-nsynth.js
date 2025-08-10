// Test NSynth Integration
// Demonstrates how to use the NSynth downloader and API endpoints

const { NSynthDownloader } = require('./nsynth-downloader');

async function testNSynthIntegration() {
  console.log('🎵 Testing NSynth Integration...\n');
  
  // Initialize downloader
  const downloader = new NSynthDownloader();
  
  // Test 1: Check initial status
  console.log('📊 Test 1: Initial Status');
  downloader.printInstrumentSummary();
  
  // Test 2: Download a small dataset (test set)
  console.log('\n📥 Test 2: Download NSynth Test Dataset');
  console.log('Note: This will download ~100MB of data');
  console.log('Starting download...');
  
  try {
    await downloader.downloadAndOrganizeDataset('test');
    console.log('✅ Download and organization completed!');
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    console.log('💡 Make sure you have internet connection and sufficient disk space');
  }
  
  // Test 3: Check available instruments after download
  console.log('\n🎹 Test 3: Available Instruments After Download');
  downloader.printInstrumentSummary();
  
  // Test 4: Get guitar notes (if available)
  console.log('\n🎸 Test 4: Guitar Notes');
  const guitarNotes = downloader.getInstrumentNotes('guitar');
  if (guitarNotes.length > 0) {
    console.log(`Found ${guitarNotes.length} guitar notes:`);
    guitarNotes.slice(0, 5).forEach(note => {
      console.log(`  🎵 Pitch ${note.pitch}, Velocity ${note.velocity}: ${note.filename}`);
    });
    if (guitarNotes.length > 5) {
      console.log(`  ... and ${guitarNotes.length - 5} more`);
    }
  } else {
    console.log('No guitar notes found. Try downloading the full training dataset.');
  }
  
  // Test 5: Find specific note
  console.log('\n🎯 Test 5: Find Specific Note');
  const middleC = downloader.findNote('guitar', 60); // MIDI note 60 = Middle C
  if (middleC) {
    console.log(`Found Middle C for guitar: ${middleC.filename}`);
    console.log(`Path: ${middleC.path}`);
  } else {
    console.log('Middle C (pitch 60) not found for guitar');
  }
  
  // Test 6: API endpoint examples
  console.log('\n🌐 Test 6: API Endpoint Examples');
  console.log('Once your server is running, you can test these endpoints:');
  console.log('');
  console.log('• Check NSynth status:');
  console.log('  GET http://localhost:3001/api/nsynth/status');
  console.log('');
  console.log('• Download training dataset:');
  console.log('  POST http://localhost:3001/api/nsynth/download/train');
  console.log('');
  console.log('• List available instruments:');
  console.log('  GET http://localhost:3001/api/nsynth/instruments');
  console.log('');
  console.log('• Get guitar notes:');
  console.log('  GET http://localhost:3001/api/nsynth/instrument/guitar/notes');
  console.log('');
  console.log('• Get specific note (pitch 60, velocity 100):');
  console.log('  GET http://localhost:3001/api/nsynth/note/guitar/60/100');
  console.log('');
  
  console.log('🎉 NSynth integration test completed!');
}

// Run the test
if (require.main === module) {
  testNSynthIntegration()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testNSynthIntegration };