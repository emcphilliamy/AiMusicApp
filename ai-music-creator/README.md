# AI Music Creator

## Quick Start

1. **First time setup** (if you haven't run the setup script):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start the application**:
   ```bash
   ./start.sh
   ```

3. **Open your browser** to http://localhost:3000

## Manual Start

If you prefer to start servers manually:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

## Adding AI Features

1. Sign up for free API keys:
   - [Hugging Face](https://huggingface.co/settings/tokens) (free)
   - [Replicate](https://replicate.com/account/api-tokens) (pay-per-use)

2. Add your keys to `backend/.env`:
   ```
   HUGGINGFACE_API_KEY=your_token_here
   REPLICATE_API_TOKEN=your_token_here
   ```

3. Restart the backend server

## Features

- 🎵 Generate music from text descriptions
- 🎤 Record and process hummed melodies  
- 📁 Upload and edit audio files
- 🎛️ Mix multiple tracks with effects
- 💾 Save and export projects
- 🎨 Modern, intuitive interface

## Next Steps

- Check out the full setup instructions in the artifacts
- Explore the backend API endpoints
- Customize the UI components
- Add more audio effects and features
- Deploy to the cloud when ready

Happy music making! 🎶
