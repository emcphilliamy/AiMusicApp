// Test script for isolated instrument detection
// Demonstrates the keyword detection system

function detectIsolatedInstrumentRequest(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { isIsolated: false };
  }
  
  const lowercasePrompt = prompt.toLowerCase();
  const isolatedKeywords = ['isolated', 'solo', 'only', 'just', 'pure', 'single', 'alone', 'standalone'];
  const instrumentList = ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings', 'synthesizer'];
  
  // Check for isolated keywords
  const hasIsolatedKeyword = isolatedKeywords.some(keyword => lowercasePrompt.includes(keyword));
  
  if (!hasIsolatedKeyword) {
    return { isIsolated: false };
  }
  
  // Find which instrument is requested
  for (const instrument of instrumentList) {
    const instrumentVariations = [
      instrument.replace('_', ' '), // lead_guitar -> lead guitar
      instrument.replace('_', ''),  // lead_guitar -> leadguitar
      instrument.split('_')[0],     // lead_guitar -> lead
      instrument === 'synthesizer' ? 'synth' : instrument,
      instrument === 'lead_guitar' ? 'guitar' : instrument,
      instrument === 'rhythm_guitar' ? 'guitar' : instrument
    ];
    
    for (const variation of instrumentVariations) {
      if (lowercasePrompt.includes(variation)) {
        return {
          isIsolated: true,
          instrument: instrument,
          keywords: isolatedKeywords.filter(k => lowercasePrompt.includes(k)),
          originalPrompt: prompt,
          detectedVariation: variation
        };
      }
    }
  }
  
  return { isIsolated: false };
}

// Test cases to demonstrate keyword detection
const testCases = [
  // Positive cases - should trigger isolated generation
  "isolated drums",
  "solo bass line",
  "only piano",
  "just guitar",
  "pure synthesizer",
  "single drum track",
  "alone with the bass",
  "standalone piano piece",
  "I want isolated lead guitar",
  "solo rhythm guitar please",
  "only strings section",
  "just the synth",
  "isolated lead",
  "solo guitar",
  
  // Negative cases - should NOT trigger isolated generation  
  "reggae song with drums and bass",
  "full band arrangement",
  "complete orchestral piece",
  "guitar and piano duet",
  "drums with bass accompaniment",
  "mix of all instruments",
  "band playing together",
  "ensemble performance",
  
  // Edge cases
  "",
  null,
  undefined,
  "no instruments mentioned",
  "isolated but no instrument",
  "guitar but no isolation keyword"
];

console.log('🧪 Testing Isolated Instrument Detection System\n');
console.log('=' .repeat(60));

testCases.forEach((testCase, index) => {
  const result = detectIsolatedInstrumentRequest(testCase);
  const status = result.isIsolated ? '✅ ISOLATED' : '❌ REGULAR';
  
  console.log(`\nTest ${index + 1}: "${testCase}"`);
  console.log(`Result: ${status}`);
  
  if (result.isIsolated) {
    console.log(`  🎵 Instrument: ${result.instrument}`);
    console.log(`  🔑 Keywords: ${result.keywords.join(', ')}`);
    console.log(`  🎯 Detected: "${result.detectedVariation}"`);
  }
});

console.log('\n' + '=' .repeat(60));
console.log('\n📊 Summary:');
const isolated = testCases.filter(test => detectIsolatedInstrumentRequest(test).isIsolated).length;
const regular = testCases.length - isolated;
console.log(`   ✅ Isolated: ${isolated}`);
console.log(`   ❌ Regular: ${regular}`);
console.log(`   📈 Total: ${testCases.length}`);

console.log('\n🎵 Supported Instruments:');
const instruments = ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'piano', 'strings', 'synthesizer'];
instruments.forEach(instrument => {
  console.log(`   • ${instrument}`);
});

console.log('\n🔑 Supported Keywords:');
const keywords = ['isolated', 'solo', 'only', 'just', 'pure', 'single', 'alone', 'standalone'];
keywords.forEach(keyword => {
  console.log(`   • ${keyword}`);
});

console.log('\n🎯 Detection works for variations like:');
console.log('   • "lead guitar" or "leadguitar" → lead_guitar');
console.log('   • "synth" → synthesizer');
console.log('   • "guitar" → lead_guitar (first match)');
console.log('   • "lead" → lead_guitar');

console.log('\n✅ Isolated instrument detection system ready!');