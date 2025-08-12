const { PromptBeatGenerator, generateFromPrompt } = require('./promptBeatGenerator');

console.log('🎭 Simple Prompt Beat Generator Test');
console.log('===================================');
console.log();

async function testSimplePrompts() {
  
  // Test the convenience function
  console.log('🎵 Testing convenience function...');
  try {
    const result1 = await generateFromPrompt(
      "upbeat pop guitar", 
      { songName: "test_upbeat_pop", outputPath: "./generated" }
    );
    console.log(`✅ Generated: ${result1}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n🎵 Testing class instance...');
  const generator = new PromptBeatGenerator();
  
  // Show available adjectives
  console.log('📚 Available adjectives:');
  console.log(generator.getAvailableAdjectives().join(', '));
  console.log();
  
  // Test a few simple prompts
  const testPrompts = [
    "chill jazz piano",
    "fast electronic drums", 
    "dreamy ambient keyboard"
  ];
  
  for (const prompt of testPrompts) {
    try {
      console.log(`\n🎭 Testing: "${prompt}"`);
      const result = await generator.generateFromPrompt(prompt, {
        songName: `test_${testPrompts.indexOf(prompt) + 1}`,
        outputPath: "./generated"
      });
      console.log(`✅ Generated: ${result}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Simple prompt tests completed!');
}

testSimplePrompts().catch(console.error);