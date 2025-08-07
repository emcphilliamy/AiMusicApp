// Prompt Analysis System for Musical Variation
// Extracts musical descriptors from prompts like "upbeat isolated guitar"

class PromptAnalyzer {
    constructor() {
        // Comprehensive musical descriptor mappings
        this.descriptors = {
            // Energy/Tempo descriptors
            energy: {
                'upbeat': { energy: 0.9, tempoModifier: 1.2, dynamics: 0.8 },
                'energetic': { energy: 0.9, tempoModifier: 1.15, dynamics: 0.85 },
                'lively': { energy: 0.8, tempoModifier: 1.1, dynamics: 0.7 },
                'driving': { energy: 0.85, tempoModifier: 1.1, dynamics: 0.8 },
                'fast': { energy: 0.8, tempoModifier: 1.3, dynamics: 0.75 },
                'quick': { energy: 0.8, tempoModifier: 1.25, dynamics: 0.7 },
                'rapid': { energy: 0.85, tempoModifier: 1.4, dynamics: 0.8 },
                'slow': { energy: 0.3, tempoModifier: 0.7, dynamics: 0.6 },
                'mellow': { energy: 0.4, tempoModifier: 0.8, dynamics: 0.5 },
                'relaxed': { energy: 0.3, tempoModifier: 0.75, dynamics: 0.45 },
                'chill': { energy: 0.35, tempoModifier: 0.8, dynamics: 0.4 },
                'laid-back': { energy: 0.3, tempoModifier: 0.7, dynamics: 0.5 },
                'gentle': { energy: 0.25, tempoModifier: 0.8, dynamics: 0.3 },
                'lazy': { energy: 0.2, tempoModifier: 0.6, dynamics: 0.4 },
                'bouncy': { energy: 0.8, tempoModifier: 1.1, dynamics: 0.7, groove: 0.9 },
                'peppy': { energy: 0.85, tempoModifier: 1.15, dynamics: 0.75 },
                'sluggish': { energy: 0.2, tempoModifier: 0.65, dynamics: 0.35 },
                'frantic': { energy: 0.95, tempoModifier: 1.5, dynamics: 0.9 },
                'intense': { energy: 0.9, tempoModifier: 1.2, dynamics: 0.85 },
                'explosive': { energy: 0.95, tempoModifier: 1.3, dynamics: 0.95 }
            },
            
            // Style descriptors  
            style: {
                'funky': { groove: 0.9, syncopation: 0.8, swing: 0.3 },
                'groovy': { groove: 0.85, syncopation: 0.7, swing: 0.2 },
                'rhythmic': { groove: 0.8, syncopation: 0.6, swing: 0.1 },
                'jazzy': { groove: 0.7, syncopation: 0.9, swing: 0.8 },
                'bluesy': { groove: 0.6, syncopation: 0.5, swing: 0.7 },
                'latin': { groove: 0.8, syncopation: 0.8, swing: 0.0 },
                'rock': { groove: 0.7, syncopation: 0.2, swing: 0.0 },
                'pop': { groove: 0.6, syncopation: 0.3, swing: 0.0 },
                'reggae': { groove: 0.9, syncopation: 0.7, swing: 0.0 },
                'country': { groove: 0.6, syncopation: 0.3, swing: 0.1 },
                'folk': { groove: 0.5, syncopation: 0.2, swing: 0.0 },
                'electronic': { groove: 0.8, syncopation: 0.6, swing: 0.0 },
                'ambient': { groove: 0.3, syncopation: 0.1, swing: 0.0 },
                'classical': { groove: 0.4, syncopation: 0.2, swing: 0.0 },
                'metal': { groove: 0.8, syncopation: 0.4, swing: 0.0 },
                'punk': { groove: 0.7, syncopation: 0.2, swing: 0.0 },
                'disco': { groove: 0.9, syncopation: 0.5, swing: 0.0 },
                'techno': { groove: 0.8, syncopation: 0.3, swing: 0.0 },
                'house': { groove: 0.85, syncopation: 0.4, swing: 0.0 }
            },
            
            // Cultural/Geographical descriptors
            cultural: {
                'russian': { brightness: 0.4, harmonicContent: 0.7, tempoModifier: 0.9, groove: 0.6 },
                'mexican': { brightness: 0.8, harmonicContent: 0.8, tempoModifier: 1.1, groove: 0.8 },
                'irish': { brightness: 0.7, harmonicContent: 0.6, tempoModifier: 1.05, groove: 0.7 },
                'scottish': { brightness: 0.6, harmonicContent: 0.6, tempoModifier: 1.0, groove: 0.6 },
                'spanish': { brightness: 0.8, harmonicContent: 0.8, tempoModifier: 1.1, groove: 0.8 },
                'italian': { brightness: 0.7, harmonicContent: 0.7, tempoModifier: 1.05, groove: 0.7 },
                'french': { brightness: 0.6, harmonicContent: 0.7, tempoModifier: 0.95, groove: 0.6 },
                'german': { brightness: 0.5, harmonicContent: 0.6, tempoModifier: 0.95, groove: 0.5 },
                'japanese': { brightness: 0.6, harmonicContent: 0.8, tempoModifier: 1.0, groove: 0.6 },
                'chinese': { brightness: 0.7, harmonicContent: 0.8, tempoModifier: 1.0, groove: 0.7 },
                'indian': { brightness: 0.8, harmonicContent: 0.9, tempoModifier: 1.0, groove: 0.8 },
                'african': { brightness: 0.8, harmonicContent: 0.7, tempoModifier: 1.1, groove: 0.9 },
                'brazilian': { brightness: 0.9, harmonicContent: 0.8, tempoModifier: 1.15, groove: 0.9 },
                'cuban': { brightness: 0.8, harmonicContent: 0.8, tempoModifier: 1.1, groove: 0.9 },
                'jamaican': { brightness: 0.7, harmonicContent: 0.7, tempoModifier: 0.85, groove: 0.9 },
                'arabic': { brightness: 0.7, harmonicContent: 0.9, tempoModifier: 1.0, groove: 0.7 },
                'turkish': { brightness: 0.7, harmonicContent: 0.8, tempoModifier: 1.05, groove: 0.7 },
                'greek': { brightness: 0.8, harmonicContent: 0.7, tempoModifier: 1.05, groove: 0.7 },
                'nordic': { brightness: 0.4, harmonicContent: 0.6, tempoModifier: 0.9, groove: 0.5 },
                'eastern': { brightness: 0.7, harmonicContent: 0.9, tempoModifier: 1.0, groove: 0.7 }
            },
            
            // Rhythmic pattern descriptors
            rhythm: {
                'steady': { variation: 0.1, complexity: 0.3 },
                'complex': { variation: 0.8, complexity: 0.9 },
                'simple': { variation: 0.2, complexity: 0.2 },
                'syncopated': { variation: 0.7, complexity: 0.8, syncopation: 0.9 },
                'straight': { variation: 0.1, complexity: 0.2, syncopation: 0.0 },
                'shuffled': { variation: 0.5, complexity: 0.6, swing: 0.6 },
                'loopy': { variation: 0.3, complexity: 0.4, groove: 0.8 },
                'choppy': { variation: 0.8, complexity: 0.7, groove: 0.6 },
                'flowing': { variation: 0.3, complexity: 0.4, groove: 0.7 },
                'staccato': { variation: 0.6, complexity: 0.5, groove: 0.4 },
                'legato': { variation: 0.2, complexity: 0.3, groove: 0.6 },
                'pulsing': { variation: 0.4, complexity: 0.5, groove: 0.8 },
                'driving': { variation: 0.3, complexity: 0.6, groove: 0.8 },
                'hypnotic': { variation: 0.2, complexity: 0.3, groove: 0.9 },
                'erratic': { variation: 0.9, complexity: 0.9, groove: 0.4 },
                'mechanical': { variation: 0.1, complexity: 0.3, groove: 0.3 },
                'organic': { variation: 0.6, complexity: 0.6, groove: 0.8 },
                'polyrhythmic': { variation: 0.9, complexity: 0.95, groove: 0.7 }
            },
            
            // Mood descriptors
            mood: {
                'bright': { brightness: 0.9, harmonicContent: 0.8 },
                'dark': { brightness: 0.2, harmonicContent: 0.3 },
                'warm': { brightness: 0.6, harmonicContent: 0.7 },
                'cool': { brightness: 0.4, harmonicContent: 0.5 },
                'happy': { brightness: 0.8, harmonicContent: 0.8 },
                'sad': { brightness: 0.3, harmonicContent: 0.4 },
                'aggressive': { brightness: 0.7, harmonicContent: 0.9, distortion: 0.6 },
                'smooth': { brightness: 0.5, harmonicContent: 0.6, distortion: 0.1 },
                'melancholy': { brightness: 0.3, harmonicContent: 0.5, energy: 0.3 },
                'joyful': { brightness: 0.85, harmonicContent: 0.8, energy: 0.8 },
                'mysterious': { brightness: 0.3, harmonicContent: 0.7, energy: 0.4 },
                'uplifting': { brightness: 0.8, harmonicContent: 0.7, energy: 0.7 },
                'dreamy': { brightness: 0.6, harmonicContent: 0.8, energy: 0.4 },
                'nostalgic': { brightness: 0.5, harmonicContent: 0.6, energy: 0.4 },
                'ethereal': { brightness: 0.7, harmonicContent: 0.9, energy: 0.3 },
                'haunting': { brightness: 0.2, harmonicContent: 0.7, energy: 0.4 },
                'playful': { brightness: 0.8, harmonicContent: 0.7, energy: 0.7 },
                'serious': { brightness: 0.4, harmonicContent: 0.6, energy: 0.5 },
                'romantic': { brightness: 0.6, harmonicContent: 0.8, energy: 0.5 },
                'dramatic': { brightness: 0.6, harmonicContent: 0.8, energy: 0.8 }
            },
            
            // Texture/Timbre descriptors
            texture: {
                'crisp': { brightness: 0.8, harmonicContent: 0.7, dynamics: 0.7 },
                'muddy': { brightness: 0.3, harmonicContent: 0.4, dynamics: 0.5 },
                'crystalline': { brightness: 0.9, harmonicContent: 0.8, dynamics: 0.6 },
                'rough': { brightness: 0.5, harmonicContent: 0.7, dynamics: 0.8 },
                'silky': { brightness: 0.6, harmonicContent: 0.7, dynamics: 0.5 },
                'gritty': { brightness: 0.4, harmonicContent: 0.6, dynamics: 0.8 },
                'polished': { brightness: 0.7, harmonicContent: 0.8, dynamics: 0.6 },
                'raw': { brightness: 0.5, harmonicContent: 0.5, dynamics: 0.8 },
                'clean': { brightness: 0.7, harmonicContent: 0.6, dynamics: 0.6 },
                'dirty': { brightness: 0.4, harmonicContent: 0.7, dynamics: 0.7 },
                'metallic': { brightness: 0.8, harmonicContent: 0.9, dynamics: 0.7 },
                'wooden': { brightness: 0.4, harmonicContent: 0.6, dynamics: 0.6 },
                'glassy': { brightness: 0.9, harmonicContent: 0.8, dynamics: 0.5 },
                'fuzzy': { brightness: 0.5, harmonicContent: 0.8, dynamics: 0.7 },
                'sharp': { brightness: 0.8, harmonicContent: 0.6, dynamics: 0.8 },
                'soft': { brightness: 0.5, harmonicContent: 0.7, dynamics: 0.4 }
            },
            
            // Dynamics descriptors
            dynamics: {
                'loud': { amplitude: 0.9, compression: 0.3 },
                'soft': { amplitude: 0.4, compression: 0.1 },
                'punchy': { amplitude: 0.8, compression: 0.7, attack: 0.9 },
                'subtle': { amplitude: 0.5, compression: 0.2, attack: 0.3 },
                'powerful': { amplitude: 0.85, compression: 0.6, attack: 0.8 },
                'delicate': { amplitude: 0.4, compression: 0.1, attack: 0.2 }
            },
            
        };
        
        console.log('🎵 PromptAnalyzer initialized with musical descriptors');
    }
    
    analyzePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return this.getDefaultStyle();
        }
        
        const lowercasePrompt = prompt.toLowerCase();
        const analysis = {
            energy: 0.5,        // Default moderate energy
            groove: 0.5,        // Default moderate groove
            brightness: 0.5,    // Default neutral brightness
            complexity: 0.5,    // Default moderate complexity
            syncopation: 0.3,   // Default light syncopation
            swing: 0.0,         // Default straight timing
            amplitude: 0.7,     // Default good volume
            tempoModifier: 1.0, // Default tempo unchanged
            dynamics: 0.6,      // Default moderate dynamics
            harmonicContent: 0.6, // Default moderate harmonics
            variation: 0.4,     // Default moderate variation
            descriptors: [],    // Track which descriptors were found
            originalPrompt: prompt
        };
        
        // Analyze each category
        Object.keys(this.descriptors).forEach(category => {
            Object.keys(this.descriptors[category]).forEach(descriptor => {
                if (lowercasePrompt.includes(descriptor)) {
                    console.log(`🎼 Found descriptor: "${descriptor}" (${category})`);
                    analysis.descriptors.push({ category, descriptor });
                    
                    // Apply the descriptor's properties
                    const properties = this.descriptors[category][descriptor];
                    Object.keys(properties).forEach(prop => {
                        if (analysis.hasOwnProperty(prop)) {
                            // Blend values rather than overwrite
                            analysis[prop] = (analysis[prop] + properties[prop]) / 2;
                        } else {
                            analysis[prop] = properties[prop];
                        }
                    });
                }
            });
        });
        
        // Log the final analysis
        console.log('🎵 Prompt analysis complete:', {
            descriptors: analysis.descriptors.map(d => d.descriptor),
            energy: analysis.energy.toFixed(2),
            groove: analysis.groove.toFixed(2),
            tempoModifier: analysis.tempoModifier.toFixed(2)
        });
        
        return analysis;
    }
    
    getDefaultStyle() {
        return {
            energy: 0.5,
            groove: 0.5,
            brightness: 0.5,
            complexity: 0.5,
            syncopation: 0.3,
            swing: 0.0,
            amplitude: 0.7,
            tempoModifier: 1.0,
            dynamics: 0.6,
            harmonicContent: 0.6,
            variation: 0.4,
            descriptors: [],
            originalPrompt: ''
        };
    }
    
    // Get instrument-specific adjustments
    getInstrumentAdjustments(instrument, analysis) {
        const adjustments = { ...analysis };
        
        switch (instrument) {
            case 'drums':
                // Drums respond more to energy and groove
                adjustments.energy *= 1.2;
                adjustments.groove *= 1.1;
                break;
                
            case 'bass':
                // Bass responds more to groove and less to brightness
                adjustments.groove *= 1.3;
                adjustments.brightness *= 0.7;
                break;
                
            case 'lead_guitar':
                // Lead guitar responds more to brightness and harmonics
                adjustments.brightness *= 1.2;
                adjustments.harmonicContent *= 1.1;
                break;
                
            case 'piano':
                // Piano is balanced but responds well to dynamics
                adjustments.dynamics *= 1.1;
                break;
                
            case 'strings':
                // Strings respond well to mood and harmonics
                adjustments.harmonicContent *= 1.2;
                adjustments.brightness *= 1.1;
                break;
        }
        
        return adjustments;
    }
}

module.exports = { PromptAnalyzer };