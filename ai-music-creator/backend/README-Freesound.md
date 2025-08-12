# Freesound Integration

This system now supports both NSynth and Freesound.org samples, providing a comprehensive library of sounds for music generation.

## Overview

The hybrid instrument system automatically falls back from NSynth to Freesound samples when instruments aren't available:

- **NSynth**: High-quality synthesized instruments (guitar, keyboard, organ, bass, string, brass)
- **Freesound**: Community-contributed samples (drums, piano, claps, synth leads, brass)

## Supported Instruments

### From NSynth (Primary)
- ✅ Guitar (acoustic & electric tones)
- ✅ Keyboard (various electronic tones) 
- ✅ Organ (Hammond-style tones)
- ✅ Bass (low-frequency tones)
- ✅ String (orchestral string tones)
- ✅ Brass (synthesized brass tones)

### From Freesound (Fallback & Specialty)
- 🥁 **Drums**: kick, snare, hihat, tom, ride, crash
- 🎹 **Piano**: Real piano notes across the keyboard
- 👏 **Claps**: Hand claps and applause sounds
- 🎛️ **Synth Lead**: Electronic lead synthesizer sounds
- 🎺 **Brass**: Real trumpet, saxophone, trombone samples

## Quick Start

1. **Get Freesound API Key**
   ```bash
   # Sign up at https://freesound.org/
   # Apply for API key at https://freesound.org/apiv2/apply
   ```

2. **Download Samples**
   ```bash
   FREESOUND_API_KEY="your_api_key_here" node freesound-downloader.js
   ```

3. **Test Integration**
   ```bash
   node test-freesound-integration.js
   ```

4. **Generate Music with New Instruments**
   ```bash
   node test-prompt-generation.js
   ```

## Usage Examples

The system now supports prompts that previously didn't work:

```javascript
// These now work with Freesound samples!
"energetic drums"           // Uses Freesound kick, snare, hihat
"warm piano melody"         // Uses Freesound piano samples  
"rhythmic hand claps"       // Uses Freesound clap samples
"bright synth lead"         // Uses Freesound synthesizer samples
"brass fanfare"             // Uses Freesound trumpet/saxophone

// These still work with NSynth (preferred)
"warm guitar strumming"     // Uses NSynth guitar samples
"smooth keyboard pad"       // Uses NSynth keyboard samples
```

## File Structure

```
samples/
├── nsynth/                 # NSynth samples (existing)
│   ├── guitar/
│   ├── keyboard/
│   └── ...
└── freesound/              # Freesound samples (new)
    ├── drums/              # kick_001_808.mp3, snare_002_rim.mp3, etc.
    ├── piano/              # piano_001_C4.mp3, piano_002_D4.mp3, etc.  
    ├── claps/              # clap_001_hand.mp3, clap_002_applause.mp3, etc.
    ├── synth_lead/         # synth_001_lead.mp3, etc.
    ├── brass/              # trumpet_001_note.mp3, sax_002_note.mp3, etc.
    └── metadata.json       # Sample information and counts
```

## Technical Details

### Fallback System
1. **Primary**: Try to load NSynth sample for the instrument
2. **Fallback**: If NSynth fails, try Freesound sample
3. **Final Fallback**: Use available samples from any source

### Sample Format
- **Freesound**: Downloads as MP3 (preview quality)
- **NSynth**: WAV format (high quality)
- **Integration**: Both formats supported transparently

### Instrument Mapping
The system intelligently maps drum types and melodic notes:

```javascript
// Drum mapping
kick → freesound/drums/*kick*
snare → freesound/drums/*snare*  
hihat → freesound/drums/*hihat*

// Piano mapping  
MIDI 60 (C4) → freesound/piano/*C*
MIDI 62 (D4) → freesound/piano/*D*
```

## API Integration

### Freesound API Features Used
- **Text Search**: Find samples by keyword and tags
- **Quality Filtering**: Duration, bitdepth, sample rate filters
- **Preview Downloads**: MP3 previews (no OAuth required)
- **Metadata**: Sample information and ratings

### Rate Limiting
- Respectful 1-second delays between downloads
- Caches loaded samples to avoid reloading
- Efficient batch downloading by instrument type

## Troubleshooting

### Common Issues

**"No samples available for drums"**
```bash
# Download drum samples
FREESOUND_API_KEY="your_key" node freesound-downloader.js
```

**"Failed to load Freesound sample"**
- Check that samples were downloaded to `samples/freesound/`
- Verify MP3 files exist in instrument subdirectories

**"API key required"**
- Get free API key from https://freesound.org/apiv2/apply
- Set environment variable: `export FREESOUND_API_KEY="your_key"`

### File Permissions
Ensure the `samples/freesound/` directory is writable:
```bash
chmod -R 755 samples/freesound/
```

## Benefits

✅ **Complete Drum Kits**: Real kick, snare, hihat samples  
✅ **Piano Support**: Actual piano notes for melodies  
✅ **Rhythmic Variety**: Hand claps and percussion elements  
✅ **Electronic Sounds**: Synthesizer leads and electronic textures  
✅ **Orchestral Elements**: Real brass instrument samples  
✅ **Seamless Fallback**: Automatically uses best available samples  
✅ **Expandable**: Easy to add new instrument categories  

The system now provides professional-quality samples for all common instruments used in music production!