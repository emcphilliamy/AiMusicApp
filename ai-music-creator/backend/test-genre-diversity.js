/**
 * Test Genre Diversity - Demonstrates different genres with same instruments should sound different
 * Tests "funky groove" vs "beach vibe like Jack Johnson" to verify distinct outputs
 */

const { generateFromPrompt } = require('./core/promptBeatGenerator');

async function testGenreDiversity() {
  console.log('🎯 Testing Genre Diversity');
  console.log('Goal: Verify different genres create distinct patterns for same instruments');
  console.log('=' .repeat(70));
  
  // Clear previous files
  console.log('🧹 Clearing previous files...');
  
  const testCases = [
    {
      prompt: 'guitar funky groove',
      expectedGenre: 'funk',
      expectedCharacteristics: 'tight syncopated 16th notes, staccato chord stabs'
    },
    {
      prompt: 'guitar beach vibe like Jack Johnson', 
      expectedGenre: 'beach',
      expectedCharacteristics: 'flowing 8th notes, fingerpicked/strummed, gentle swing'
    },
    {
      prompt: 'bass funky groove',
      expectedGenre: 'funk', 
      expectedCharacteristics: 'tight 16th syncopated, ghost notes, strong downbeat'
    },
    {
      prompt: 'bass beach vibe like Jack Johnson',
      expectedGenre: 'beach',
      expectedCharacteristics: 'simple walking quarter notes, relaxed'
    }
  ];
  
  const results = {};
  
  for (const testCase of testCases) {
    console.log(`\n🎵 Testing: "${testCase.prompt}"`);
    console.log(`Expected Genre: ${testCase.expectedGenre}`);
    console.log(`Expected Characteristics: ${testCase.expectedCharacteristics}`);
    console.log('-'.repeat(50));
    
    try {
      const result = await generateFromPrompt(testCase.prompt, {
        outputPath: './generated',
        playMode: 'rhythm' // Force rhythm mode to test genre differences
      });
      
      results[testCase.prompt] = {
        success: true,
        file: result,
        expectedGenre: testCase.expectedGenre
      };
      
      console.log(`✅ Generated: ${result}`);
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results[testCase.prompt] = {
        success: false,
        error: error.message
      };
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Analysis Summary
  console.log('\n📊 Genre Diversity Test Results:');
  console.log('=' .repeat(70));
  
  const funkResults = Object.keys(results).filter(key => key.includes('funky'));
  const beachResults = Object.keys(results).filter(key => key.includes('beach'));
  
  console.log('\n🎸 Funk Genre Results:');
  funkResults.forEach(key => {
    const result = results[key];
    console.log(`  ${key}: ${result.success ? '✅ Generated' : '❌ Failed'}`);
    if (result.file) console.log(`    File: ${result.file.split('/').pop()}`);
  });
  
  console.log('\n🏖️  Beach Genre Results:');
  beachResults.forEach(key => {
    const result = results[key];
    console.log(`  ${key}: ${result.success ? '✅ Generated' : '❌ Failed'}`);
    if (result.file) console.log(`    File: ${result.file.split('/').pop()}`);
  });
  
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🏆 Overall: ${successCount}/${testCases.length} test cases passed`);
  
  console.log('\n🔍 Expected Differences:');
  console.log('   Funk Guitar: Tight staccato chord stabs, syncopated 16th notes');
  console.log('   Beach Guitar: Flowing fingerpicked pattern, gentle strum');
  console.log('   Funk Bass: Aggressive 16th syncopation, ghost notes');  
  console.log('   Beach Bass: Simple walking quarter notes, relaxed');
  console.log('\n📝 Check the generated .md files for detailed pattern analysis!');
}

// Run the test
if (require.main === module) {
  testGenreDiversity().catch(console.error);
}

module.exports = { testGenreDiversity };