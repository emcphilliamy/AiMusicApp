const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('📁 Testing New Naming System and Enhanced Metadata');
console.log('================================================');
console.log();

async function testNamingSystem() {
  const generator = new PromptBeatGenerator();
  
  // Test various prompts including duplicates to check numbering
  const testPrompts = [
    "bright guitar",
    "warm keyboard", 
    "bright guitar", // Duplicate - should get _2
    "energetic drums 120 bpm",
    "bright guitar", // Another duplicate - should get _3
    "melancholic piano"
  ];
  
  console.log(`🎵 Testing naming system with ${testPrompts.length} prompts (including duplicates)\n`);
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    
    try {
      console.log(`🎭 [${i + 1}/${testPrompts.length}] "${prompt}"`);
      
      const result = await generator.generateFromPrompt(prompt, {
        outputPath: './generated'
      });
      
      if (result && result.filename) {
        console.log(`✅ Generated: ${result.filename}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🎯 Naming system test completed!');
  console.log('');
  console.log('📋 Expected naming format:');
  console.log('   - Format: {instrument}_{cleaned_prompt}[-MB].{wav|md}');
  console.log('   - Duplicates: {instrument}_{cleaned_prompt}_2[-MB].{wav|md}');
  console.log('   - Metadata: Includes prompt header and content description');
  console.log('');
  console.log('📁 Check generated/ folder for:');
  console.log('   - guitar_bright_guitar-MB.wav/md');
  console.log('   - guitar_bright_guitar_2-MB.wav/md (duplicate)');
  console.log('   - keyboard_warm_keyboard-MB.wav/md');
  console.log('   - etc.');
}

testNamingSystem().catch(console.error);