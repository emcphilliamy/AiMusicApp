/**
 * Prompt Interpreter - Converts natural language music descriptions to generation parameters
 * 
 * Features:
 * - Music Adjective-to-Parameter Dictionary loaded from external JSON data file
 * - Semantic similarity for unknown adjectives  
 * - Parameter blending for multiple adjectives
 * - Instrument extraction and focus
 * - Chord progression and scale selection
 * - BPM range calculation
 * - Spotify integration for song/artist/album analysis
 */

const fs = require('fs');
const path = require('path');
const { SpotifyIntegration } = require('./spotifyIntegration');

class PromptInterpreter {
  constructor() {
    // Load Music Adjective Dictionary from external JSON file
    this.loadAdjectiveDictionary();
    
    // Initialize Spotify integration
    this.spotify = new SpotifyIntegration();
    
    // Instrument synonyms for extraction
    this.instrumentSynonyms = {
      'guitar': ['guitar', 'gtr', 'acoustic', 'electric'],
      'keyboard': ['keyboard', 'keys', 'piano', 'synth', 'synthesizer'],
      'drums': ['drums', 'percussion', 'beats', 'rhythm'],
      'bass': ['bass', 'bassline', 'low-end'],
      'string': ['strings', 'orchestra', 'violin', 'cello'],
      'brass': ['brass', 'trumpet', 'horn', 'saxophone'],
      'vocal': ['vocal', 'voice', 'singing', 'choir'],
      'flute': ['flute', 'woodwind'],
      'organ': ['organ', 'hammond'],
      'reed': ['reed', 'clarinet', 'oboe'],
      'synth_lead': ['synth', 'lead', 'synthesizer']
    };
    
    // Scale relationships for blending
    this.scaleCompatibility = {
      'major': ['ionian', 'lydian', 'mixolydian'],
      'minor': ['aeolian', 'dorian', 'phrygian'],
      'blues': ['mixolydian', 'dorian'],
      'lydian': ['major', 'ionian'],
      'mixolydian': ['major', 'blues'],
      'dorian': ['minor', 'blues'],
      'aeolian': ['minor'],
      'phrygian': ['minor']
    };
  }
  
  /**
   * Load adjective dictionary from external JSON data file
   */
  loadAdjectiveDictionary() {
    try {
      const dictionaryPath = path.join(__dirname, '..', 'data', 'musicAdjectiveDictionary.json');
      const dictionaryData = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
      
      // Flatten all categories into a single lexicon
      this.adjectiveLexicon = {};
      
      // Merge all categories
      Object.values(dictionaryData).forEach(category => {
        Object.assign(this.adjectiveLexicon, category);
      });
      
      console.log(`📚 Loaded ${Object.keys(this.adjectiveLexicon).length} adjectives from dictionary`);
      
    } catch (error) {
      console.error('⚠️ Failed to load music adjective dictionary:', error.message);
      console.log('Using minimal fallback dictionary');
      
      // Minimal fallback dictionary
      this.adjectiveLexicon = {
        'upbeat': {
          bpm: [120, 140],
          scale: 'major',
          rhythm: 'straight',
          progression: ['I', 'V', 'vi', 'IV'],
          instruments: ['drums', 'bass', 'synth'],
          energy: 0.8,
          mood: 'positive'
        },
        'chill': {
          bpm: [70, 95],
          scale: 'major',
          rhythm: 'relaxed',
          progression: ['I', 'V', 'vi', 'IV'],
          instruments: ['guitar', 'keyboard', 'bass'],
          energy: 0.4,
          mood: 'relaxed'
        }
      };
    }
  }
  
  /**
   * Main entry point - interpret natural language prompt
   */
  async interpretPrompt(prompt) {
    console.log(`🎭 Interpreting prompt: "${prompt}"`);
    
    const tokens = this.tokenizePrompt(prompt);
    const adjectives = this.extractAdjectives(tokens);
    const instruments = this.extractInstruments(tokens);
    const specificParams = this.extractSpecificParams(tokens);
    
    console.log(`📝 Found adjectives: ${adjectives.join(', ')}`);
    console.log(`🎹 Found instruments: ${instruments.join(', ')}`);
    
    // Extract Spotify references (songs, artists, albums)
    const { spotifyParams, spotifyWarnings } = await this.extractSpotifyReferences(prompt, tokens);
    
    // Get parameters for each adjective
    const adjectiveParams = adjectives.map(adj => this.getAdjectiveParams(adj));
    
    // Add Spotify-derived parameters if any found
    if (spotifyParams.length > 0) {
      console.log(`🎵 Found ${spotifyParams.length} Spotify reference(s)`);
      adjectiveParams.push(...spotifyParams);
    }
    
    // Blend parameters from multiple adjectives and Spotify data
    const blendedParams = this.blendParameters(adjectiveParams);
    
    // Override with specific parameters
    const finalParams = this.mergeSpecificParams(blendedParams, specificParams);
    
    // Use detected instruments only (prioritize over default/adjective instruments)
    if (instruments.length > 0) {
      finalParams.instruments = instruments;
    }
    
    // Expand unknown adjectives to lexicon for future use
    this.expandLexicon(adjectives, adjectiveParams);
    
    // Add Spotify warnings to final parameters
    if (spotifyWarnings.length > 0) {
      finalParams.spotifyWarnings = spotifyWarnings;
      console.log(`⚠️ Spotify warnings: ${spotifyWarnings.join(', ')}`);
    }
    
    console.log(`🎵 Generated parameters:`, finalParams);
    return finalParams;
  }
  
  /**
   * Tokenize and clean prompt
   */
  tokenizePrompt(prompt) {
    return prompt
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }
  
  /**
   * Extract adjectives from tokens
   */
  extractAdjectives(tokens) {
    const adjectives = [];
    
    // Known adjectives from lexicon
    for (const token of tokens) {
      if (this.adjectiveLexicon[token]) {
        adjectives.push(token);
      }
    }
    
    // Music-related adjectives not in lexicon (to be processed via similarity)
    const musicAdjectives = [
      'dark', 'bright', 'warm', 'cold', 'heavy', 'light', 'smooth', 'rough',
      'melodic', 'harmonic', 'rhythmic', 'percussive', 'atmospheric', 'driving',
      'floating', 'pulsing', 'flowing', 'choppy', 'crisp', 'muddy', 'clear',
      'rich', 'thin', 'full', 'empty', 'complex', 'simple', 'layered',
      'minimal', 'maximal', 'organic', 'synthetic', 'acoustic', 'electric'
    ];
    
    for (const token of tokens) {
      if (musicAdjectives.includes(token) && !adjectives.includes(token)) {
        adjectives.push(token);
      }
    }
    
    return adjectives;
  }
  
  /**
   * Extract instrument names from tokens
   */
  extractInstruments(tokens) {
    const instruments = [];
    
    for (const [instrument, synonyms] of Object.entries(this.instrumentSynonyms)) {
      for (const token of tokens) {
        if (synonyms.includes(token) && !instruments.includes(instrument)) {
          instruments.push(instrument);
        }
      }
    }
    
    return instruments;
  }
  
  /**
   * Extract specific parameters (BPM, key, etc.)
   */
  extractSpecificParams(tokens) {
    const params = {};
    
    // Extract BPM
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (/^\d+$/.test(token)) {
        const bpm = parseInt(token);
        if (bpm >= 60 && bpm <= 200) {
          params.bpm = [bpm - 5, bpm + 5]; // Small range around specified BPM
        }
      }
      if (token === 'bpm' && i > 0 && /^\d+$/.test(tokens[i-1])) {
        const bpm = parseInt(tokens[i-1]);
        params.bpm = [bpm - 5, bpm + 5];
      }
    }
    
    // Extract keys
    const keys = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
    const modes = ['major', 'minor', 'blues', 'dorian', 'mixolydian', 'lydian'];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (keys.includes(token)) {
        params.key = token.toUpperCase();
        // Check for mode after key
        if (i + 1 < tokens.length && modes.includes(tokens[i + 1])) {
          params.scale = tokens[i + 1];
        }
      } else if (modes.includes(token)) {
        params.scale = token;
      }
    }
    
    return params;
  }
  
  /**
   * Get parameters for a single adjective (with similarity fallback)
   */
  getAdjectiveParams(adjective) {
    // Direct match
    if (this.adjectiveLexicon[adjective]) {
      return { ...this.adjectiveLexicon[adjective], source: adjective };
    }
    
    // Semantic similarity fallback
    const similarAdjective = this.findSimilarAdjective(adjective);
    if (similarAdjective) {
      console.log(`🔍 Using similarity: "${adjective}" → "${similarAdjective}"`);
      const params = { ...this.adjectiveLexicon[similarAdjective], source: adjective };
      // Slight modification to distinguish from exact match
      if (params.energy) params.energy += (Math.random() - 0.5) * 0.1;
      return params;
    }
    
    // Default fallback
    console.log(`⚠️  Unknown adjective "${adjective}", using default`);
    return {
      bpm: [100, 120],
      scale: 'major',
      rhythm: 'straight',
      progression: ['I', 'V', 'vi', 'IV'],
      instruments: ['keyboard', 'guitar'],
      energy: 0.5,
      mood: 'neutral',
      source: adjective
    };
  }
  
  /**
   * Find similar adjective using simple semantic rules
   */
  findSimilarAdjective(adjective) {
    // Semantic mapping rules
    const semanticGroups = {
      // Energy synonyms
      'upbeat': ['energetic', 'lively', 'vibrant', 'dynamic', 'active'],
      'chill': ['relaxed', 'mellow', 'laid-back', 'easy', 'smooth'],
      'aggressive': ['intense', 'powerful', 'hard', 'heavy', 'strong'],
      'dreamy': ['ethereal', 'floating', 'atmospheric', 'ambient', 'spacey'],
      'funky': ['groovy', 'rhythmic', 'syncopated', 'bouncy'],
      'jazzy': ['sophisticated', 'complex', 'improvisational', 'swing'],
      
      // Mood synonyms  
      'dark': ['minor', 'moody', 'mysterious', 'somber'],
      'bright': ['major', 'happy', 'cheerful', 'sunny'],
      'warm': ['cozy', 'comfortable', 'intimate', 'organic'],
      'cool': ['clinical', 'sterile', 'digital', 'synthetic']
    };
    
    for (const [baseAdjective, synonyms] of Object.entries(semanticGroups)) {
      if (synonyms.includes(adjective)) {
        return baseAdjective;
      }
    }
    
    return null;
  }
  
  /**
   * Blend parameters from multiple adjectives
   */
  blendParameters(paramsList) {
    if (paramsList.length === 0) {
      return this.getDefaultParams();
    }
    
    if (paramsList.length === 1) {
      return paramsList[0];
    }
    
    const blended = {
      instruments: [],
      effects: [],
      progressions: []
    };
    
    // Blend BPM (weighted average)
    const bpmRanges = paramsList.filter(p => p.bpm);
    if (bpmRanges.length > 0) {
      const weights = bpmRanges.map(p => p.energy || 0.5);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      
      let minBpm = 0, maxBpm = 0;
      bpmRanges.forEach((p, i) => {
        const weight = weights[i] / totalWeight;
        minBpm += p.bpm[0] * weight;
        maxBpm += p.bpm[1] * weight;
      });
      
      blended.bpm = [Math.round(minBpm), Math.round(maxBpm)];
    }
    
    // Blend energy (average)
    const energies = paramsList.filter(p => p.energy !== undefined).map(p => p.energy);
    if (energies.length > 0) {
      blended.energy = energies.reduce((a, b) => a + b, 0) / energies.length;
    }
    
    // Select dominant scale
    const scales = paramsList.filter(p => p.scale).map(p => p.scale);
    if (scales.length > 0) {
      blended.scale = this.selectDominantScale(scales);
    }
    
    // Merge instruments (union)
    paramsList.forEach(p => {
      if (p.instruments) {
        blended.instruments.push(...p.instruments);
      }
      if (p.effects) {
        blended.effects.push(...p.effects);
      }
    });
    
    blended.instruments = [...new Set(blended.instruments)];
    blended.effects = [...new Set(blended.effects)];
    
    // Select primary progression (from highest energy adjective)
    const primaryParams = paramsList.reduce((max, p) => 
      (p.energy || 0) > (max.energy || 0) ? p : max
    );
    blended.progression = primaryParams.progression;
    blended.rhythm = primaryParams.rhythm;
    
    // Combine moods
    const moods = paramsList.filter(p => p.mood).map(p => p.mood);
    blended.mood = moods.join('-');
    
    return blended;
  }
  
  /**
   * Select dominant scale considering compatibility
   */
  selectDominantScale(scales) {
    const scaleFreq = {};
    scales.forEach(scale => {
      scaleFreq[scale] = (scaleFreq[scale] || 0) + 1;
    });
    
    // Return most frequent scale
    return Object.keys(scaleFreq).reduce((a, b) => 
      scaleFreq[a] > scaleFreq[b] ? a : b
    );
  }
  
  /**
   * Merge specific parameters over blended ones
   */
  mergeSpecificParams(blendedParams, specificParams) {
    return { ...blendedParams, ...specificParams };
  }
  
  /**
   * Expand lexicon with new adjectives
   */
  expandLexicon(adjectives, paramsList) {
    adjectives.forEach((adjective, i) => {
      if (!this.adjectiveLexicon[adjective] && paramsList[i] && paramsList[i].source === adjective) {
        console.log(`📚 Adding "${adjective}" to lexicon`);
        this.adjectiveLexicon[adjective] = { ...paramsList[i] };
        delete this.adjectiveLexicon[adjective].source;
      }
    });
  }
  
  /**
   * Default parameters
   */
  getDefaultParams() {
    return {
      bpm: [100, 120],
      scale: 'major',
      rhythm: 'straight',
      progression: ['I', 'V', 'vi', 'IV'],
      instruments: ['keyboard', 'guitar', 'bass'],
      energy: 0.5,
      mood: 'neutral'
    };
  }
  
  /**
   * Convert interpreted parameters to beat generator format
   */
  toBeatGeneratorParams(interpretedParams) {
    // Select BPM from range
    const bpm = interpretedParams.bpm ? 
      Math.round((interpretedParams.bpm[0] + interpretedParams.bpm[1]) / 2) : 120;
    
    // Map scale to genre/keyword for existing system
    const scaleGenreMap = {
      'major': 'pop',
      'minor': 'jazz',
      'blues': 'blues',
      'dorian': 'jazz',
      'mixolydian': 'funk',
      'lydian': 'ambient',
      'aeolian': 'lo-fi',
      'phrygian': 'aggressive'
    };
    
    const keyword = scaleGenreMap[interpretedParams.scale] || 'default';
    
    // Use only first detected instrument (single instrument focus)
    const instrument = interpretedParams.instruments && interpretedParams.instruments.length > 0 ?
      interpretedParams.instruments[0] : 'auto';
    
    return {
      bpm: bpm,
      keyword: keyword,
      instrument: instrument,
      bars: interpretedParams.energy > 0.7 ? 2 : 1, // More bars for high energy
      originalPrompt: interpretedParams,
      interpretedParams: interpretedParams
    };
  }
  
  /**
   * Get all available adjectives
   */
  getAvailableAdjectives() {
    return Object.keys(this.adjectiveLexicon).sort();
  }
  
  /**
   * Get lexicon for debugging/inspection
   */
  getLexicon() {
    return this.adjectiveLexicon;
  }
  
  /**
   * Extract Spotify references from prompt and analyze them
   */
  async extractSpotifyReferences(prompt, tokens) {
    const spotifyParams = [];
    const spotifyWarnings = [];
    
    try {
      // Common patterns for detecting music references
      const songPatterns = [
        /like\s+"([^"]+)"/gi,                    // like "song name"
        /sounds?\s+like\s+"([^"]+)"/gi,         // sounds like "song name"
        /similar\s+to\s+"([^"]+)"/gi,           // similar to "song name"
        /in\s+the\s+style\s+of\s+"([^"]+)"/gi   // in the style of "song name"
      ];
      
      const artistPatterns = [
        /like\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,     // like Beatles, Taylor Swift
        /sounds?\s+like\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /similar\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /in\s+the\s+style\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g        // by Artist Name
      ];
      
      // Look for quoted songs first (more specific)
      for (const pattern of songPatterns) {
        let match;
        while ((match = pattern.exec(prompt)) !== null) {
          const songName = match[1];
          console.log(`🔍 Analyzing song: "${songName}"`);
          
          const songAnalysis = await this.spotify.analyzeSong(songName);
          if (songAnalysis) {
            const params = this.convertSpotifyToParams(songAnalysis, 1.0, 'song');
            spotifyParams.push(params);
          } else {
            spotifyWarnings.push(`Could not analyze song "${songName}" via Spotify API`);
          }
        }
      }
      
      // Look for artist references
      for (const pattern of artistPatterns) {
        let match;
        while ((match = pattern.exec(prompt)) !== null) {
          const artistName = match[1];
          
          // Skip if it's a common word or already found as a song
          if (this.isCommonWord(artistName) || spotifyParams.some(p => p.source?.includes(artistName))) {
            continue;
          }
          
          console.log(`🔍 Analyzing artist: "${artistName}"`);
          
          const artistAnalysis = await this.spotify.analyzeArtist(artistName, 5);
          if (artistAnalysis && artistAnalysis.tracks.length > 0) {
            // Create weighted parameters from top tracks
            const weightedParams = this.blendSpotifyTracks(artistAnalysis.tracks, 'artist', artistName);
            spotifyParams.push(weightedParams);
          } else {
            spotifyWarnings.push(`Could not analyze artist "${artistName}" via Spotify API`);
          }
        }
      }
      
      // Look for album references with "album:" prefix or in quotes
      const albumMatches = prompt.match(/album[:\s]+"([^"]+)"/gi);
      if (albumMatches) {
        for (const match of albumMatches) {
          const albumName = match.replace(/album[:\s]+"/gi, '').replace('"', '');
          console.log(`🔍 Analyzing album: "${albumName}"`);
          
          const albumAnalysis = await this.spotify.analyzeAlbum(albumName, null, 6);
          if (albumAnalysis && albumAnalysis.tracks.length > 0) {
            const weightedParams = this.blendSpotifyTracks(albumAnalysis.tracks, 'album', albumName);
            spotifyParams.push(weightedParams);
          } else {
            spotifyWarnings.push(`Could not analyze album "${albumName}" via Spotify API`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Spotify analysis failed:', error.message);
      spotifyWarnings.push(`Spotify API error: ${error.message}`);
    }
    
    return { spotifyParams, spotifyWarnings };
  }
  
  /**
   * Check if a string is a common word that shouldn't be treated as an artist
   */
  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'music', 'song', 'track', 'album', 'artist', 'band', 'sound', 'style', 'like',
      'upbeat', 'chill', 'fast', 'slow', 'loud', 'quiet', 'heavy', 'light', 'dark', 'bright'
    ];
    return commonWords.includes(word.toLowerCase());
  }
  
  /**
   * Blend multiple Spotify tracks into weighted parameters
   */
  blendSpotifyTracks(tracks, type, name) {
    const blended = {
      bpm: 0,
      energy: 0,
      danceability: 0,
      valence: 0,
      acousticness: 0,
      instrumentalness: 0,
      liveness: 0,
      speechiness: 0,
      loudness: 0,
      key: null,
      mode: null,
      instruments: [],
      source: `${type}: ${name}`,
      spotifyInfluence: true
    };
    
    let totalWeight = 0;
    const keyModes = [];
    
    // Weighted blend of all tracks
    tracks.forEach(track => {
      const weight = track.weight;
      totalWeight += weight;
      
      blended.bpm += track.tempo * weight;
      blended.energy += track.energy * weight;
      blended.danceability += track.danceability * weight;
      blended.valence += track.valence * weight;
      blended.acousticness += track.acousticness * weight;
      blended.instrumentalness += track.instrumentalness * weight;
      blended.liveness += track.liveness * weight;
      blended.speechiness += track.speechiness * weight;
      blended.loudness += track.loudness * weight;
      
      // Collect key/mode data for later analysis
      keyModes.push({
        key: track.key,
        mode: track.mode,
        weight: weight
      });
    });
    
    // Normalize by total weight
    if (totalWeight > 0) {
      blended.bpm = Math.round(blended.bpm / totalWeight);
      blended.energy /= totalWeight;
      blended.danceability /= totalWeight;
      blended.valence /= totalWeight;
      blended.acousticness /= totalWeight;
      blended.instrumentalness /= totalWeight;
      blended.liveness /= totalWeight;
      blended.speechiness /= totalWeight;
      blended.loudness /= totalWeight;
    }
    
    // Determine most common key/mode combination
    const dominantKeyMode = this.findDominantKeyMode(keyModes);
    blended.key = dominantKeyMode.key;
    blended.mode = dominantKeyMode.mode;
    
    return this.convertSpotifyToParams(blended, 1.0, type);
  }
  
  /**
   * Find the most common key/mode combination weighted by track popularity
   */
  findDominantKeyMode(keyModes) {
    const combinations = {};
    
    keyModes.forEach(({ key, mode, weight }) => {
      const combo = `${key}-${mode}`;
      combinations[combo] = (combinations[combo] || 0) + weight;
    });
    
    // Find the combination with highest weight
    let maxWeight = 0;
    let dominantCombo = '0-1'; // Default to C major
    
    Object.entries(combinations).forEach(([combo, weight]) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominantCombo = combo;
      }
    });
    
    const [key, mode] = dominantCombo.split('-').map(Number);
    return { key, mode };
  }
  
  /**
   * Convert Spotify analysis to prompt interpreter parameter format
   */
  convertSpotifyToParams(spotifyData, weight, type) {
    // Convert Spotify key to musical scale
    const keyToScale = {
      0: 'major',   // C
      1: 'minor',   // C#/Db
      2: 'major',   // D
      3: 'minor',   // D#/Eb
      4: 'major',   // E
      5: 'major',   // F
      6: 'minor',   // F#/Gb
      7: 'major',   // G
      8: 'minor',   // G#/Ab
      9: 'major',   // A
      10: 'minor',  // A#/Bb
      11: 'major'   // B
    };
    
    const scale = spotifyData.mode === 0 ? 'minor' : 
                  spotifyData.mode === 1 ? 'major' : 
                  keyToScale[spotifyData.key % 12] || 'major';
    
    // Map energy to rhythm style
    const rhythm = spotifyData.energy > 0.7 ? 'driving' :
                   spotifyData.energy > 0.4 ? 'straight' : 'relaxed';
    
    // Suggest instruments based on characteristics
    const instruments = [];
    if (spotifyData.acousticness > 0.6) instruments.push('guitar');
    if (spotifyData.danceability > 0.6) instruments.push('drums');
    if (spotifyData.energy < 0.4) instruments.push('keyboard');
    if (instruments.length === 0) instruments.push('auto');
    
    // Generate mood from valence and energy
    const mood = spotifyData.valence > 0.6 ? 'positive' :
                 spotifyData.valence < 0.4 ? 'dark' : 'neutral';
    
    return {
      bpm: [Math.max(60, spotifyData.bpm - 10), Math.min(200, spotifyData.bpm + 10)],
      scale: scale,
      rhythm: rhythm,
      progression: this.generateProgressionFromSpotify(spotifyData),
      instruments: instruments,
      energy: spotifyData.energy,
      mood: mood,
      danceability: spotifyData.danceability,
      valence: spotifyData.valence,
      acousticness: spotifyData.acousticness,
      weight: weight,
      source: spotifyData.source || type,
      spotifyInfluence: true
    };
  }
  
  /**
   * Generate chord progression suggestions based on Spotify data
   */
  generateProgressionFromSpotify(spotifyData) {
    // Basic progressions based on mode and energy
    if (spotifyData.mode === 0) { // Minor
      return spotifyData.energy > 0.6 ? 
        ['i', 'bVII', 'bVI', 'bVII'] :  // Energetic minor
        ['i', 'bVI', 'bVII', 'i'];      // Melancholic minor
    } else { // Major
      return spotifyData.energy > 0.6 ?
        ['I', 'V', 'vi', 'IV'] :        // Classic pop progression
        ['I', 'vi', 'IV', 'V'];         // Gentle major
    }
  }
}

module.exports = { PromptInterpreter };