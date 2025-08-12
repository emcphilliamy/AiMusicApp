/**
 * Prompt-enabled Beat Generator
 * Extends BeatGenerator with natural language prompt interpretation
 */

const { BeatGenerator } = require('./beatGenerator');
const { PromptInterpreter } = require('../modules/promptInterpreter');
const fs = require('fs');
const path = require('path');

class PromptBeatGenerator extends BeatGenerator {
  constructor() {
    super();
    this.promptInterpreter = new PromptInterpreter();
  }

  /**
   * Generate beat from natural language prompt
   * @param {string} prompt - Natural language description of desired music
   * @param {Object} overrides - Optional parameter overrides
   * @returns {Promise<string>} Path to generated WAV file
   */
  async generateFromPrompt(prompt, overrides = {}) {
    console.log(`🎭 Generating beat from prompt: "${prompt}"`);
    
    // Interpret the prompt
    const interpretedParams = await this.promptInterpreter.interpretPrompt(prompt);
    const beatParams = this.promptInterpreter.toBeatGeneratorParams(interpretedParams);
    
    // Generate meaningful filename from prompt and instrument
    const baseName = this.generateFileName(prompt, beatParams.instrument || 'unknown');
    const outputPath = overrides.outputPath || './generated';
    const uniqueName = this.ensureUniqueFileName(baseName, outputPath);
    
    // Apply any overrides
    const finalOptions = {
      ...beatParams,
      ...overrides,
      songName: uniqueName,
      outputPath: outputPath,
      originalPrompt: prompt,
      interpretedParams: interpretedParams,
      spotifyWarnings: interpretedParams.spotifyWarnings || null
    };
    
    console.log(`🎵 Converted to beat parameters:`, finalOptions);
    
    return await this.generateBeat(finalOptions);
  }

  /**
   * Get prompt interpreter for direct access
   */
  getPromptInterpreter() {
    return this.promptInterpreter;
  }

  /**
   * Get available adjectives from lexicon
   */
  getAvailableAdjectives() {
    return this.promptInterpreter.getAvailableAdjectives();
  }

  /**
   * Generate meaningful filename from prompt and instrument
   * @private
   */
  generateFileName(prompt, instrument) {
    // Clean the prompt - remove special chars and limit length
    const cleanPrompt = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 30); // Limit length
    
    // Clean instrument name
    const cleanInstrument = instrument
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    return `${cleanInstrument}_${cleanPrompt}`;
  }

  /**
   * Ensure unique filename by adding number suffix if needed
   * @private
   */
  ensureUniqueFileName(baseName, outputPath) {
    let counter = 1;
    let currentName = baseName;
    
    // Check if base name already exists
    while (this.fileExists(currentName, outputPath)) {
      counter++;
      currentName = `${baseName}_${counter}`;
    }
    
    return currentName;
  }

  /**
   * Check if file exists (both WAV and MD)
   * @private
   */
  fileExists(baseName, outputPath) {
    const wavPath = path.join(outputPath, `${baseName}-MB.wav`);
    const mdPath = path.join(outputPath, `${baseName}-MB.md`);
    
    return fs.existsSync(wavPath) || fs.existsSync(mdPath);
  }
}

// Convenience function
async function generateFromPrompt(prompt, overrides = {}) {
  const generator = new PromptBeatGenerator();
  return await generator.generateFromPrompt(prompt, overrides);
}

module.exports = {
  PromptBeatGenerator,
  generateFromPrompt
};