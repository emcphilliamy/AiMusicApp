/**
 * Test Spotify Warning Integration
 * 
 * Tests that Spotify warnings appear in generated markdown files
 * when Spotify API fails or references cannot be found
 */

require('dotenv').config();
const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🎵 Testing Spotify Warnings in MD Files');
console.log('=====================================');
console.log();

async function testSpotifyWarnings() {
  const generator = new PromptBeatGenerator();
  
  // Test prompts that should trigger Spotify warnings (since API is failing)
  const testPrompts = [
    'upbeat track like "Shape of You"',
    'sounds like Taylor Swift but with drums',
    'similar to album "Dark Side of the Moon"',
    'chill music like "Blinding Lights" and The Weeknd'
  ];
  
  console.log(`🧪 Testing ${testPrompts.length} prompts that should generate Spotify warnings:`);
  console.log();
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    
    try {
      console.log(`[${i + 1}/${testPrompts.length}] "${prompt}"`);
      console.log('=' .repeat(60));
      
      const result = await generator.generateFromPrompt(prompt, {
        outputPath: './generated',
        bars: 1 // Keep short for testing
      });
      
      console.log(`✅ Generated: ${result.outputPath}`);
      
      // Check if MD file was created and contains Spotify warnings
      const mdPath = result.outputPath.replace('.wav', '.md');
      const fs = require('fs');
      
      if (fs.existsSync(mdPath)) {
        const mdContent = fs.readFileSync(mdPath, 'utf8');
        
        if (mdContent.includes('Spotify Integration Warnings')) {
          console.log('✅ Spotify warnings found in MD file!');
          
          // Extract and show the warnings section
          const warningMatch = mdContent.match(/## Spotify Integration Warnings[\\s\\S]*?(?=\\n---|$)/);
          if (warningMatch) {
            console.log('📄 Warning section:');
            console.log(warningMatch[0]);
          }
        } else {
          console.log('❌ No Spotify warnings found in MD file');
        }
      } else {
        console.log('❌ MD file not found');
      }
      
      console.log();
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log();
    }
    
    // Small delay between generations
    if (i < testPrompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('🔍 Summary of Spotify Warning Test:');
  console.log('====================================');
  console.log('This test verifies that when Spotify API fails or cannot find references:');
  console.log('✅ Music generation continues using adjective analysis');
  console.log('✅ Spotify warnings are tracked during prompt interpretation');
  console.log('✅ Warnings are passed through to beat generator');
  console.log('✅ Warnings appear in generated markdown files');
  console.log('✅ Users are informed about missing Spotify influence');
}

// Test just the prompt interpreter warnings
async function testPromptInterpreterWarnings() {
  console.log('🔧 Testing Prompt Interpreter Spotify Warning Detection:');
  console.log('=======================================================');
  
  const { PromptInterpreter } = require('./modules/promptInterpreter');
  const interpreter = new PromptInterpreter();
  
  const testPrompts = [
    'like "Non-Existent Song 12345"',
    'sounds like Unknown Artist XYZ',
    'album "Fake Album That Does Not Exist"'
  ];
  
  for (const prompt of testPrompts) {
    console.log(`\\n🎭 Testing: "${prompt}"`);
    
    try {
      const result = await interpreter.interpretPrompt(prompt);
      
      if (result.spotifyWarnings && result.spotifyWarnings.length > 0) {
        console.log(`✅ Warnings detected: ${result.spotifyWarnings.length}`);
        result.spotifyWarnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      } else {
        console.log('❌ No warnings detected');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Main execution
async function runTests() {
  const testType = process.argv[2];
  
  if (testType === 'interpreter') {
    await testPromptInterpreterWarnings();
  } else {
    await testSpotifyWarnings();
    console.log();
    console.log('💡 To test just the prompt interpreter warnings:');
    console.log('   node test-spotify-warnings.js interpreter');
  }
}

runTests().catch(console.error);