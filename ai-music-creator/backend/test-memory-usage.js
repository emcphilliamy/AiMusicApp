/**
 * Test Memory Usage During Audio Generation
 * 
 * Tests if the memory leak is fixed and monitors memory usage
 */

const { PromptBeatGenerator } = require('./promptBeatGenerator');

console.log('🧠 Testing Memory Usage During Audio Generation');
console.log('===============================================');
console.log();

function formatMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external
  };
}

function logMemoryUsage(label) {
  const usage = getMemoryUsage();
  console.log(`📊 ${label}:`);
  console.log(`   Heap Used: ${formatMemory(usage.heapUsed)}`);
  console.log(`   Heap Total: ${formatMemory(usage.heapTotal)}`);
  console.log(`   RSS: ${formatMemory(usage.rss)}`);
  console.log(`   External: ${formatMemory(usage.external)}`);
}

async function testMemoryUsage() {
  const generator = new PromptBeatGenerator();
  
  // Baseline memory
  logMemoryUsage('Baseline (after initialization)');
  console.log();
  
  const initialMemory = getMemoryUsage();
  
  // Test prompts that use different instruments
  const testPrompts = [
    'upbeat drums',
    'chill guitar',  // This was the problematic one
    'warm keyboard',
    'funky bass',
    'bright guitar',  // Another guitar test
    'energetic drums',
    'mellow organ',
    'jazzy guitar'    // Third guitar test
  ];
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    
    try {
      console.log(`[${i + 1}/${testPrompts.length}] Generating: "${prompt}"`);
      
      const beforeGeneration = getMemoryUsage();
      
      await generator.generateFromPrompt(prompt, {
        bars: 1,
        outputPath: './generated'
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterGeneration = getMemoryUsage();
      
      const heapIncrease = afterGeneration.heapUsed - beforeGeneration.heapUsed;
      const totalIncrease = afterGeneration.heapUsed - initialMemory.heapUsed;
      
      console.log(`   Heap increase this generation: ${formatMemory(heapIncrease)}`);
      console.log(`   Total heap increase: ${formatMemory(totalIncrease)}`);
      
      if (heapIncrease > 50 * 1024 * 1024) { // 50MB threshold
        console.log(`   ⚠️  WARNING: Large memory increase (${formatMemory(heapIncrease)})`);
      }
      
      if (totalIncrease > 500 * 1024 * 1024) { // 500MB threshold
        console.log(`   🚨 CRITICAL: Total memory usage very high (${formatMemory(totalIncrease)})`);
        break;
      }
      
      console.log();
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log();
    }
  }
  
  logMemoryUsage('Final memory usage');
  
  const finalIncrease = getMemoryUsage().heapUsed - initialMemory.heapUsed;
  console.log();
  console.log(`📈 Total memory increase: ${formatMemory(finalIncrease)}`);
  
  if (finalIncrease < 100 * 1024 * 1024) { // 100MB threshold
    console.log('✅ Memory usage looks healthy');
  } else if (finalIncrease < 500 * 1024 * 1024) { // 500MB threshold
    console.log('⚠️  Memory usage is elevated but manageable');
  } else {
    console.log('🚨 Memory usage is concerning - possible leak');
  }
}

async function runMemoryTest() {
  // Enable garbage collection for more accurate testing
  if (global.gc) {
    console.log('🗑️  Garbage collection enabled for testing');
  } else {
    console.log('💡 Run with --expose-gc for more accurate memory testing');
  }
  console.log();
  
  await testMemoryUsage();
}

runMemoryTest().catch(console.error);