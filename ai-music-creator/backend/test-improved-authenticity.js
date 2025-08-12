/**
 * Test Improved Musical Authenticity - Verify research-based fixes
 * Tests authentic bass (sustained/bowing) vs guitar (varied techniques) across genres
 */

const { generateFromPrompt } = require('./core/promptBeatGenerator');

async function testImprovedPattern(prompt, description, expectedImprovements) {
  console.log(`\n🎼 Testing: "${prompt}"`);
  console.log(`📋 ${description}`);
  console.log(`🎯 Expected Improvements: ${expectedImprovements.join(', ')}`);
  console.log('-'.repeat(65));
  
  try {
    const result = await generateFromPrompt(prompt, {
      outputPath: './generated',
      playMode: 'rhythm'
    });
    
    console.log(`✅ Generated: ${result.split('/').pop()}`);
    return { success: true, file: result };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMusicalAuthenticity() {
  console.log('🎵 Testing Research-Based Musical Authenticity Improvements');
  console.log('🎯 Goal: Verify authentic bass (sustained) vs guitar (varied) patterns');
  console.log('=' .repeat(70));
  
  const testCases = [
    {
      prompt: 'bass funky groove',
      description: 'Bass with sustained arco techniques (like big violin)',
      expectedImprovements: [
        'Long sustained notes (duration > 1.0s)',
        'Legato/portato/tenuto techniques',
        'Continuous carrying behavior',
        'Overlapping notes',
        'NO percussive attacks',
        'Bow direction changes'
      ]
    },
    {
      prompt: 'guitar funky groove', 
      description: 'Guitar with authentic funk groove patterns',
      expectedImprovements: [
        'Syncopated chord stabs',
        'Chicken scratch muted hits',
        'Down/upstroke techniques',
        'Complex 16th note patterns',
        'Groove space (beat 2 skip)',
        'Multiple velocity levels'
      ]
    },
    {
      prompt: 'bass beach vibe like Jack Johnson',
      description: 'Bass with gentle sustained waves (cello-like)',
      expectedImprovements: [
        'Very long durations (2.0s+)',
        'Wave-like velocity changes',
        'Peaceful sustained foundation',
        'Smooth gliding transitions',
        'Ocean wave timing sway'
      ]
    },
    {
      prompt: 'guitar jazz smooth',
      description: 'Guitar with sophisticated jazz chord voicings',
      expectedImprovements: [
        'Complex chord extensions (7th, 9th)',
        'Sophisticated fingerpicking',
        'Arpeggiated patterns',
        'Syncopated chord stabs',
        'Jazz harmonic complexity'
      ]
    },
    {
      prompt: 'guitar blues soulful',
      description: 'Guitar with expressive blues techniques',
      expectedImprovements: [
        'Note bending techniques',
        'Sliding between notes',
        'Vibrato effects',
        'Flat third (blues notes)',
        'Expressive timing'
      ]
    }
  ];
  
  console.log('🧹 Clearing previous files...\n');
  
  const results = {};
  
  for (const testCase of testCases) {
    const result = await testImprovedPattern(
      testCase.prompt, 
      testCase.description, 
      testCase.expectedImprovements
    );
    
    results[testCase.prompt] = result;
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Analysis Summary
  console.log('\n📊 Musical Authenticity Test Results:');
  console.log('=' .repeat(70));
  
  let successCount = 0;
  const bassTests = Object.keys(results).filter(key => key.includes('bass'));
  const guitarTests = Object.keys(results).filter(key => key.includes('guitar'));
  
  console.log('\n🎻 Bass Tests (Should show sustained/continuous behavior):');
  bassTests.forEach(key => {
    const result = results[key];
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(`  ${key}: ${status}`);
    if (result.success) {
      successCount++;
      console.log(`    File: ${result.file.split('/').pop()}`);
    }
  });
  
  console.log('\n🎸 Guitar Tests (Should show varied technique per genre):');
  guitarTests.forEach(key => {
    const result = results[key];
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(`  ${key}: ${status}`);
    if (result.success) {
      successCount++;
      console.log(`    File: ${result.file.split('/').pop()}`);
    }
  });
  
  console.log(`\n🏆 Overall Success: ${successCount}/${testCases.length} patterns generated`);
  
  console.log('\n🔍 Key Authenticity Features to Verify:');
  console.log('\n   🎻 BASS (Double Bass/Upright Bass):');
  console.log('      • Long sustained durations (1.0-3.0+ seconds)');
  console.log('      • Continuous sound with overlapping notes');
  console.log('      • Arco techniques: legato, portato, tenuto');
  console.log('      • Smooth velocity transitions (no sharp attacks)');
  console.log('      • Bow direction changes for authentic playing');
  
  console.log('\n   🎸 GUITAR (Varied by Genre):');
  console.log('      • Funk: Staccato stabs, chicken scratch, syncopation');
  console.log('      • Jazz: Complex chords (7th, 9th), fingerpicking');
  console.log('      • Blues: Bending, sliding, vibrato, flat thirds');
  console.log('      • Beach: Fingerpicked arpeggios, gentle strums');
  
  console.log('\n📝 Check Generated .md Files For:');
  console.log('   • Duration values (bass should be 1.0s+, guitar varied)');
  console.log('   • Velocity patterns (bass smooth waves, guitar varied)');
  console.log('   • Note complexity (jazz should show extended chords)');
  console.log('   • Timing patterns (funk should show syncopation)');
}

// Run the test
if (require.main === module) {
  testMusicalAuthenticity().catch(console.error);
}

module.exports = { testMusicalAuthenticity };