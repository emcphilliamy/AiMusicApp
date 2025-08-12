/**
 * Test Pattern Modes - Demonstrates different playing modes for melodic instruments
 * Tests chord, strum, rhythm, and mixed patterns
 */

const { generateFromPrompt } = require('./core/promptBeatGenerator');

async function testPlayMode(instrument, prompt, playMode) {
  console.log(`\n🎼 Testing ${instrument} in ${playMode} mode: "${prompt}"`);
  console.log('=' .repeat(70));
  
  try {
    const result = await generateFromPrompt(`${instrument} ${prompt}`, {
      outputPath: './generated',
      playMode: playMode
    });
    
    console.log(`✅ Success! Generated: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ Error generating ${instrument} in ${playMode} mode:`, error.message);
    return null;
  }
}

async function testAllPatternModes() {
  const prompt = 'funky groove';
  const instruments = ['guitar', 'keyboard', 'bass'];
  const playModes = ['chord', 'strum', 'rhythm', 'mixed'];
  
  console.log('🎵 Testing All Pattern Modes');
  console.log('🎪 Style: Funky Groove');  
  console.log('🎯 Modes: chord (simultaneous), strum (sequential), rhythm (drum-like), mixed (combination)');
  console.log('=' .repeat(70));
  
  const results = {};
  
  for (const instrument of instruments) {
    results[instrument] = {};
    console.log(`\n🎸 Testing ${instrument.toUpperCase()}:`);
    
    for (const playMode of playModes) {
      results[instrument][playMode] = await testPlayMode(instrument, prompt, playMode);
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Summary
  console.log('\n🎼 Pattern Mode Generation Summary:');
  console.log('=' .repeat(70));
  
  for (const [instrument, modes] of Object.entries(results)) {
    console.log(`\n${instrument.toUpperCase()}:`);
    for (const [mode, result] of Object.entries(modes)) {
      const status = result ? '✅ Success' : '❌ Failed';
      console.log(`  ${mode.padEnd(8)}: ${status}${result ? ` - ${result.split('/').pop()}` : ''}`);
    }
  }
  
  const totalTests = instruments.length * playModes.length;
  const successCount = Object.values(results).flatMap(modes => Object.values(modes)).filter(Boolean).length;
  console.log(`\n🏆 Overall: ${successCount}/${totalTests} pattern modes generated successfully`);
  
  console.log('\n🎯 Pattern Mode Descriptions:');
  console.log('   chord  : All chord notes play simultaneously');
  console.log('   strum  : Chord notes play in quick sequence (like guitar strum)'); 
  console.log('   rhythm : Complex drum-like patterns with root/third/fifth variations');
  console.log('   mixed  : Combines different modes across bars');
}

// Run the test
if (require.main === module) {
  testAllPatternModes().catch(console.error);
}

module.exports = { testAllPatternModes, testPlayMode };