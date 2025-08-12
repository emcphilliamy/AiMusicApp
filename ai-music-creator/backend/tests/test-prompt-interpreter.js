const { PromptInterpreter } = require('../modules/promptInterpreter');
const { BeatGenerator } = require('../core/beatGenerator');

console.log('🎭 Prompt Interpreter Test Suite');
console.log('================================');
console.log();

async function testPromptInterpreter() {
  const interpreter = new PromptInterpreter();
  const beatGenerator = new BeatGenerator();
  
  console.log('📚 Available adjectives in lexicon:');
  console.log(interpreter.getAvailableAdjectives().join(', '));
  console.log();
  
  // Test cases from the requirements
  const testPrompts = [
    "upbeat dreamy pop guitar-heavy",
    "stylish jazzy bass with lots of reverb",
    "aggressive fast metal drums",
    "chill ambient keyboard 80 BPM",
    "funky bass-heavy groove in D minor",
    "bright warm acoustic guitar",
    "dark atmospheric synth pads",
    "upbeat, dreamy, stylish pop with lots of guitar",
    "smooth jazz piano ballad",
    "electronic dance music with heavy bass"
  ];
  
  for (const prompt of testPrompts) {
    console.log(`\n🎭 TESTING PROMPT: "${prompt}"`);
    console.log('=' .repeat(50));
    
    try {
      // Interpret the prompt
      const interpretedParams = interpreter.interpretPrompt(prompt);
      
      // Convert to beat generator parameters
      const beatParams = interpreter.toBeatGeneratorParams(interpretedParams);
      
      console.log('\n📊 INTERPRETED PARAMETERS:');
      console.log(`  BPM Range: ${interpretedParams.bpm?.[0]}-${interpretedParams.bpm?.[1]} → Selected: ${beatParams.bpm}`);
      console.log(`  Scale: ${interpretedParams.scale}`);
      console.log(`  Rhythm: ${interpretedParams.rhythm}`);
      console.log(`  Chord Progression: ${interpretedParams.progression?.join(' - ')}`);
      console.log(`  Instruments: ${interpretedParams.instruments?.join(', ')}`);
      console.log(`  Energy Level: ${interpretedParams.energy?.toFixed(2)}`);
      console.log(`  Mood: ${interpretedParams.mood}`);
      if (interpretedParams.effects?.length > 0) {
        console.log(`  Effects: ${interpretedParams.effects.join(', ')}`);
      }
      
      console.log('\n🎵 BEAT GENERATOR PARAMS:');
      console.log(`  BPM: ${beatParams.bpm}`);
      console.log(`  Genre/Keyword: ${beatParams.keyword}`);
      console.log(`  Primary Instrument: ${beatParams.instrument}`);
      console.log(`  Bars: ${beatParams.bars}`);
      
      // Generate a test sample
      const testConfig = {
        ...beatParams,
        songName: `prompt_test_${testPrompts.indexOf(prompt) + 1}`,
        outputPath: './generated',
        bars: 1 // Keep short for testing
      };
      
      console.log('\n🎶 GENERATING SAMPLE...');
      const outputPath = await beatGenerator.generateBeat(testConfig);
      console.log(`✅ Generated: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Error processing prompt: ${error.message}`);
    }
  }
  
  console.log('\n📈 LEXICON EXPANSION TEST');
  console.log('========================');
  
  // Test lexicon expansion with unknown adjectives
  const unknownPrompts = [
    "vibrant energetic dance music",
    "melancholic sad piano ballad", 
    "mysterious dark ambient soundscape"
  ];
  
  for (const prompt of unknownPrompts) {
    console.log(`\n🔍 Testing unknown adjectives: "${prompt}"`);
    const before = Object.keys(interpreter.getLexicon()).length;
    interpreter.interpretPrompt(prompt);
    const after = Object.keys(interpreter.getLexicon()).length;
    console.log(`📚 Lexicon expanded: ${before} → ${after} adjectives`);
  }
  
  console.log('\n✅ Prompt Interpreter tests completed!');
  console.log('\n📚 Final lexicon size:', Object.keys(interpreter.getLexicon()).length, 'adjectives');
}

// Run the tests
testPromptInterpreter().catch(console.error);