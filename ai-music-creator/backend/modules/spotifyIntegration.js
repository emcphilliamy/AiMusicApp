/**
 * Spotify Integration Module
 * 
 * Provides song, artist, and album analysis for prompt interpretation
 * Extracts Quality/Vibe data from Spotify's audio features API
 */

const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyIntegration {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    this.isAuthenticated = false;
    this.tokenExpiresAt = null;
  }

  /**
   * Authenticate with Spotify using client credentials flow
   */
  async authenticate() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);
      this.tokenExpiresAt = Date.now() + (data.body['expires_in'] * 1000);
      this.isAuthenticated = true;
      console.log('🎵 Spotify API authenticated');
      return true;
    } catch (error) {
      console.error('❌ Spotify authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Check if token needs refresh
   */
  async ensureAuthenticated() {
    if (!this.isAuthenticated || Date.now() >= this.tokenExpiresAt - 60000) {
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Search for tracks, artists, or albums
   */
  async search(query, types = ['track', 'artist', 'album'], limit = 10) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Spotify authentication failed');
    }

    try {
      const response = await this.spotifyApi.search(query, types, { limit });
      return response.body;
    } catch (error) {
      console.error('❌ Spotify search failed:', error.message);
      throw error;
    }
  }

  /**
   * Get audio features for multiple tracks
   */
  async getAudioFeatures(trackIds) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Spotify authentication failed');
    }

    try {
      const response = await this.spotifyApi.getAudioFeaturesForTracks(trackIds);
      return response.body.audio_features;
    } catch (error) {
      console.error('❌ Failed to get audio features:', error.message);
      throw error;
    }
  }

  /**
   * Get top tracks for an artist
   */
  async getArtistTopTracks(artistId, country = 'US') {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Spotify authentication failed');
    }

    try {
      const response = await this.spotifyApi.getArtistTopTracks(artistId, country);
      return response.body.tracks;
    } catch (error) {
      console.error('❌ Failed to get artist top tracks:', error.message);
      throw error;
    }
  }

  /**
   * Get tracks from an album
   */
  async getAlbumTracks(albumId, limit = 10) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Spotify authentication failed');
    }

    try {
      const response = await this.spotifyApi.getAlbumTracks(albumId, { limit });
      return response.body.items;
    } catch (error) {
      console.error('❌ Failed to get album tracks:', error.message);
      throw error;
    }
  }

  /**
   * Analyze a specific song and return Quality/Vibe data
   */
  async analyzeSong(songName, artistName = null) {
    try {
      const query = artistName ? `track:"${songName}" artist:"${artistName}"` : `"${songName}"`;
      const searchResults = await this.search(query, ['track'], 1);
      
      if (searchResults.tracks.items.length === 0) {
        return null;
      }

      const track = searchResults.tracks.items[0];
      const audioFeatures = await this.getAudioFeatures([track.id]);
      
      if (!audioFeatures || !audioFeatures[0]) {
        return null;
      }

      return this.extractQualityVibeData(track, audioFeatures[0]);
    } catch (error) {
      console.error(`❌ Failed to analyze song "${songName}":`, error.message);
      return null;
    }
  }

  /**
   * Analyze an artist and return weighted influence from top songs
   */
  async analyzeArtist(artistName, maxSongs = 5) {
    try {
      const searchResults = await this.search(`"${artistName}"`, ['artist'], 1);
      
      if (searchResults.artists.items.length === 0) {
        return null;
      }

      const artist = searchResults.artists.items[0];
      const topTracks = await this.getArtistTopTracks(artist.id);
      
      // Take top 3-7 songs based on popularity
      const selectedTracks = topTracks
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, Math.min(maxSongs, topTracks.length));

      if (selectedTracks.length === 0) {
        return null;
      }

      // Get audio features for selected tracks
      const trackIds = selectedTracks.map(track => track.id);
      const audioFeatures = await this.getAudioFeatures(trackIds);

      // Calculate weights based on relative popularity
      const totalPopularity = selectedTracks.reduce((sum, track) => sum + track.popularity, 0);
      
      const analyzedTracks = selectedTracks.map((track, index) => {
        const features = audioFeatures[index];
        if (!features) return null;
        
        const weight = track.popularity / totalPopularity;
        const analysis = this.extractQualityVibeData(track, features);
        
        return {
          ...analysis,
          weight,
          trackName: track.name,
          popularity: track.popularity
        };
      }).filter(Boolean);

      return {
        artistName: artist.name,
        tracks: analyzedTracks,
        totalWeight: 1.0
      };
    } catch (error) {
      console.error(`❌ Failed to analyze artist "${artistName}":`, error.message);
      return null;
    }
  }

  /**
   * Analyze an album and return weighted influence from top songs
   */
  async analyzeAlbum(albumName, artistName = null, maxSongs = 6) {
    try {
      const query = artistName ? `album:"${albumName}" artist:"${artistName}"` : `"${albumName}"`;
      const searchResults = await this.search(query, ['album'], 1);
      
      if (searchResults.albums.items.length === 0) {
        return null;
      }

      const album = searchResults.albums.items[0];
      const albumTracks = await this.getAlbumTracks(album.id, 20);
      
      // For albums, we need to get full track details to access popularity
      const trackIds = albumTracks.map(track => track.id);
      const trackDetails = await this.spotifyApi.getTracks(trackIds);
      const fullTracks = trackDetails.body.tracks;
      
      // Select tracks based on popularity, fallback to track position
      const selectedTracks = fullTracks
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, Math.min(maxSongs, fullTracks.length));

      if (selectedTracks.length === 0) {
        return null;
      }

      // Get audio features
      const selectedTrackIds = selectedTracks.map(track => track.id);
      const audioFeatures = await this.getAudioFeatures(selectedTrackIds);

      // Calculate weights - if no popularity data, use equal weights
      const hasPopularityData = selectedTracks.some(track => track.popularity > 0);
      const totalPopularity = hasPopularityData ? 
        selectedTracks.reduce((sum, track) => sum + track.popularity, 0) : 
        selectedTracks.length;

      const analyzedTracks = selectedTracks.map((track, index) => {
        const features = audioFeatures[index];
        if (!features) return null;
        
        const weight = hasPopularityData ? 
          track.popularity / totalPopularity : 
          1.0 / selectedTracks.length;
        
        const analysis = this.extractQualityVibeData(track, features);
        
        return {
          ...analysis,
          weight,
          trackName: track.name,
          popularity: track.popularity || 0
        };
      }).filter(Boolean);

      return {
        albumName: album.name,
        artistName: album.artists[0]?.name,
        tracks: analyzedTracks,
        totalWeight: 1.0
      };
    } catch (error) {
      console.error(`❌ Failed to analyze album "${albumName}":`, error.message);
      return null;
    }
  }

  /**
   * Extract Quality/Vibe data from Spotify track and audio features
   */
  extractQualityVibeData(track, audioFeatures) {
    return {
      // Quality/Vibe metrics
      energy: audioFeatures.energy,              // 0.0-1.0 (intensity/power)
      danceability: audioFeatures.danceability,  // 0.0-1.0 (how suitable for dancing)
      valence: audioFeatures.valence,            // 0.0-1.0 (musical positivity)
      acousticness: audioFeatures.acousticness,  // 0.0-1.0 (acoustic vs electronic)
      instrumentalness: audioFeatures.instrumentalness, // 0.0-1.0 (vocal vs instrumental)
      liveness: audioFeatures.liveness,          // 0.0-1.0 (live performance indicator)
      speechiness: audioFeatures.speechiness,    // 0.0-1.0 (presence of spoken words)
      
      // Technical data that's useful for generation
      tempo: audioFeatures.tempo,                // BPM
      key: audioFeatures.key,                    // 0-11 (C, C#, D, etc.)
      mode: audioFeatures.mode,                  // 0=minor, 1=major
      timeSignature: audioFeatures.time_signature, // 3, 4, 5, etc.
      loudness: audioFeatures.loudness,          // dB
      
      // Track metadata
      popularity: track.popularity || 0,         // 0-100
      duration: track.duration_ms,              // milliseconds
      explicit: track.explicit || false
    };
  }

  /**
   * Convert Spotify key number to musical key string
   */
  keyNumberToString(keyNumber) {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[keyNumber] || 'C';
  }

  /**
   * Convert mode number to string
   */
  modeNumberToString(modeNumber) {
    return modeNumber === 1 ? 'major' : 'minor';
  }
}

module.exports = { SpotifyIntegration };