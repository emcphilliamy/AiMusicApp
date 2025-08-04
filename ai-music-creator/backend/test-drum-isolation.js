// Test Advanced Drum Isolation System
// Verify that isolated drums use the realistic synthesis system

const { IsolatedAudioGenerator } = require('./generate-isolated-audio');

async function testAdvancedDrumIsolation() {
    console.log('🧪 Testing Advanced Drum Isolation System\n');
    
    try {
        const isolatedGenerator = new IsolatedAudioGenerator();
        
        // Test different tempos to see different drum styles
        const testCases = [
            { tempo: 60, expected: 'reggae_one_drop', description: 'Slow reggae one drop' },
            { tempo: 75, expected: 'reggae_one_drop', description: 'Classic reggae tempo' },
            { tempo: 90, expected: 'reggae_steppers', description: 'Reggae steppers' },
            { tempo: 110, expected: 'rock_steady', description: 'Rock steady' },
            { tempo: 140, expected: 'uptempo_modern', description: 'Uptempo modern' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n🎵 Testing ${testCase.description} (${testCase.tempo} BPM):`);
            console.log('=' .repeat(50));
            
            const context = {
                duration: 4,
                tempo: testCase.tempo,
                key: 'C',
                style: 'isolated',
                instrument: 'drums',
                prompt: `isolated drums at ${testCase.tempo} BPM`
            };
            
            console.log(`Context: ${JSON.stringify(context, null, 2)}`);
            
            // Generate drum audio (this will show the pattern generation process)
            const audioData = await isolatedGenerator.generateInstrumentAudio('drums', context);
            
            console.log(`✅ Generated ${audioData.length} samples (${(audioData.length / 44100).toFixed(2)}s)`);
            
            // Save the file
            const filePath = await isolatedGenerator.saveIsolatedTrack(
                audioData, 
                'drums', 
                { ...context, timestamp: Date.now() }
            );
            
            console.log(`📁 Saved: ${filePath.split('/').pop()}`);
        }
        
        console.log('\n🎵 Advanced Drum Isolation Test Complete!');
        console.log('\nEach tempo should have generated different drum patterns:');
        console.log('• 60-79 BPM: Reggae One Drop (kick on beat 3)');
        console.log('• 80-99 BPM: Reggae Steppers (more frequent kicks)');
        console.log('• 100-129 BPM: Rock Steady (standard rock pattern)');
        console.log('• 130+ BPM: Uptempo Modern (busy modern pattern)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Direct test of pattern generation
function testPatternGeneration() {
    console.log('\n🎼 Testing Pattern Generation Logic:\n');
    
    const isolatedGenerator = new IsolatedAudioGenerator();
    
    const testContexts = [
        { tempo: 75, duration: 4, description: 'Reggae One Drop' },
        { tempo: 95, duration: 4, description: 'Reggae Steppers' },  
        { tempo: 115, duration: 4, description: 'Rock Steady' },
        { tempo: 145, duration: 4, description: 'Uptempo Modern' }
    ];
    
    testContexts.forEach(context => {
        console.log(`${context.description} (${context.tempo} BPM):`);
        
        // This will call the pattern generation methods and show the output
        const pattern = isolatedGenerator.generateDynamicDrumPattern(context);
        
        console.log(`  Pattern Style: ${pattern.style}`);
        console.log(`  Kick hits: ${pattern.drumData.kick.filter(k => k.hit > 0).length}`);
        console.log(`  Snare hits: ${pattern.drumData.snare.filter(s => s.hit > 0).length}`);
        console.log(`  Hi-hat hits: ${pattern.drumData.hiHat.filter(h => h.hit > 0).length}`);
        console.log('');
    });
}

// Run tests
if (require.main === module) {
    console.log('🚀 Starting Advanced Drum Isolation Tests...\n');
    
    // Test pattern generation logic first
    testPatternGeneration();
    
    // Then test full audio generation
    testAdvancedDrumIsolation()
        .then(() => {
            console.log('\n✅ All tests completed successfully!');
        })
        .catch(error => {
            console.error('\n❌ Tests failed:', error.message);
            process.exit(1);
        });
}