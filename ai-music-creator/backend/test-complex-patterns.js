/**
 * Test Complex Musical Patterns - Verify enhanced rhythmic complexity and musical expression
 * Tests climbs, falls, strums, complex patterns, and human-like feel
 */

const { generateFromPrompt } = require('./core/promptBeatGenerator');

async function testComplexPattern(prompt, description, expectedFeatures) {
  console.log(`\n🎼 Testing: "${prompt}"`);
  console.log(`📋 Description: ${description}`);
  console.log(`🎯 Expected: ${expectedFeatures.join(', ')}`);
  console.log('-'.repeat(60));
  
  try {
    const result = await generateFromPrompt(prompt, {
      outputPath: './generated',
      playMode: 'rhythm' // Force rhythm mode for complexity
    });
    
    console.log(`✅ Generated: ${result.split('/').pop()}`);
    return { success: true, file: result };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMusicalComplexity() {
  console.log('🎵 Testing Enhanced Musical Complexity and Expression');
  console.log('🎯 Goal: Verify climbs, falls, complex patterns, and human feel');
  console.log('=' .repeat(70));
  
  const testCases = [
    {
      prompt: 'bass funky groove',
      description: 'Funk bass with walking lines, ghost notes, and syncopated fills',
      expectedFeatures: [
        'Walking bass motion',
        'Ghost notes (velocity < 0.3)',
        'Chromatic approaches', 
        'Syncopated rhythms',
        'Dynamic builds',
        '10+ events per bar'
      ]
    },
    {
      prompt: 'guitar beach vibe like Jack Johnson',
      description: 'Beach guitar with fingerpicking, arpeggios, and gentle strums',
      expectedFeatures: [
        'Fingerpicked arpeggios',
        'Mixed up/downstrums',
        'Octave notes',
        'Gentle swing feel',
        'Natural strum timing',
        '8+ events per bar'
      ]
    },
    {
      prompt: 'guitar funky groove',
      description: 'Funk guitar with chicken scratch, muted hits, and complex 16th patterns',
      expectedFeatures: [
        'Staccato chord stabs',
        'Muted scratches',
        'Complex 16th rhythms',
        'Velocity variations',
        'Syncopated patterns',
        '15+ events per bar'
      ]
    },
    {
      prompt: 'keyboard funky groove',
      description: 'Funk keyboard with chord stabs and rhythmic complexity',
      expectedFeatures: [
        'Chord progressions',
        'Rhythmic complexity',
        'Dynamic expression',
        'Syncopated patterns'
      ]
    }
  ];
  
  console.log('🧹 Clearing previous files...\n');
  
  const results = {};
  
  for (const testCase of testCases) {
    const result = await testComplexPattern(
      testCase.prompt, 
      testCase.description, 
      testCase.expectedFeatures
    );
    
    results[testCase.prompt] = result;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Analysis Summary
  console.log('\n📊 Musical Complexity Test Results:');
  console.log('=' .repeat(70));
  
  let successCount = 0;
  
  for (const [prompt, result] of Object.entries(results)) {
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(`\\n${prompt}:`);
    console.log(`  Status: ${status}`);
    
    if (result.success) {
      successCount++;
      console.log(`  File: ${result.file.split('/').pop()}`);
    } else {
      console.log(`  Error: ${result.error}`);
    }
  }
  
  console.log(`\\n🏆 Overall Success: ${successCount}/${testCases.length} patterns generated`);
  
  console.log('\\n🎼 Key Complexity Features to Verify in Generated Files:');
  console.log('   📈 Dynamic builds: Velocity increases across bars');
  console.log('   🎵 Note variety: Multiple MIDI notes per instrument');
  console.log('   ⏱️  Timing complexity: Non-grid timing variations');
  console.log('   🔄 Pattern variation: Different events per bar');
  console.log('   🎹 Human feel: Slight timing and velocity randomization');
  console.log('   🎸 Technique simulation: Hammer-ons, slides, muted notes');
  
  console.log('\\n📝 Check the .md metadata files to analyze:');
  console.log('   • Total Events (should be 8+ for complexity)');
  console.log('   • Velocity Range (should show variety)');
  console.log('   • Timing Distribution (should show non-grid patterns)');
  console.log('   • Note Distribution (should show multiple MIDI notes)');
}

// Run the test
if (require.main === module) {
  testMusicalComplexity().catch(console.error);
}

module.exports = { testMusicalComplexity };