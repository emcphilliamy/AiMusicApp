/**
 * Test Beach Vibe Generation
 * Tests drums, guitar, bass, and piano for "beach vibe like Jack Johnson"
 */

const { generateFromPrompt } = require('./core/promptBeatGenerator');

async function testInstrument(instrument, prompt) {
  console.log(`\n🎵 Testing ${instrument} for: "${prompt}"`);
  console.log('=' .repeat(60));
  
  try {
    const result = await generateFromPrompt(`${instrument} ${prompt}`, {
      outputPath: './generated'
    });
    
    console.log(`✅ Success! Generated: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ Error generating ${instrument}:`, error.message);
    return null;
  }
}

async function testBeachVibe() {
  const prompt = 'beach vibe like Jack Johnson';
  const instruments = ['drums', 'guitar', 'bass', 'piano'];
  
  console.log('🏖️  Testing Beach Vibe Generation');
  console.log('🎸 Artist Reference: Jack Johnson');
  console.log('🌊 Style: Beach/Acoustic/Chill');
  console.log('=' .repeat(60));
  
  const results = {};
  
  for (const instrument of instruments) {
    results[instrument] = await testInstrument(instrument, prompt);
    
    // Add a small delay between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n🎼 Generation Summary:');
  console.log('=' .repeat(60));
  
  for (const [instrument, result] of Object.entries(results)) {
    const status = result ? '✅ Success' : '❌ Failed';
    console.log(`${instrument.padEnd(10)}: ${status}${result ? ` - ${result}` : ''}`);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🏆 Overall: ${successCount}/${instruments.length} instruments generated successfully`);
}

// Run the test
if (require.main === module) {
  testBeachVibe().catch(console.error);
}

module.exports = { testBeachVibe, testInstrument };