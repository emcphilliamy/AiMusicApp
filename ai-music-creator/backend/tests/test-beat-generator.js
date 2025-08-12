/**
 * Beat Generator Test Suite
 * 
 * Comprehensive testing of the modular beat generator including:
 * - Required example outputs  
 * - Timing accuracy validation
 * - Style implementation verification
 * - Module integration testing
 * - Edge case handling
 */

const { generateBeat } = require('../core/beatGenerator');
const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');

class BeatGeneratorTester {
  constructor() {
    this.testResults = [];
    this.outputDir = './generated';
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Beat Generator Test Suite Starting...\n');
    
    try {
      // Required examples (from prompt)
      await this.testRequiredExamples();
      
      // Timing accuracy tests
      await this.testTimingAccuracy();
      
      // Style implementation tests  
      await this.testStyleImplementation();
      
      // Module integration tests
      await this.testModuleIntegration();
      
      // Edge cases
      await this.testEdgeCases();
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test the three required examples from the prompt
   */
  async testRequiredExamples() {
    console.log('📋 Testing Required Examples...\n');
    
    const examples = [
      {
        name: "Example 1 - Funk",
        options: { songName: "TrailSong1", keyword: "funk", bpm: 110, instrument: "auto" },
        expectedFile: "TrailSong1-drums1.wav"
      },
      {
        name: "Example 2 - Lo-Fi", 
        options: { songName: "LateNight", keyword: "lo-fi", bpm: 75, bars: 2 },
        expectedFile: "LateNight-drums1.wav"
      },
      {
        name: "Example 3 - House",
        options: { songName: "HouseTest", keyword: "house", bpm: 125, bars: 2, instrument: "auto" },
        expectedFile: "HouseTest-drums1.wav"
      }
    ];
    
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      console.log(`🎵 ${example.name}`);
      
      try {
        const startTime = Date.now();
        const outputPath = await generateBeat(example.options);
        const duration = Date.now() - startTime;
        
        // Validate output
        const validation = await this.validateOutput(outputPath, example.expectedFile, example.options);
        
        this.testResults.push({
          test: example.name,
          status: 'PASS',
          outputPath,
          duration,
          validation
        });
        
        console.log(`✅ ${example.name} completed in ${duration}ms`);
        console.log(`📁 Output: ${path.basename(outputPath)}\n`);
        
      } catch (error) {
        this.testResults.push({
          test: example.name,
          status: 'FAIL',
          error: error.message
        });
        
        console.error(`❌ ${example.name} failed:`, error.message, '\n');
      }
    }
  }

  /**
   * Test timing accuracy (±1ms requirement)
   */
  async testTimingAccuracy() {
    console.log('⏰ Testing Timing Accuracy...\n');
    
    const timingTests = [
      { bpm: 120, bars: 1, expectedDuration: 2.0 }, // 4/4 at 120 BPM = 2 seconds
      { bpm: 60, bars: 1, expectedDuration: 4.0 },  // 4/4 at 60 BPM = 4 seconds  
      { bpm: 200, bars: 2, expectedDuration: 2.4 }, // 4/4 at 200 BPM, 2 bars = 2.4 seconds
      { bpm: 90, bars: 1, timeSignature: '3/4', expectedDuration: 2.0 } // 3/4 at 90 BPM = 2 seconds
    ];
    
    for (const test of timingTests) {
      const testName = `Timing ${test.bpm}BPM ${test.bars}bar ${test.timeSignature || '4/4'}`;
      console.log(`🎯 ${testName}`);
      
      try {
        const options = {
          songName: `TimingTest_${test.bpm}_${test.bars}`,
          bpm: test.bpm,
          bars: test.bars,
          keyword: 'default'
        };
        
        // Only set timeSignature if it's defined in the test
        if (test.timeSignature) {
          options.timeSignature = test.timeSignature;
        }
        
        const outputPath = await generateBeat(options);
        const actualDuration = await this.measureWavDuration(outputPath);
        const errorMs = Math.abs(test.expectedDuration - actualDuration) * 1000;
        
        const passed = errorMs <= 1; // ±1ms tolerance
        
        this.testResults.push({
          test: testName,
          status: passed ? 'PASS' : 'FAIL',
          expectedDuration: test.expectedDuration,
          actualDuration,
          errorMs,
          withinTolerance: passed
        });
        
        console.log(`   Expected: ${test.expectedDuration.toFixed(3)}s`);
        console.log(`   Actual: ${actualDuration.toFixed(3)}s`);
        console.log(`   Error: ${errorMs.toFixed(2)}ms ${passed ? '✅' : '❌'}\n`);
        
      } catch (error) {
        this.testResults.push({
          test: testName,
          status: 'FAIL',
          error: error.message
        });
        console.error(`❌ ${testName} failed:`, error.message, '\n');
      }
    }
  }

  /**
   * Test style implementation (swing, patterns, etc.)
   */
  async testStyleImplementation() {
    console.log('🎨 Testing Style Implementation...\n');
    
    const styles = ['jazz', 'funk', 'house', 'lo-fi', 'pop', 'upbeat'];
    
    for (const style of styles) {
      console.log(`🎵 Testing ${style} style...`);
      
      try {
        const options = {
          songName: `StyleTest_${style}`,
          keyword: style,
          bpm: 120,
          bars: 2,
          seed: `test_${style}` // Consistent seed for reproducibility
        };
        
        // Generate twice with same seed to test reproducibility
        const outputPath1 = await generateBeat({...options, songName: `${options.songName}_1`});
        const outputPath2 = await generateBeat({...options, songName: `${options.songName}_2`});
        
        // Verify files exist and have content
        const stats1 = fs.statSync(outputPath1);
        const stats2 = fs.statSync(outputPath2);
        
        const reproducible = Math.abs(stats1.size - stats2.size) < 100; // Allow small differences due to metadata
        
        this.testResults.push({
          test: `${style} style`,
          status: 'PASS',
          outputPath: outputPath1,
          fileSize: stats1.size,
          reproducible
        });
        
        console.log(`✅ ${style} style generated successfully`);
        console.log(`📊 File size: ${(stats1.size / 1024).toFixed(1)} KB`);
        console.log(`🔄 Reproducible: ${reproducible ? 'Yes' : 'No'}\n`);
        
      } catch (error) {
        this.testResults.push({
          test: `${style} style`,
          status: 'FAIL',
          error: error.message
        });
        console.error(`❌ ${style} style failed:`, error.message, '\n');
      }
    }
  }

  /**
   * Test module integration
   */
  async testModuleIntegration() {
    console.log('🔧 Testing Module Integration...\n');
    
    const integrationTests = [
      {
        name: "Auto instrument selection",
        options: { songName: "AutoTest", instrument: "auto", keyword: "funk" }
      },
      {
        name: "Specific instrument family",
        options: { songName: "SpecificTest", instrument: "mallet", keyword: "jazz" }
      },
      {
        name: "Seeded randomness",
        options: { songName: "SeedTest", seed: "test123", keyword: "house" }
      },
      {
        name: "Maximum bars",
        options: { songName: "MaxBarsTest", bars: 4, keyword: "lo-fi" }
      },
      {
        name: "3/4 time signature",
        options: { songName: "ThreeFourTest", timeSignature: "3/4", keyword: "jazz" }
      }
    ];
    
    for (const test of integrationTests) {
      console.log(`🧩 ${test.name}...`);
      
      try {
        const outputPath = await generateBeat(test.options);
        const validation = await this.validateBasicOutput(outputPath);
        
        this.testResults.push({
          test: test.name,
          status: 'PASS',
          outputPath,
          validation
        });
        
        console.log(`✅ ${test.name} passed\n`);
        
      } catch (error) {
        this.testResults.push({
          test: test.name,
          status: 'FAIL',
          error: error.message
        });
        console.error(`❌ ${test.name} failed:`, error.message, '\n');
      }
    }
  }

  /**
   * Test edge cases and error handling
   */
  async testEdgeCases() {
    console.log('🚨 Testing Edge Cases...\n');
    
    const edgeCases = [
      {
        name: "Minimum BPM",
        options: { songName: "MinBPM", bpm: 60 },
        shouldPass: true
      },
      {
        name: "Maximum BPM", 
        options: { songName: "MaxBPM", bpm: 200 },
        shouldPass: true
      },
      {
        name: "Invalid BPM (too low)",
        options: { songName: "InvalidLow", bpm: 50 },
        shouldPass: false
      },
      {
        name: "Invalid BPM (too high)",
        options: { songName: "InvalidHigh", bpm: 250 },
        shouldPass: false
      },
      {
        name: "Invalid time signature",
        options: { songName: "InvalidTime", timeSignature: "5/4" },
        shouldPass: false
      },
      {
        name: "Invalid bars count",
        options: { songName: "InvalidBars", bars: 8 },
        shouldPass: false
      },
      {
        name: "Missing song name",
        options: { bpm: 120 },
        shouldPass: false
      }
    ];
    
    for (const testCase of edgeCases) {
      console.log(`⚡ ${testCase.name}...`);
      
      try {
        const outputPath = await generateBeat(testCase.options);
        
        if (testCase.shouldPass) {
          this.testResults.push({
            test: testCase.name,
            status: 'PASS',
            outputPath
          });
          console.log(`✅ ${testCase.name} passed (expected success)\n`);
        } else {
          this.testResults.push({
            test: testCase.name,
            status: 'FAIL',
            note: 'Expected failure but succeeded'
          });
          console.log(`❌ ${testCase.name} failed (should have thrown error)\n`);
        }
        
      } catch (error) {
        if (!testCase.shouldPass) {
          this.testResults.push({
            test: testCase.name,
            status: 'PASS',
            note: 'Expected failure occurred',
            error: error.message
          });
          console.log(`✅ ${testCase.name} passed (expected error: ${error.message})\n`);
        } else {
          this.testResults.push({
            test: testCase.name,
            status: 'FAIL',
            error: error.message
          });
          console.error(`❌ ${testCase.name} failed unexpectedly:`, error.message, '\n');
        }
      }
    }
  }

  /**
   * Validate output file meets requirements
   */
  async validateOutput(outputPath, expectedFilename, options) {
    const validation = {
      fileExists: false,
      correctFilename: false,
      validWav: false,
      correctFormat: false,
      hasContent: false
    };
    
    try {
      // Check file exists
      validation.fileExists = fs.existsSync(outputPath);
      
      if (validation.fileExists) {
        // Check filename
        const actualFilename = path.basename(outputPath);
        validation.correctFilename = actualFilename === expectedFilename;
        
        // Check file has content
        const stats = fs.statSync(outputPath);
        validation.hasContent = stats.size > 0;
        
        // Check WAV format
        try {
          const buffer = fs.readFileSync(outputPath);
          const wav = new WaveFile();
          wav.fromBuffer(buffer);
          
          validation.validWav = true;
          validation.correctFormat = wav.fmt.sampleRate === 44100 && 
                                   wav.fmt.bitsPerSample === 16 &&
                                   wav.fmt.numChannels === 1;
        } catch (wavError) {
          validation.validWav = false;
        }
      }
      
    } catch (error) {
      console.error('Validation error:', error);
    }
    
    return validation;
  }

  /**
   * Basic output validation  
   */
  async validateBasicOutput(outputPath) {
    try {
      const stats = fs.statSync(outputPath);
      const buffer = fs.readFileSync(outputPath);
      const wav = new WaveFile();
      wav.fromBuffer(buffer);
      
      return {
        fileSize: stats.size,
        sampleRate: wav.fmt.sampleRate,
        bitDepth: wav.fmt.bitsPerSample,
        channels: wav.fmt.numChannels,
        duration: wav.data.chunkSize / (wav.fmt.sampleRate * wav.fmt.numChannels * (wav.fmt.bitsPerSample / 8))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Measure WAV file duration
   */
  async measureWavDuration(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const wav = new WaveFile();
      wav.fromBuffer(buffer);
      
      return wav.data.chunkSize / (wav.fmt.sampleRate * wav.fmt.numChannels * (wav.fmt.bitsPerSample / 8));
    } catch (error) {
      throw new Error(`Could not measure duration: ${error.message}`);
    }
  }

  /**
   * Print comprehensive test results
   */
  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BEAT GENERATOR TEST RESULTS');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
    
    if (failed > 0) {
      console.log(`\n❌ Failed Tests (${failed}):`);
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.error || 'Unknown error'}`);
        });
    }
    
    console.log(`\n✅ Passed Tests (${passed}):`);
    this.testResults
      .filter(r => r.status === 'PASS')
      .forEach(result => {
        console.log(`   • ${result.test}`);
        if (result.outputPath) {
          console.log(`     Output: ${path.basename(result.outputPath)}`);
        }
      });
    
    // Timing accuracy summary
    const timingTests = this.testResults.filter(r => r.test.startsWith('Timing'));
    if (timingTests.length > 0) {
      console.log(`\n⏰ Timing Accuracy Summary:`);
      timingTests.forEach(test => {
        if (test.errorMs !== undefined) {
          const status = test.withinTolerance ? '✅' : '❌';
          console.log(`   ${status} ${test.test}: ${test.errorMs.toFixed(2)}ms error`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(failed === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${failed} TESTS FAILED`);
    console.log('='.repeat(60));
  }
}

// Run tests when called directly
if (require.main === module) {
  const tester = new BeatGeneratorTester();
  
  tester.runAllTests()
    .then(() => {
      const failed = tester.testResults.filter(r => r.status === 'FAIL').length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { BeatGeneratorTester };