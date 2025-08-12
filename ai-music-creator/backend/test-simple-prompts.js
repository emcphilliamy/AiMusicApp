const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎭 Testing Simple Prompt Generation with Working Instruments');
console.log('=========================================================');
console.log();

async function testSimplePrompts() {
  const generator = new PromptBeatGenerator();
  
  // Test with instruments that we know work: guitar, keyboard, drums, bass, organ
  const testPrompts = [
    "bright guitar",
    "warm piano",
    "dark organ", 
    "upbeat drums",
    "chill keyboard",
    "aggressive bass",
    "joyful 120 bpm guitar",
    "melancholic piano",
    "energetic organ"
  ];
  
  console.log(`🎵 Testing ${testPrompts.length} simple prompts with working instruments\n`);
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const filename = `simple_${i + 1}`;
    
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
  
  console.log('🎯 Simple prompt testing completed!');
}

testSimplePrompts().catch(console.error);