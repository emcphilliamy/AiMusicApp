# Spotify Integration Setup Guide

## 🎵 Overview

The AI Music Creator now supports Spotify user authentication to access better reggae training data. Users can connect their Spotify accounts for 1-hour sessions to improve the AI's training quality.

## 📋 Setup Instructions

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Click "Create app"
3. Fill in the details:
   - **App name**: AI Music Creator
   - **App description**: Reggae music generation with Spotify training data
   - **Website**: http://localhost:3000
   - **Redirect URI**: `http://localhost:3001/api/spotify/callback`
   - **APIs used**: Web API
4. Accept the Terms of Service and click "Save"

### 2. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp ai-music-creator/backend/.env.example ai-music-creator/backend/.env
   ```

2. Fill in your Spotify credentials in `.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_from_spotify_dashboard
   SPOTIFY_CLIENT_SECRET=your_client_secret_from_spotify_dashboard
   SPOTIFY_REDIRECT_URI=http://localhost:3001/api/spotify/callback
   PORT=3001
   ```

### 3. Start the Application

1. Start the backend:
   ```bash
   cd ai-music-creator/backend
   npm install
   node server.js
   ```

2. Start the frontend:
   ```bash
   cd ai-music-creator/frontend  
   npm install
   npm start
   ```

## 🔐 How User Authentication Works

### Authentication Flow
1. User clicks "Connect Spotify" in the UI
2. System generates a secure PKCE challenge
3. User is redirected to Spotify authorization page
4. User grants permissions to the app
5. Spotify redirects back with authorization code
6. System exchanges code for access and refresh tokens
7. User is connected for 1 hour with automatic token refresh

### Security Features
- **PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception
- **State parameter**: Prevents CSRF attacks  
- **1-hour session limit**: Automatic disconnection after 1 hour
- **Automatic token refresh**: Seamless experience during the session
- **Secure token storage**: Tokens stored in memory only, not persisted

### Required Spotify Permissions
- `user-read-private`: Basic profile information
- `user-read-email`: User's email address
- `user-library-read`: Access to user's saved tracks
- `playlist-read-private`: Access to private playlists
- `playlist-read-collaborative`: Access to collaborative playlists

## 🎯 Benefits of Spotify Connection

### Without Spotify Connection
- Uses client credentials (limited API access)
- Basic reggae search queries only
- Fewer tracks for training
- Lower training quality

### With Spotify Connection  
- Full user authentication access
- Enhanced search capabilities
- Access to user's music library
- Better rate limits
- Higher quality training data
- More diverse reggae tracks

## 📡 API Endpoints

### Authentication Endpoints
- `GET /api/spotify/status` - Check connection status
- `GET /api/spotify/auth-url` - Get authorization URL
- `GET /api/spotify/callback` - Handle OAuth callback
- `POST /api/spotify/disconnect` - Disconnect user
- `GET /api/spotify/test` - Test connection and get user info

### Training Endpoints (Enhanced with Spotify)
- `POST /api/fetch-reggae-training` - Fetch reggae tracks (uses user auth if available)
- `GET /api/training-status` - Get training status (includes Spotify status)
- `GET /api/reggae-tracks` - List available reggae tracks

## ⏰ Session Management

- **Connection Duration**: 1 hour maximum
- **Token Refresh**: Automatic every ~50 minutes
- **Disconnection**: Automatic after 1 hour or manual
- **Status Updates**: Real-time connection status in UI
- **Countdown Timer**: Shows remaining connection time

## 🛠 Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check that Client ID and Client Secret are correct
   - Ensure the Spotify app is not in development mode if needed

2. **"Invalid redirect URI" error**  
   - Verify redirect URI in Spotify dashboard matches exactly: `http://localhost:3001/api/spotify/callback`
   - Check that the port matches your backend port

3. **Connection timeout**
   - Ensure backend is running on the correct port
   - Check that firewall isn't blocking the connection

4. **Permissions denied**
   - User declined authorization
   - Try connecting again

### Testing the Connection

1. Check Spotify status:
   ```bash
   curl http://localhost:3001/api/spotify/status
   ```

2. Test after connection:
   ```bash
   curl http://localhost:3001/api/spotify/test
   ```

3. Check training status:
   ```bash
   curl http://localhost:3001/api/training-status
   ```

## 🔄 Development Notes

- Tokens are stored in memory only for security
- Server restart will require re-authentication
- The system gracefully falls back to client credentials if user auth fails
- CORS is properly configured for the frontend callback handling
- All sensitive operations are logged for debugging

## 🚀 Usage Flow

1. User opens the application
2. Sees "Connect Spotify" button if not connected
3. Clicks connect → redirected to Spotify
4. Grants permissions → redirected back to app
5. Connection established for 1 hour
6. Training data quality improves automatically
7. User can generate reggae music with better training
8. Connection automatically expires after 1 hour

The system is designed to work seamlessly whether Spotify is connected or not, with enhanced capabilities when authenticated.