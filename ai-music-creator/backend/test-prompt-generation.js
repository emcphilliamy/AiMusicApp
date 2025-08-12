const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎭 Testing Prompt-Based Beat Generation');
console.log('=====================================');
console.log();

async function testPromptGeneration() {
  const generator = new PromptBeatGenerator();
  
  // Sample prompts from different dictionary categories
  const testPrompts = [
    // Texture & Timbre
    "bright energetic guitar",
    "warm cozy piano",
    "dark mysterious bass",
    
    // Emotional & Atmospheric
    "joyful upbeat drums",
    "melancholic nostalgic strings",
    "serene peaceful ambient",
    
    // Genre-Specific
    "trap aggressive 808",
    "house danceable synth",
    "jazz smooth saxophone",
    
    // Complex combinations
    "euphoric trap vocals 140 bpm",
    "chill lo-fi guitar and piano",
    "metal brutal drums and guitar"
  ];
  
  console.log(`🎵 Testing ${testPrompts.length} different prompt styles\n`);
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const filename = `prompt_${i + 1}`;
    
    try {
      console.log(`🎭 [${i + 1}/${testPrompts.length}] Generating: "${prompt}"`);
      
      const result = await generator.generateFromPrompt(prompt, {
        outputPath: './generated',
        filename: filename
      });
      
      if (result) {
        console.log(`✅ Generated: ${result.filename || filename}`);
        console.log(`   📊 BPM: ${result.bpm || 'auto'} | Instrument: ${result.instrument || 'auto'}`);
        console.log(`   🎵 Style: ${result.keyword || 'default'} | Duration: ${result.duration?.toFixed(2) || '?'}s`);
      } else {
        console.log(`⚠️  Generation returned null/undefined`);
      }
      
    } catch (error) {
      console.error(`❌ Error with "${prompt}": ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🎯 Prompt generation testing completed!');
  console.log('Check ./generated/ folder for audio files and metadata');
}

testPromptGeneration().catch(console.error);