const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎭 Testing Expanded Music Adjective Dictionary');
console.log('==============================================');
console.log();

async function testExpandedAdjectives() {
  const generator = new PromptBeatGenerator();
  
  console.log('📚 Total adjectives in lexicon:', generator.getAvailableAdjectives().length);
  console.log();
  
  // Test newly added professional descriptors
  const testPrompts = [
    // Texture & Timbre
    "bright crisp guitar",
    "warm rich piano",
    "dark mysterious organ", 
    "smooth silky vocal",
    "rough gritty bass",
    
    // Emotional & Atmospheric  
    "euphoric triumphant brass",
    "melancholic nostalgic strings",
    "haunting ethereal pads",
    "joyful lively drums",
    "serene peaceful flute",
    
    // Genre-Specific
    "trap aggressive bass",
    "dubstep heavy synth",
    "techno mechanical drums",
    "house danceable keys",
    "metal brutal guitar",
    
    // Classical tempo terms
    "brisk lively violin",
    "lazy peaceful ambient",
    "urgent frantic electronic"
  ];
  
  for (const prompt of testPrompts) {
    try {
      console.log(`\n🎭 Testing: "${prompt}"`);
      
      // Just interpret the prompt to see parameters
      const interpreter = generator.getPromptInterpreter();
      const interpretedParams = interpreter.interpretPrompt(prompt);
      
      console.log(`  📊 BPM: ${interpretedParams.bpm?.[0]}-${interpretedParams.bpm?.[1]}`);
      console.log(`  🎵 Scale: ${interpretedParams.scale}`);
      console.log(`  🎶 Mood: ${interpretedParams.mood}`);
      console.log(`  🎹 Instruments: ${interpretedParams.instruments?.slice(0,3).join(', ')}${interpretedParams.instruments?.length > 3 ? '...' : ''}`);
      console.log(`  ⚡ Energy: ${interpretedParams.energy?.toFixed(2)}`);
      if (interpretedParams.effects?.length > 0) {
        console.log(`  🎚️ Effects: ${interpretedParams.effects.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📊 CATEGORY BREAKDOWN:');
  const adjectives = generator.getAvailableAdjectives();
  console.log('====================');
  
  // Count categories
  const categories = {
    'Tempo & Energy': ['upbeat', 'energetic', 'fast', 'slow', 'brisk', 'lively', 'moderate', 'relaxed', 'lazy', 'urgent', 'driving'],
    'Texture & Timbre': ['bright', 'warm', 'dark', 'cool', 'rich', 'thin', 'thick', 'crisp', 'smooth', 'rough'],
    'Emotional': ['joyful', 'melancholic', 'serene', 'haunting', 'euphoric', 'mysterious', 'romantic', 'nostalgic', 'ethereal', 'triumphant'],
    'Genre-Specific': ['trap', 'dubstep', 'techno', 'house', 'trance', 'hiphop', 'reggae', 'country', 'metal', 'gospel'],
    'Atmosphere': ['dreamy', 'chill', 'ambient', 'peaceful', 'gentle', 'soft', 'intense', 'aggressive']
  };
  
  for (const [category, terms] of Object.entries(categories)) {
    const found = terms.filter(term => adjectives.includes(term));
    console.log(`${category}: ${found.length}/${terms.length} (${found.slice(0,5).join(', ')}${found.length > 5 ? '...' : ''})`);
  }
  
  console.log('\n✅ Expanded adjective dictionary testing completed!');
  console.log(`🎯 Total unique descriptors: ${adjectives.length}`);
}

testExpandedAdjectives().catch(console.error);