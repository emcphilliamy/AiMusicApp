const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎸 Testing Audio Quality with Improved Settings');
console.log('=============================================');
console.log();

async function testAudioQuality() {
  const generator = new PromptBeatGenerator();
  
  // Test with clean, simple prompts to hear quality difference
  const testPrompts = [
    "bright clean guitar",
    "warm smooth piano", 
    "crisp clear guitar 90 bpm",
  ];
  
  console.log(`🎵 Testing ${testPrompts.length} prompts with improved audio processing\n`);
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const filename = `quality_test_${i + 1}`;
    
    try {
      console.log(`🎭 [${i + 1}/${testPrompts.length}] "${prompt}"`);
      
      const result = await generator.generateFromPrompt(prompt, {
        outputPath: './generated',
        filename: filename
      });
      
      if (result && result.filename) {
        console.log(`✅ Generated: ${result.filename}`);
        console.log(`   📊 ${result.bpm}bpm | ${result.instrument} | ${result.duration?.toFixed(1)}s`);
      } else {
        console.log(`⚠️  No audio generated`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🎯 Audio quality testing completed!');
  console.log('🎧 Check generated files for improved audio quality');
  console.log('🔧 Changes made:');
  console.log('   - Increased fade in/out from 64 to 256 samples (1.45ms → 5.8ms)');
  console.log('   - Raised soft limiter threshold from 0.95 to 0.98');
  console.log('   - Reduced compression ratio from 0.5 to 0.3');
  console.log('   - Only apply limiting when peak > 1.05 (was 1.0)');
}

testAudioQuality().catch(console.error);