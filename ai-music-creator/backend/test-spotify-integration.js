/**
 * Test Spotify Integration with Prompt Interpreter
 * 
 * This test demonstrates how the prompt interpreter now analyzes
 * songs, artists, and albums mentioned in prompts using Spotify API
 */

require('dotenv').config();
const { PromptInterpreter } = require('./modules/promptInterpreter');

console.log('🎵 Testing Spotify-Enhanced Prompt Interpreter');
console.log('=============================================');
console.log();

async function testSpotifyIntegration() {
  const interpreter = new PromptInterpreter();
  
  // Check if Spotify credentials are configured
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.log('⚠️  Spotify API credentials not found in .env file');
    console.log('');
    console.log('To test Spotify integration:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Get Spotify credentials from https://developer.spotify.com/dashboard');
    console.log('3. Add your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env');
    console.log('4. Run this test again');
    return;
  }
  
  // Test prompts with Spotify references
  const testPrompts = [
    // Song references
    'upbeat track like "Shape of You"',
    'create something similar to "Bohemian Rhapsody"',
    'sounds like "Blinding Lights" but more chill',
    
    // Artist references  
    'make music like Taylor Swift',
    'create something in the style of Daft Punk',
    'sounds like The Beatles but modern',
    
    // Album references
    'inspired by album "Dark Side of the Moon"',
    'something like album "Thriller"',
    
    // Mixed references
    'energetic drums like The Weeknd with guitar',
    'chill piano ballad similar to "Someone Like You" by Adele'
  ];
  
  console.log(`🎭 Testing ${testPrompts.length} prompts with Spotify integration:`);
  console.log();
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    
    try {
      console.log(`[${i + 1}/${testPrompts.length}] "${prompt}"`);
      console.log('=' .repeat(60));
      
      const startTime = Date.now();
      const result = await interpreter.interpretPrompt(prompt);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Analysis completed in ${duration}ms`);
      console.log();
      console.log('📊 RESULTS:');
      console.log(`  BPM: ${result.bpm?.[0]}-${result.bpm?.[1]} (${typeof result.bpm})`);
      console.log(`  Scale: ${result.scale}`);
      console.log(`  Energy: ${result.energy?.toFixed(2) || 'N/A'}`);
      console.log(`  Mood: ${result.mood}`);
      console.log(`  Instruments: ${result.instruments?.join(', ') || 'auto'}`);
      
      // Show Spotify influence if detected
      if (result.spotifyInfluence) {
        console.log(`  🎵 Spotify Influence: ${result.source || 'Yes'}`);
        if (result.danceability) console.log(`  Danceability: ${result.danceability.toFixed(2)}`);
        if (result.valence) console.log(`  Valence: ${result.valence.toFixed(2)}`);
        if (result.acousticness) console.log(`  Acousticness: ${result.acousticness.toFixed(2)}`);
      }
      
      console.log();
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log();
    }
    
    // Small delay to be nice to Spotify API
    if (i < testPrompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('✅ Spotify integration test completed!');
  console.log();
  console.log('📈 Features demonstrated:');
  console.log('• Song analysis from quoted track names');
  console.log('• Artist influence from top tracks (weighted by popularity)');
  console.log('• Album analysis from representative tracks');
  console.log('• Quality/Vibe data integration (energy, danceability, valence, etc.)');
  console.log('• Intelligent blending with existing adjective analysis');
  console.log('• Fallback to original analysis if Spotify lookup fails');
}

// Test individual components
async function testSpotifyComponents() {
  console.log('🔧 Testing individual Spotify components:');
  console.log('========================================');
  
  const interpreter = new PromptInterpreter();
  
  try {
    // Test song analysis
    console.log('1. Testing song analysis...');
    const songResult = await interpreter.spotify.analyzeSong('Shape of You', 'Ed Sheeran');
    if (songResult) {
      console.log(`   ✅ Found: BPM ${songResult.tempo}, Energy ${songResult.energy.toFixed(2)}`);
    } else {
      console.log('   ❌ Song not found');
    }
    
    // Test artist analysis
    console.log('2. Testing artist analysis...');
    const artistResult = await interpreter.spotify.analyzeArtist('Taylor Swift', 3);
    if (artistResult) {
      console.log(`   ✅ Found ${artistResult.tracks.length} tracks for ${artistResult.artistName}`);
      artistResult.tracks.forEach(track => {
        console.log(`      "${track.trackName}" (weight: ${track.weight.toFixed(2)})`);
      });
    } else {
      console.log('   ❌ Artist not found');
    }
    
  } catch (error) {
    console.log(`❌ Component test failed: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  const testType = process.argv[2];
  
  if (testType === 'components') {
    await testSpotifyComponents();
  } else {
    await testSpotifyIntegration();
  }
}

runTests().catch(console.error);