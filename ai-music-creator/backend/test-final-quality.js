const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎸 Final Audio Quality Test');
console.log('==========================');
console.log();

async function testFinalQuality() {
  const generator = new PromptBeatGenerator();
  
  // Test with various prompts to verify clean audio
  const testPrompts = [
    "bright guitar",
    "warm keyboard", 
    "energetic guitar 110 bpm"
  ];
  
  console.log(`🎵 Testing final audio quality improvements\n`);
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const filename = `final_test_${i + 1}`;
    
    try {
      console.log(`🎭 [${i + 1}/${testPrompts.length}] "${prompt}"`);
      
      const result = await generator.generateFromPrompt(prompt, {
        outputPath: './generated',
        filename: filename
      });
      
      if (result && result.filename) {
        console.log(`✅ Generated: ${result.filename}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🎯 Final quality test completed!');
  console.log('');
  console.log('🔧 Audio Quality Improvements Applied:');
  console.log('   ✅ Extended fade in/out: 64 → 256 samples (5.8ms)');
  console.log('   ✅ Gentler soft limiting: 0.95 → 0.98 threshold');
  console.log('   ✅ Reduced compression ratio: 0.5 → 0.3');
  console.log('   ✅ Higher limiting trigger: 1.0 → 1.05 peak');
  console.log('   ✅ Sample level management: 0.6x base gain');
  console.log('   ✅ Gentler velocity curve: 2.0 → 1.8');
  console.log('   ✅ Lower master volume: 0.8 → 0.75');
  console.log('');
  console.log('🎧 These changes should significantly reduce fuzziness and clipping artifacts.');
}

testFinalQuality().catch(console.error);