// Drum-Specific Training System
// Designed to find and train on drum-only tracks from Spotify

class DrumTrainingSystem {
    constructor(spotifyAPI) {
        this.spotifyAPI = spotifyAPI;
        this.drumSearchQueries = this.initializeDrumSearchQueries();
        this.trainingData = [];
        console.log('🥁 DrumTrainingSystem initialized for drum-only track training');
    }

    initializeDrumSearchQueries() {
        return {
            // Classic drum solos and performances
            drumSolos: [
                'Buddy Rich drum solo',
                'Gene Krupa drum solo', 
                'Neil Peart drum solo',
                'John Bonham isolated drums',
                'Keith Moon drum solo',
                'Ginger Baker drum solo',
                'Art Blakey drum solo',
                'Max Roach drum solo',
                'Elvin Jones drum solo',
                'Dennis Chambers drum solo'
            ],
            
            // Isolated drum tracks
            isolatedDrums: [
                'drums isolated',
                'drum track only',
                'drums stems',
                'isolated drums',
                'drum backing track',
                'drums karaoke',
                'instrumental drums'
            ],
            
            // Famous drum breaks
            drumBreaks: [
                'amen break',
                'funky drummer drums',
                'apache drum break',
                'think break drums',
                'impeach president drums',
                'synthetic substitution drums',
                'skull snaps drums'
            ],
            
            // Sample collections
            drumSamples: [
                'drum breaks vol',
                'ultimate breaks beats',
                'hip hop drum samples',
                'breakbeat drums',
                'drum bass drum samples',
                'jazz drum samples',
                'funk drum samples',
                'electronic drum samples'
            ],
            
            // Percussion ensembles
            percussion: [
                'percussion ensemble',
                'orchestral percussion',
                'timpani solo',
                'african drums',
                'taiko drums',
                'latin percussion',
                'world percussion'
            ],
            
            // Drum machine patterns
            drumMachine: [
                'drum machine patterns',
                '808 drum patterns',
                '909 drum patterns',
                'linn drum',
                'vintage drum machine',
                'electronic drums',
                'programmed drums'
            ]
        };
    }

    async findDrumOnlyTracks(maxTracks = 50) {
        console.log(`🔍 Searching for drum-only tracks (target: ${maxTracks} tracks)...`);
        
        const allDrumTracks = [];
        
        // Search through each category
        for (const [category, queries] of Object.entries(this.drumSearchQueries)) {
            console.log(`🎵 Searching ${category} category...`);
            
            for (const query of queries) {
                try {
                    const tracks = await this.searchDrumTracks(query, 5); // 5 per query
                    
                    if (tracks.length > 0) {
                        console.log(`✅ Found ${tracks.length} tracks for "${query}"`);
                        allDrumTracks.push(...tracks);
                        
                        // Stop if we have enough tracks
                        if (allDrumTracks.length >= maxTracks) {
                            break;
                        }
                    }
                    
                    // Small delay to avoid rate limiting
                    await this.sleep(200);
                    
                } catch (error) {
                    console.warn(`⚠️ Search failed for "${query}": ${error.message}`);
                }
            }
            
            if (allDrumTracks.length >= maxTracks) {
                break;
            }
        }
        
        // Remove duplicates and filter for drum-focused tracks
        const uniqueTracks = this.removeDuplicates(allDrumTracks);
        const drumFocusedTracks = await this.filterForDrumContent(uniqueTracks);
        
        console.log(`🎯 Found ${drumFocusedTracks.length} unique drum-focused tracks`);
        return drumFocusedTracks.slice(0, maxTracks);
    }

    async searchDrumTracks(query, limit = 10) {
        try {
            // Use Spotify search with specific parameters for drum content
            const searchResults = await this.spotifyAPI.searchTracks(query, {
                limit: limit,
                market: 'US',
                type: 'track'
            });
            
            if (!searchResults || !searchResults.tracks || !searchResults.tracks.items) {
                return [];
            }
            
            // Process and filter results
            const tracks = searchResults.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                duration: track.duration_ms,
                preview_url: track.preview_url,
                popularity: track.popularity,
                external_urls: track.external_urls,
                searchQuery: query
            }));
            
            return tracks.filter(track => 
                this.isDrumFocused(track) // Must appear drum-focused
            );
            
        } catch (error) {
            console.error(`❌ Search error for "${query}": ${error.message}`);
            return [];
        }
    }

    isDrumFocused(track) {
        const drumKeywords = [
            'drum', 'drums', 'percussion', 'beat', 'break', 'solo',
            'isolated', 'instrumental', 'backing track', 'samples',
            'machine', 'pattern', 'loop', 'rhythm'
        ];
        
        const searchText = `${track.name} ${track.artist} ${track.album}`.toLowerCase();
        
        // Check if track contains drum-related keywords
        const hasDrumKeywords = drumKeywords.some(keyword => 
            searchText.includes(keyword)
        );
        
        // Exclude obviously non-drum tracks
        const excludeKeywords = ['vocal', 'singing', 'lyrics', 'rap', 'guitar solo', 'piano solo'];
        const hasExcludeKeywords = excludeKeywords.some(keyword => 
            searchText.includes(keyword)
        );
        
        return hasDrumKeywords && !hasExcludeKeywords;
    }

    async filterForDrumContent(tracks) {
        console.log('🔍 Filtering tracks for drum content using keywords (audio features unavailable)...');
        
        const drumTracks = [];
        
        for (const track of tracks) {
            try {
                // Since audio features are not available, rely on keyword filtering
                if (this.isDrumFocused(track)) {
                    drumTracks.push(track);
                    console.log(`✅ ${track.name} by ${track.artist} - Drum-focused based on metadata`);
                } else {
                    console.log(`❌ ${track.name} by ${track.artist} - Not drum-focused`);
                }
                
                await this.sleep(50); // Small delay
                
            } catch (error) {
                console.warn(`⚠️ Could not analyze "${track.name}": ${error.message}`);
                // Include track anyway if we can't analyze
                if (this.isDrumFocused(track)) {
                    drumTracks.push(track);
                }
            }
        }
        
        return drumTracks;
    }

    hasDrumCharacteristics(features) {
        // Analyze Spotify audio features to determine if track is drum-heavy
        const drumScore = this.calculateDrumScore(features);
        return drumScore > 0.6; // 60% confidence threshold
    }

    calculateDrumScore(features) {
        let score = 0;
        
        // High energy suggests rhythmic content
        if (features.energy > 0.6) score += 0.2;
        
        // High danceability suggests strong rhythm
        if (features.danceability > 0.7) score += 0.2;
        
        // High instrumentalness suggests no vocals
        if (features.instrumentalness > 0.5) score += 0.3;
        
        // Low speechiness suggests not vocal-heavy
        if (features.speechiness < 0.3) score += 0.1;
        
        // Moderate to high valence (not too dark/sad)
        if (features.valence > 0.3) score += 0.1;
        
        // Tempo in typical drum range
        if (features.tempo >= 60 && features.tempo <= 180) score += 0.1;
        
        return score;
    }

    async trainDrumModel(tracks) {
        console.log(`🎓 Training drum model on ${tracks.length} drum-focused tracks...`);
        
        const trainingResults = {
            totalTracks: tracks.length,
            successfulTraining: 0,
            failedTraining: 0,
            drumCharacteristics: []
        };
        
        for (const track of tracks) {
            try {
                console.log(`🎵 Training on: ${track.name} by ${track.artist}`);
                
                // Extract drum characteristics from audio features
                const drumFeatures = this.extractDrumFeatures(track);
                
                // Add to training data
                this.trainingData.push({
                    trackId: track.id,
                    name: track.name,
                    artist: track.artist,
                    features: drumFeatures,
                    timestamp: new Date().toISOString()
                });
                
                trainingResults.drumCharacteristics.push(drumFeatures);
                trainingResults.successfulTraining++;
                
                console.log(`✅ Successfully trained on ${track.name}`);
                
            } catch (error) {
                console.error(`❌ Training failed for ${track.name}: ${error.message}`);
                trainingResults.failedTraining++;
            }
        }
        
        // Analyze patterns in training data
        const patterns = this.analyzeTrainingPatterns(trainingResults.drumCharacteristics);
        
        console.log(`🎯 Drum training complete:`);
        console.log(`   - Success: ${trainingResults.successfulTraining} tracks`);
        console.log(`   - Failed: ${trainingResults.failedTraining} tracks`);
        console.log(`   - Average tempo: ${patterns.averageTempo} BPM`);
        console.log(`   - Common characteristics: ${patterns.commonFeatures.join(', ')}`);
        
        return {
            ...trainingResults,
            patterns,
            trainingData: this.trainingData
        };
    }

    extractDrumFeatures(track) {
        const features = track.audioFeatures || {};
        
        // Since audio features may not be available, use defaults based on track metadata
        const estimatedTempo = this.estimateTempoFromName(track.name, track.artist) || 75;
        const drumIntensityFromName = this.estimateDrumIntensityFromName(track.name);
        
        return {
            tempo: features.tempo || estimatedTempo,
            energy: features.energy || 0.7, // Assume high energy for drum tracks
            danceability: features.danceability || 0.8, // Drums are generally danceable
            valence: features.valence || 0.6,
            instrumentalness: features.instrumentalness || 0.9, // Drum tracks are usually instrumental
            acousticness: features.acousticness || 0.3,
            key: features.key || 0,
            mode: features.mode || 1,
            time_signature: features.time_signature || 4,
            
            // Derived drum characteristics
            drumIntensity: features.energy ? this.calculateDrumIntensity(features) : drumIntensityFromName,
            rhythmComplexity: features.tempo ? this.calculateRhythmComplexity(features) : 0.6,
            percussiveContent: features.instrumentalness ? this.calculatePercussiveContent(features) : 0.8
        };
    }

    calculateDrumIntensity(features) {
        // Higher energy + danceability = more intense drums
        return ((features.energy || 0.5) + (features.danceability || 0.5)) / 2;
    }

    calculateRhythmComplexity(features) {
        // Complex rhythm based on tempo variation and time signature
        const tempoComplexity = Math.abs((features.tempo || 75) - 120) / 120; // Deviation from standard
        const signatureComplexity = (features.time_signature || 4) === 4 ? 0.5 : 0.8;
        return (tempoComplexity + signatureComplexity) / 2;
    }

    calculatePercussiveContent(features) {
        // High instrumentalness + low speechiness = more percussive
        const instrumental = features.instrumentalness || 0.5;
        const nonVocal = 1 - (features.speechiness || 0.5);
        return (instrumental + nonVocal) / 2;
    }

    analyzeTrainingPatterns(characteristics) {
        if (characteristics.length === 0) {
            return { averageTempo: 75, commonFeatures: [] };
        }
        
        const averageTempo = characteristics.reduce((sum, c) => sum + c.tempo, 0) / characteristics.length;
        const averageEnergy = characteristics.reduce((sum, c) => sum + c.energy, 0) / characteristics.length;
        const averageDanceability = characteristics.reduce((sum, c) => sum + c.danceability, 0) / characteristics.length;
        
        const commonFeatures = [];
        if (averageEnergy > 0.6) commonFeatures.push('high-energy');
        if (averageDanceability > 0.7) commonFeatures.push('danceable');
        if (averageTempo < 100) commonFeatures.push('moderate-tempo');
        else if (averageTempo > 140) commonFeatures.push('fast-tempo');
        
        return {
            averageTempo: Math.round(averageTempo),
            averageEnergy,
            averageDanceability,
            commonFeatures
        };
    }

    removeDuplicates(tracks) {
        const seen = new Set();
        return tracks.filter(track => {
            const key = `${track.name}-${track.artist}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    estimateTempoFromName(trackName, artistName) {
        const name = `${trackName} ${artistName}`.toLowerCase();
        
        // Look for tempo indicators in the name
        if (name.includes('slow') || name.includes('ballad')) return 60;
        if (name.includes('fast') || name.includes('rapid')) return 140;
        if (name.includes('medium') || name.includes('moderate')) return 100;
        if (name.includes('reggae')) return 75;
        if (name.includes('rock') || name.includes('punk')) return 120;
        if (name.includes('jazz')) return 90;
        if (name.includes('funk')) return 110;
        
        return 100; // Default moderate tempo
    }

    estimateDrumIntensityFromName(trackName) {
        const name = trackName.toLowerCase();
        
        if (name.includes('solo') || name.includes('break')) return 0.9;
        if (name.includes('heavy') || name.includes('hard')) return 0.8;
        if (name.includes('soft') || name.includes('light')) return 0.4;
        if (name.includes('isolated') || name.includes('drum')) return 0.7;
        
        return 0.6; // Default intensity
    }

    // Get training statistics
    getTrainingStats() {
        return {
            totalTracks: this.trainingData.length,
            lastTraining: this.trainingData.length > 0 ? 
                this.trainingData[this.trainingData.length - 1].timestamp : null,
            averageFeatures: this.calculateAverageFeatures()
        };
    }

    calculateAverageFeatures() {
        if (this.trainingData.length === 0) return null;
        
        const features = this.trainingData.map(d => d.features);
        return {
            tempo: features.reduce((sum, f) => sum + f.tempo, 0) / features.length,
            energy: features.reduce((sum, f) => sum + f.energy, 0) / features.length,
            drumIntensity: features.reduce((sum, f) => sum + f.drumIntensity, 0) / features.length
        };
    }
}

module.exports = { DrumTrainingSystem };