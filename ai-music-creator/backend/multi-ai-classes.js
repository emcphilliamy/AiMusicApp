// Supporting Classes for Multi-AI Orchestra System

// Prompt Analysis AI - Understands musical intent from text prompts
class PromptAnalyzer {
  constructor() {
    this.emotionKeywords = {
      happy: ['upbeat', 'cheerful', 'bright', 'energetic', 'joyful', 'uplifting'],
      sad: ['melancholy', 'dark', 'somber', 'emotional', 'deep', 'moody'],
      aggressive: ['heavy', 'intense', 'powerful', 'driving', 'hard', 'aggressive'],
      calm: ['peaceful', 'gentle', 'soft', 'ambient', 'relaxing', 'serene'],
      energetic: ['fast', 'dynamic', 'exciting', 'vibrant', 'lively', 'pumping']
    };
    
    this.complexityKeywords = {
      simple: ['simple', 'basic', 'minimal', 'clean', 'straightforward'],
      moderate: ['interesting', 'layered', 'textured', 'rich', 'developed'],
      complex: ['complex', 'intricate', 'sophisticated', 'elaborate', 'detailed', 'advanced']
    };
    
    this.instrumentKeywords = {
      drums: ['drums', 'percussion', 'beat', 'rhythm', 'groove'],
      guitar: ['guitar', 'riff', 'chord', 'strum', 'solo'],
      piano: ['piano', 'keys', 'chord', 'melody', 'harmony'],
      bass: ['bass', 'low', 'foundation', 'groove'],
      strings: ['strings', 'orchestral', 'cinematic', 'atmospheric'],
      electronic: ['synth', 'electronic', 'digital', 'edm', 'techno']
    };
  }

  async analyze(prompt) {
    const words = prompt.toLowerCase().split(/\s+/);
    
    return {
      mood: this.analyzeMood(words),
      energy: this.analyzeEnergy(words),
      complexity: this.analyzeComplexity(words),
      suggestedInstruments: this.suggestInstruments(words),
      tempo: this.suggestTempo(words),
      genre: this.suggestGenre(words),
      structure: this.suggestStructure(words)
    };
  }

  analyzeMood(words) {
    const moodScores = {};
    
    Object.keys(this.emotionKeywords).forEach(mood => {
      moodScores[mood] = this.emotionKeywords[mood].reduce((score, keyword) => {
        return score + (words.filter(word => word.includes(keyword)).length * 2);
      }, 0);
    });
    
    const dominantMood = Object.keys(moodScores).reduce((a, b) => 
      moodScores[a] > moodScores[b] ? a : b
    );
    
    return {
      primary: dominantMood,
      intensity: Math.min(1.0, moodScores[dominantMood] / 3),
      scores: moodScores
    };
  }

  analyzeEnergy(words) {
    const energyKeywords = {
      low: ['slow', 'calm', 'peaceful', 'gentle', 'soft', 'quiet'],
      medium: ['moderate', 'steady', 'flowing', 'smooth'],
      high: ['fast', 'energetic', 'powerful', 'intense', 'driving', 'explosive']
    };
    
    let energyScore = 0.5; // Default medium energy
    
    Object.keys(energyKeywords).forEach(level => {
      const matches = energyKeywords[level].reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      
      if (level === 'low') energyScore -= matches * 0.2;
      if (level === 'high') energyScore += matches * 0.2;
    });
    
    return Math.max(0.1, Math.min(1.0, energyScore));
  }

  analyzeComplexity(words) {
    let complexityScore = 0.5; // Default moderate complexity
    
    Object.keys(this.complexityKeywords).forEach(level => {
      const matches = this.complexityKeywords[level].reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      
      if (level === 'simple') complexityScore -= matches * 0.2;
      if (level === 'complex') complexityScore += matches * 0.3;
    });
    
    return Math.max(0.1, Math.min(1.0, complexityScore));
  }

  suggestInstruments(words) {
    const suggestions = [];
    
    Object.keys(this.instrumentKeywords).forEach(instrument => {
      const matches = this.instrumentKeywords[instrument].reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      
      if (matches > 0) {
        suggestions.push({ instrument, relevance: matches });
      }
    });
    
    return suggestions.sort((a, b) => b.relevance - a.relevance);
  }

  suggestTempo(words) {
    const tempoKeywords = {
      slow: ['slow', 'ballad', 'gentle', 'calm', 'peaceful'],
      medium: ['moderate', 'walking', 'steady'],
      fast: ['fast', 'quick', 'energetic', 'driving', 'upbeat']
    };
    
    let tempoSuggestion = 120; // Default tempo
    
    Object.keys(tempoKeywords).forEach(speed => {
      const matches = tempoKeywords[speed].reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      
      if (matches > 0) {
        switch (speed) {
          case 'slow': tempoSuggestion = 70; break;
          case 'fast': tempoSuggestion = 140; break;
        }
      }
    });
    
    return tempoSuggestion;
  }

  suggestGenre(words) {
    const genreKeywords = {
      rock: ['rock', 'guitar', 'drums', 'heavy', 'power'],
      jazz: ['jazz', 'swing', 'improvisation', 'sophisticated'],
      electronic: ['electronic', 'synth', 'digital', 'edm', 'techno'],
      classical: ['classical', 'orchestral', 'symphony', 'elegant'],
      pop: ['pop', 'catchy', 'mainstream', 'radio'],
      blues: ['blues', 'soulful', 'emotional', 'guitar']
    };
    
    const genreScores = {};
    
    Object.keys(genreKeywords).forEach(genre => {
      genreScores[genre] = genreKeywords[genre].reduce((score, keyword) => {
        return score + words.filter(word => word.includes(keyword)).length;
      }, 0);
    });
    
    const suggestedGenre = Object.keys(genreScores).reduce((a, b) => 
      genreScores[a] > genreScores[b] ? a : b
    );
    
    return genreScores[suggestedGenre] > 0 ? suggestedGenre : null;
  }

  suggestStructure(words) {
    const structureKeywords = {
      intro: ['intro', 'beginning', 'start'],
      verse: ['verse', 'story', 'narrative'],
      chorus: ['chorus', 'hook', 'catchy', 'memorable'],
      bridge: ['bridge', 'change', 'different', 'contrast'],
      outro: ['outro', 'ending', 'fade', 'conclusion']
    };
    
    const suggestions = [];
    
    Object.keys(structureKeywords).forEach(section => {
      const matches = structureKeywords[section].reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      
      if (matches > 0) {
        suggestions.push(section);
      }
    });
    
    return suggestions.length > 0 ? suggestions : ['verse', 'chorus'];
  }
}

// Instrument Selection AI - Chooses the best instruments for the context
class InstrumentSelector {
  constructor() {
    this.genreInstruments = {
      rock: ['drums', 'bass', 'lead_guitar', 'rhythm_guitar', 'vocals'],
      jazz: ['piano', 'bass', 'drums', 'saxophone', 'trumpet'],
      electronic: ['synthesizer', 'drums', 'bass', 'vocals'],
      classical: ['strings', 'piano', 'woodwinds', 'brass'],
      pop: ['drums', 'bass', 'piano', 'guitar', 'vocals', 'synthesizer'],
      reggae: ['drums'], // Isolated drum beat generation only
      blues: ['guitar', 'bass', 'drums', 'harmonica', 'vocals'],
      country: ['guitar', 'bass', 'drums', 'fiddle', 'vocals']
    };
    
    this.moodInstruments = {
      happy: ['piano', 'guitar', 'brass', 'strings'],
      sad: ['piano', 'strings', 'cello', 'guitar'],
      aggressive: ['drums', 'electric_guitar', 'bass', 'synthesizer'],
      calm: ['piano', 'strings', 'flute', 'guitar'],
      energetic: ['drums', 'bass', 'synthesizer', 'brass']
    };
  }

  async selectForContext(context) {
    const { genre, prompt, tempo, key, mood, energy } = context;
    
    // Start with genre-based selection
    let selectedInstruments = [...(this.genreInstruments[genre] || this.genreInstruments.pop)];
    
    // Add mood-based instruments
    if (mood && mood.primary && this.moodInstruments[mood.primary]) {
      const moodInstruments = this.moodInstruments[mood.primary];
      moodInstruments.forEach(instrument => {
        if (!selectedInstruments.includes(instrument) && Math.random() < mood.intensity) {
          selectedInstruments.push(instrument);
        }
      });
    }
    
    // Add prompt-suggested instruments
    if (prompt && prompt.suggestedInstruments) {
      prompt.suggestedInstruments.forEach(suggestion => {
        if (!selectedInstruments.includes(suggestion.instrument) && suggestion.relevance > 1) {
          selectedInstruments.push(suggestion.instrument);
        }
      });
    }
    
    // Adjust based on energy level
    if (energy > 0.7) {
      // High energy - add more rhythm section
      if (!selectedInstruments.includes('drums')) selectedInstruments.push('drums');
      if (!selectedInstruments.includes('bass')) selectedInstruments.push('bass');
    } else if (energy < 0.3) {
      // Low energy - add more melodic/harmonic instruments
      if (!selectedInstruments.includes('piano')) selectedInstruments.push('piano');
      if (!selectedInstruments.includes('strings')) selectedInstruments.push('strings');
    }
    
    // Apply tempo-based adjustments
    if (tempo > 140) {
      // Fast tempo - ensure strong rhythm section
      if (!selectedInstruments.includes('drums')) selectedInstruments.unshift('drums');
      if (!selectedInstruments.includes('bass')) selectedInstruments.splice(1, 0, 'bass');
    }
    
    // Limit complexity based on context
    const maxInstruments = this.calculateMaxInstruments(context);
    if (selectedInstruments.length > maxInstruments) {
      selectedInstruments = this.prioritizeInstruments(selectedInstruments, context, maxInstruments);
    }
    
    console.log(`🎯 Selected instruments for ${genre}: ${selectedInstruments.join(', ')}`);
    return selectedInstruments;
  }

  calculateMaxInstruments(context) {
    const { genre, energy, mood } = context;
    
    let max = 5; // Default
    
    // Genre-based adjustments
    const genreMaxes = {
      electronic: 4,
      jazz: 6,
      rock: 5,
      classical: 8,
      pop: 6
    };
    
    max = genreMaxes[genre] || max;
    
    // Energy-based adjustments
    if (energy > 0.8) max += 1;
    if (energy < 0.3) max -= 1;
    
    // Mood-based adjustments
    if (mood && mood.primary === 'calm') max -= 1;
    if (mood && mood.primary === 'aggressive') max += 1;
    
    return Math.max(2, Math.min(8, max));
  }

  prioritizeInstruments(instruments, context, maxCount) {
    const { genre, mood, energy } = context;
    
    // Define priority scores for different instruments
    const priorities = {
      drums: 10,
      bass: 9,
      piano: 8,
      guitar: 7,
      lead_guitar: 7,
      rhythm_guitar: 6,
      vocals: 8,
      strings: 6,
      synthesizer: 5,
      brass: 4,
      woodwinds: 3
    };
    
    // Adjust priorities based on genre
    if (genre === 'jazz') {
      priorities.piano = 10;
      priorities.saxophone = 9;
      priorities.trumpet = 8;
    } else if (genre === 'rock') {
      priorities.lead_guitar = 9;
      priorities.rhythm_guitar = 8;
    } else if (genre === 'electronic') {
      priorities.synthesizer = 10;
      priorities.drums = 9;
    }
    
    // Adjust priorities based on mood and energy
    if (mood && mood.primary === 'aggressive') {
      priorities.drums += 2;
      priorities.bass += 2;
    }
    
    if (energy > 0.7) {
      priorities.drums += 1;
      priorities.bass += 1;
    }
    
    // Sort instruments by priority and take the top ones
    const prioritized = instruments
      .map(instrument => ({
        instrument,
        priority: priorities[instrument] || 1
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxCount)
      .map(item => item.instrument);
    
    return prioritized;
  }
}

// Musical Knowledge Base - Contains music theory and genre knowledge
class MusicalKnowledgeBase {
  constructor() {
    this.scales = {
      major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      dorian: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
      mixolydian: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
      pentatonic: ['C', 'D', 'E', 'G', 'A']
    };
    
    this.chordProgressions = {
      pop: [
        ['I', 'V', 'vi', 'IV'],
        ['vi', 'IV', 'I', 'V'],
        ['I', 'vi', 'IV', 'V']
      ],
      rock: [
        ['I', 'VII', 'IV', 'I'],
        ['I', 'V', 'vi', 'IV'],
        ['I', 'III', 'VII', 'IV']
      ],
      jazz: [
        ['ii7', 'V7', 'I', 'vi7'],
        ['I', 'vi', 'ii', 'V'],
        ['iii', 'vi', 'ii', 'V']
      ],
      blues: [
        ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7']
      ]
    };
    
    this.rhythmPatterns = {
      rock: { kick: [1, 0, 1, 0], snare: [0, 1, 0, 1], hihat: [1, 1, 1, 1] },
      jazz: { kick: [1, 0, 0, 1], snare: [0, 0, 1, 0], hihat: [1, 0, 1, 0] },
      reggae: { kick: [0, 0, 1, 0], snare: [0, 1, 0, 1], hihat: [1, 1, 0, 1] },
      electronic: { kick: [1, 0, 1, 0], snare: [0, 1, 0, 1], hihat: [1, 1, 1, 1] }
    };
  }

  getScaleNotes(key, scaleType = 'major') {
    const rootNote = key;
    const intervals = this.scales[scaleType] || this.scales.major;
    
    // Transpose the scale to the correct key
    return this.transposeScale(intervals, rootNote);
  }

  transposeScale(intervals, rootNote) {
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = chromaticScale.indexOf(rootNote);
    
    if (rootIndex === -1) return intervals; // Return original if root not found
    
    return intervals.map(note => {
      const noteIndex = chromaticScale.indexOf(note);
      const transposedIndex = (noteIndex + rootIndex) % 12;
      return chromaticScale[transposedIndex];
    });
  }

  getChordProgression(genre, key) {
    const progressions = this.chordProgressions[genre] || this.chordProgressions.pop;
    const selectedProgression = progressions[Math.floor(Math.random() * progressions.length)];
    
    return this.transposeProgression(selectedProgression, key);
  }

  transposeProgression(progression, key) {
    // Convert Roman numerals to actual chords in the given key
    const scaleNotes = this.getScaleNotes(key, 'major');
    
    return progression.map(chord => {
      const degree = this.parseRomanNumeral(chord);
      return scaleNotes[degree - 1] + this.getChordQuality(chord);
    });
  }

  parseRomanNumeral(roman) {
    const numerals = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7 };
    const cleanRoman = roman.replace(/[^IVX]/g, '').toUpperCase();
    return numerals[cleanRoman] || 1;
  }

  getChordQuality(chord) {
    if (chord.includes('7')) return '7';
    if (chord.includes('m')) return 'm';
    return ''; // Major chord
  }

  getRhythmPattern(genre) {
    return this.rhythmPatterns[genre] || this.rhythmPatterns.rock;
  }

  isHarmonicallyCompatible(chord1, chord2, key) {
    // Simple harmonic compatibility check
    const progression = this.getChordProgression('pop', key);
    return progression.includes(chord1) && progression.includes(chord2);
  }

  suggestNextChord(currentChord, key, genre) {
    const progression = this.getChordProgression(genre, key);
    const currentIndex = progression.indexOf(currentChord);
    
    if (currentIndex !== -1 && currentIndex < progression.length - 1) {
      return progression[currentIndex + 1];
    }
    
    // Return first chord if at end or not found
    return progression[0];
  }
}

module.exports = {
  PromptAnalyzer,
  InstrumentSelector, 
  MusicalKnowledgeBase
};