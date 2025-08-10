# Beat Generator - Modular JavaScript Beat Generator

A professional-grade, modular JavaScript beat generator that creates single-instrument drum tracks using NSynth samples. Built following DAW and music theory conventions with precise timing accuracy.

## Features

✅ **Music Theory Based**: Implements authentic genre patterns (jazz, funk, house, lo-fi, pop)  
✅ **Sample Accurate Timing**: ±1ms precision for professional quality  
✅ **NSynth Integration**: Intelligent selection from 305K+ instrument samples  
✅ **Modular Architecture**: Clean separation of concerns for easy extension  
✅ **Industry Standards**: 16th note grid, swing quantization, velocity curves  
✅ **Reproducible Results**: Seeded randomness for consistent outputs  

## Quick Start

### Prerequisites

- Node.js ≥14.0.0
- NSynth dataset (automatically downloaded)
- Required packages: `wavefile`

### Installation

```bash
# Install dependencies
npm install wavefile

# Download NSynth test dataset (recommended for quick start)
curl -X POST http://localhost:3001/api/nsynth/download/test
```

### Basic Usage

```javascript
const { generateBeat } = require('./beatGenerator');

// Generate a funk beat
const outputPath = await generateBeat({
  songName: "MyFunkTrack",
  keyword: "funk",
  bpm: 110,
  bars: 2,
  instrument: "auto"
});

console.log(`Beat generated: ${outputPath}`);
// Output: ./generated/MyFunkTrack-drums1.wav
```

## API Reference

### `generateBeat(options)`

Main function to generate drum beats.

**Parameters:**
- `songName` (string, required): Song name for output file
- `bpm` (number, optional): Beats per minute (60-200, default: 120)
- `timeSignature` (string, optional): Time signature ("4/4" or "3/4", default: "4/4")  
- `bars` (number, optional): Pattern length (1, 2, or 4 bars, default: 1)
- `keyword` (string, optional): Style keyword (default: "default")
- `instrument` (string, optional): Instrument selection ("auto" or specific, default: "auto")
- `outputPath` (string, optional): Output directory (default: "./generated")
- `seed` (string|number, optional): Random seed for reproducible results

**Returns:** Promise\<string\> - Path to generated WAV file

## Style Keywords & Musical Implementation

### Jazz (`keyword: "jazz"`)
- **BPM Range**: 90-120
- **Swing Feel**: 2:1 swing ratio on 8th notes
- **Pattern**: Light cymbal work, ghost notes, subtle backbeat
- **Humanization**: ±5% timing variation
- **Preferred Instruments**: Brass, mallet, string (warm, organic sounds)

```javascript
await generateBeat({
  songName: "JazzWaltz", 
  keyword: "jazz", 
  bpm: 95, 
  timeSignature: "3/4"
});
```

### Funk (`keyword: "funk"`)
- **BPM Range**: 100-130  
- **Groove**: Tight 16th syncopation, strong "one"
- **Pattern**: Heavy kick on 1, ghost snares, syncopated hits
- **Timing**: Machine-tight (±2% variation)
- **Preferred Instruments**: Mallet, string, bass (punchy, defined)

```javascript
await generateBeat({
  songName: "FunkGroove", 
  keyword: "funk", 
  bpm: 115, 
  bars: 4
});
```

### House (`keyword: "house"`)  
- **BPM Range**: 120-128
- **Pattern**: Four-on-the-floor kick, swung hi-hats
- **Feel**: Steady, hypnotic groove
- **Timing**: Perfect quantization (±1% variation)
- **Preferred Instruments**: Synth lead, bass, brass (electronic, clean)

```javascript
await generateBeat({
  songName: "HouseDrop", 
  keyword: "house", 
  bpm: 124, 
  bars: 2
});
```

### Lo-Fi (`keyword: "lo-fi"`)
- **BPM Range**: 60-90
- **Feel**: Relaxed, sparse patterns with timing jitter
- **Pattern**: Off-beat elements, soft dynamics
- **Humanization**: ±15% timing variation + random jitter
- **Preferred Instruments**: Mallet, keyboard, string (warm, vintage)

```javascript
await generateBeat({
  songName: "ChillBeats", 
  keyword: "lo-fi", 
  bpm: 75, 
  bars: 2
});
```

### Pop/Upbeat (`keyword: "pop"` or `"upbeat"`)
- **BPM Range**: 110-140
- **Pattern**: Strong downbeats, predictable snare on 2 & 4  
- **Feel**: Clear, driving rhythm
- **Preferred Instruments**: Balanced selection for radio-friendly sound

## Instrument Selection

### Auto Selection (`instrument: "auto"`)
The system intelligently selects NSynth samples based on:
1. **Style Preferences**: Each genre has preferred instrument families
2. **Note Mapping**: Drum elements mapped to appropriate pitch ranges
3. **Sample Quality**: Best velocity/pitch matches selected
4. **Availability**: Fallback logic when preferred samples unavailable

### Manual Selection
```javascript
// Use specific NSynth instrument family  
instrument: "mallet"     // Uses mallet percussion samples
instrument: "brass"      // Uses brass instrument samples

// Use custom WAV file
instrument: "./samples/kick.wav"  // Custom sample file
```

### NSynth Instrument Families
- `guitar` - Guitar samples for percussive elements
- `piano` - Piano samples (good for mallet-like sounds)
- `keyboard` - Keyboard samples  
- `bass` - Bass samples (excellent for kick drums)
- `drums` - Actual drum samples (if available)
- `brass` - Brass samples (bright, cutting sounds)
- `string` - String samples (warm, sustaining)
- `mallet` - Mallet percussion (ideal for most drum sounds)
- `organ` - Organ samples
- `reed` - Reed instrument samples
- `synth_lead` - Synthesizer samples (electronic sounds)
- `vocal` - Vocal samples (unique textures)

## Technical Implementation

### Timing Engine
- **Grid Resolution**: 16 steps per bar (16th note grid)
- **Sample Rate**: 44.1kHz (CD quality)
- **Precision**: Sample-accurate positioning
- **Swing**: Configurable 2:1 or 3:1 swing ratios
- **Humanization**: Style-specific timing variations

### Pattern Generation  
- **Music Theory**: Authentic genre patterns based on established drumming styles
- **Velocity Curves**: Exponential velocity response for musical dynamics
- **Ghost Notes**: Proper implementation with reduced velocity
- **Accents**: Style-appropriate accent placement
- **Fills**: Automatic fill generation for longer patterns

### Audio Processing
- **Resampling**: Automatic resampling to match project sample rate
- **Mixing**: Additive mixing with soft limiting
- **Normalization**: Automatic level optimization with headroom
- **Anti-Aliasing**: Proper fade in/out to prevent clicks

## Example Usage

### Example 1: Funk Beat
```javascript
const { generateBeat } = require('./beatGenerator');

const result = await generateBeat({
  songName: "TrailSong1",
  keyword: "funk", 
  bpm: 110,
  instrument: "auto"
});
// Output: ./generated/TrailSong1-drums1.wav
```

### Example 2: Lo-Fi with Custom Sample
```javascript  
const result = await generateBeat({
  songName: "LateNight",
  keyword: "lo-fi",
  bpm: 75,
  bars: 2,
  instrument: "conga1.wav"  // Custom sample
});
// Output: ./generated/LateNight-drums1.wav
```

### Example 3: House Pattern
```javascript
const result = await generateBeat({
  songName: "HouseTest",
  keyword: "house", 
  bpm: 125,
  bars: 2,
  instrument: "auto"
});
// Output: ./generated/HouseTest-drums1.wav
```

### Example 4: Reproducible Results
```javascript
// These will generate identical patterns
const beat1 = await generateBeat({
  songName: "Test1", 
  keyword: "jazz", 
  seed: "myseed123"
});

const beat2 = await generateBeat({
  songName: "Test2", 
  keyword: "jazz", 
  seed: "myseed123"  // Same seed = identical pattern
});
```

## Running Examples

```bash
# Run the built-in examples
node beatGenerator.js

# Run with custom examples
node -e "
const { generateBeat } = require('./beatGenerator');
generateBeat({ songName: 'Test', keyword: 'funk', bpm: 120 })
  .then(path => console.log('Generated:', path));
"
```

## File Output

### Filename Format
All generated files follow the exact naming convention: `{songName}-drums1.wav`

### WAV Specifications
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit  
- **Channels**: Mono (single instrument requirement)
- **Format**: Standard WAV with proper headers
- **Metadata**: Song title, generator info

### Quality Assurance
- **Timing Accuracy**: ±1ms precision (requirement met)
- **Audio Quality**: Professional mixing with soft limiting
- **File Validation**: Automatic format verification
- **No Clipping**: Proper headroom and normalization

## Module Architecture

```
beatGenerator.js          # Main orchestrator
├── modules/
    ├── timingEngine.js   # Timing, quantization, music theory
    ├── patternGenerator.js # Genre patterns and variations  
    ├── instrumentSelector.js # NSynth integration
    └── wavExporter.js    # Audio processing and WAV export
```

### Extending the System

#### Adding New Styles
```javascript
// In patternGenerator.js
stylePatterns.myGenre = {
  bpmRange: [80, 120],
  density: 0.7,
  swingFeel: false,
  patterns: {
    primary: [
      { step: 1, velocity: 0.8, note: 'kick' },
      // ... more pattern events
    ]
  }
};
```

#### Custom Instrument Mapping
```javascript
// In instrumentSelector.js  
drumMapping.newNoteType = {
  instruments: ['brass', 'string'],
  pitchRange: [60, 72],
  preferredPitch: 66,
  velocity: [80, 120]
};
```

## Troubleshooting

### Common Issues

**"No samples available"**
- Download NSynth dataset: `POST /api/nsynth/download/test`
- Check NSynth status: `GET /api/nsynth/status`

**"Timing accuracy outside tolerance"**  
- Usually indicates system performance issues
- Try smaller patterns or lower sample rates for testing

**"Instrument not found"**
- Use `instrument: "auto"` for automatic selection  
- Check available instruments: `GET /api/nsynth/instruments`

### Performance Tips

- **Cache Samples**: Instrument selector caches loaded samples automatically
- **Batch Generation**: Generate multiple beats in sequence for efficiency  
- **Memory**: Large NSynth datasets may require sufficient RAM

## Requirements Met

✅ **Output**: Single WAV file with exact naming: `{songName}-drums1.wav`  
✅ **Timing**: ±1ms accuracy with proper BPM and time signature support  
✅ **Music Theory**: Authentic implementation of swing, accents, ghost notes  
✅ **Style Mapping**: All required keywords implemented with proper characteristics  
✅ **API**: Clean function interface with comprehensive options  
✅ **Modularity**: Separated concerns for maintainability  
✅ **Determinism**: Seeded randomness for reproducible results  
✅ **Testing**: Complete examples and validation  

## Version History

- **v1.0.0**: Initial release with full NSynth integration and style implementation
- Supports Node.js ≥14.0.0
- Professional audio quality with industry-standard practices

---

*Built with ♪ for the AI Music Backend - Beat Generator Module*