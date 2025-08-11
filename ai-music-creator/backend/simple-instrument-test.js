/**
 * Simple Instrument and Genre Chooser for Testing
 * 
 * Creates random combinations of instruments and genres to test
 * the beat generator with non-drum instruments, ensuring proper
 * instrument selection functionality.
 */

const { generateBeat } = require('./beatGenerator');
const fs = require('fs');
const path = require('path');

class SimpleInstrumentTester {
  constructor(targetInstrument = null) {
    this.outputDir = './generated';
    this.targetInstrument = targetInstrument;
    
    // Available non-drum instrument families from NSynth
    this.availableInstruments = [
      'bass',
      'brass', 
      'flute',
      'guitar',
      'keyboard',
      'mallet',
      'organ',
      'reed',
      'string',
      'synth_lead',
      'vocal'
    ];
    
    // Available music genres/styles
    this.availableGenres = [
      'jazz',
      'funk',
      'house',
      'lo-fi',
      'pop',
      'upbeat',
      'default'
    ];
    
    // BPM ranges for variety
    this.bpmRanges = [60, 75, 90, 100, 110, 120, 128, 140, 160, 180];
    
    this.testResults = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a test configuration using target instrument
   */
  generateTestConfig(index) {
    const instrument = this.targetInstrument || this.getRandomItem(this.availableInstruments);
    const genre = this.getRandomItem(this.availableGenres);
    const bpm = this.getRandomItem(this.bpmRanges);
    const bars = this.getRandomItem([1, 2, 4]);
    
    return {
      songName: `${instrument}_Test_${String(index).padStart(2, '0')}_${genre}`,
      keyword: genre,
      bpm: bpm,
      bars: bars,
      instrument: instrument, // Force specific instrument (not auto)
      seed: `test_${instrument}_${genre}_${index}` // Reproducible results
    };
  }
  
  /**
   * Get random item from array
   */
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate 10 sample audio files with same instrument, different genres/settings
   */
  async generateSamples() {
    const testInstrument = this.targetInstrument || 'mixed';
    console.log(`🎵 Simple Instrument Tester - Generating 10 samples for: ${testInstrument}\n`);
    console.log('🚫 Excluding drums to test instrument selection properly\n');
    
    for (let i = 1; i <= 10; i++) {
      const config = this.generateTestConfig(i);
      
      console.log(`🎯 Test ${i}/10: ${config.songName}`);
      console.log(`   Instrument: ${config.instrument}`);
      console.log(`   Genre: ${config.keyword}`);
      console.log(`   BPM: ${config.bpm}, Bars: ${config.bars}`);
      
      try {
        const startTime = Date.now();
        const outputPath = await generateBeat(config);
        const duration = Date.now() - startTime;
        
        // Verify files were created
        const wavExists = fs.existsSync(outputPath);
        const mdPath = outputPath.replace('.wav', '.md');
        const mdExists = fs.existsSync(mdPath);
        
        this.testResults.push({
          test: `Test ${i}`,
          config: config,
          status: 'PASS',
          outputPath,
          duration,
          wavExists,
          mdExists
        });
        
        console.log(`   ✅ Generated in ${duration}ms`);
        console.log(`   📁 WAV: ${wavExists ? '✅' : '❌'}, MD: ${mdExists ? '✅' : '❌'}`);
        console.log();
        
      } catch (error) {
        this.testResults.push({
          test: `Test ${i}`,
          config: config,
          status: 'FAIL',
          error: error.message
        });
        
        console.error(`   ❌ Failed: ${error.message}`);
        console.log();
      }
    }
    
    this.printResults();
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('📊 Simple Instrument Test Results:\n');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total files: ${passed * 2} (${passed} WAV + ${passed} MD)`);
    
    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   ${result.test}: ${result.error}`);
        });
    }
    
    if (passed > 0) {
      console.log('\n🎵 Successfully generated combinations:');
      this.testResults
        .filter(r => r.status === 'PASS')
        .forEach(result => {
          console.log(`   ${result.config.instrument} + ${result.config.keyword} @ ${result.config.bpm}bpm`);
        });
    }
    
    // Show instrument variety
    if (this.testResults && this.testResults.length > 0) {
      const instruments = this.testResults
        .filter(r => r.status === 'PASS')
        .map(r => r.config.instrument);
      const uniqueInstruments = [...new Set(instruments)];
      
      console.log(`\n🎹 Instrument families tested: ${uniqueInstruments.length}/12`);
      console.log(`   ${uniqueInstruments.join(', ')}`);
    } else {
      console.log(`\n🎹 Instrument families tested: 0/12`);
      console.log(`   `);
    }
  }

  /**
   * Analyze generated metadata files
   */
  async analyzeMetadata() {
    console.log('\n🔍 Analyzing generated metadata...\n');
    
    const passedTests = this.testResults.filter(r => r.status === 'PASS');
    
    for (const result of passedTests) {
      const mdPath = result.outputPath.replace('.wav', '.md');
      
      if (fs.existsSync(mdPath)) {
        const content = fs.readFileSync(mdPath, 'utf8');
        
        // Extract key info from metadata
        const instrumentFamily = this.extractFromMetadata(content, 'Instrument Family: (.+)');
        const noteTypes = this.extractAllFromMetadata(content, '- Note Type: (.+)');
        const nsynthSamples = this.extractAllFromMetadata(content, '- NSynth Sample: (.+)');
        
        console.log(`📝 ${path.basename(mdPath)}`);
        console.log(`   Requested: ${result.config.instrument}`);
        console.log(`   Actual: ${instrumentFamily || 'Unknown'}`);
        console.log(`   Note types: ${noteTypes.join(', ')}`);
        console.log(`   NSynth samples: ${nsynthSamples.join(', ')}`);
        console.log();
      }
    }
  }

  /**
   * Extract single value from metadata
   */
  extractFromMetadata(content, pattern) {
    const match = content.match(new RegExp(pattern));
    return match ? match[1] : null;
  }

  /**
   * Extract all values from metadata
   */
  extractAllFromMetadata(content, pattern) {
    const matches = content.matchAll(new RegExp(pattern, 'g'));
    return Array.from(matches, match => match[1]);
  }

  /**
   * Test all non-drum instruments individually
   */
  async testAllInstruments() {
    console.log('🎹 Testing all non-drum instruments individually...\n');
    
    const allResults = {};
    
    for (const instrument of this.availableInstruments) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🎵 TESTING INSTRUMENT: ${instrument.toUpperCase()}`);
      console.log(`${'='.repeat(50)}\n`);
      
      // Create a new tester instance for this specific instrument
      const instrumentTester = new SimpleInstrumentTester(instrument);
      
      try {
        await instrumentTester.generateSamples();
        await instrumentTester.analyzeMetadata();
        
        allResults[instrument] = {
          status: 'completed',
          results: instrumentTester.testResults
        };
        
      } catch (error) {
        console.error(`❌ Failed testing ${instrument}:`, error);
        allResults[instrument] = {
          status: 'failed',
          error: error.message
        };
      }
    }
    
    this.printOverallSummary(allResults);
    return allResults;
  }

  /**
   * Print overall summary of all instrument tests
   */
  printOverallSummary(allResults) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 OVERALL INSTRUMENT TESTING SUMMARY');
    console.log(`${'='.repeat(60)}\n`);
    
    const workingInstruments = [];
    const silentInstruments = [];
    const failedInstruments = [];
    
    Object.entries(allResults).forEach(([instrument, data]) => {
      if (data.status === 'failed') {
        failedInstruments.push(instrument);
      } else {
        const passedTests = data.results.filter(r => r.status === 'PASS' && r.wavExists && r.mdExists);
        if (passedTests.length > 0) {
          workingInstruments.push(`${instrument} (${passedTests.length}/10)`);
        } else {
          silentInstruments.push(instrument);
        }
      }
    });
    
    console.log(`✅ Working Instruments (${workingInstruments.length}):`);
    workingInstruments.forEach(inst => console.log(`   ${inst}`));
    
    console.log(`\n⚠️  Silent Instruments (${silentInstruments.length}):`);
    silentInstruments.forEach(inst => console.log(`   ${inst} - No samples available`));
    
    console.log(`\n❌ Failed Instruments (${failedInstruments.length}):`);
    failedInstruments.forEach(inst => console.log(`   ${inst}`));
    
    const totalFiles = workingInstruments.length * 10 * 2; // 10 tests per instrument, 2 files per test
    console.log(`\n📁 Total files generated: ${totalFiles} (${totalFiles/2} WAV + ${totalFiles/2} MD)`);
  }
}

/**
 * Main execution
 */
async function main() {
  // Check if specific instrument was requested via command line
  const targetInstrument = process.argv[2];
  
  if (targetInstrument && targetInstrument !== 'all') {
    console.log(`🎯 Testing specific instrument: ${targetInstrument}\n`);
    const tester = new SimpleInstrumentTester(targetInstrument);
    
    try {
      await tester.generateSamples();
      await tester.analyzeMetadata();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  } else {
    // Test all instruments individually
    console.log('🎹 Testing ALL non-drum instruments (12 instruments × 10 samples each)...\n');
    const tester = new SimpleInstrumentTester();
    
    try {
      await tester.testAllInstruments();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SimpleInstrumentTester };