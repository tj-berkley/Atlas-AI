# Atlas AI Navigation Platform

A comprehensive Waze-like navigation platform powered by Google Gemini AI, featuring real-time traffic updates, community reporting, route optimization, and Google Drive integration.

## Features

### AI-Powered Chat Assistant
- Powered by Google Gemini 2.5 Flash with Google Search grounding
- Location-aware responses and recommendations
- Ask about routes, places, traffic conditions, and local information
- Voice navigation support with text-to-speech

### Advanced Navigation System
- Real-time route calculation with traffic awareness
- Distance and duration estimation
- Recent routes history with favorites
- Turn-by-turn navigation steps
- Traffic level indicators (light, moderate, heavy)
- Community reports impact traffic calculations

### Community Reporting (Waze-like)
- Report road incidents: accidents, hazards, police, traffic jams, construction, road closures
- Upvote/downvote reports for accuracy
- Severity levels (low, medium, high, critical)
- Reports auto-expire after 4 hours
- Nearby reports with distance filtering

### Google Drive Integration
- Connect Google Drive account
- Backup chat history and routes
- Upload and manage files
- Sync navigation data across devices

### Real-Time Features
- Continuous GPS tracking
- Live location updates
- Location-based AI responses
- Nearby reports discovery

### Voice Navigation
- Text-to-speech announcements
- Route information spoken aloud
- Toggle voice on/off

## Technology Stack

- **React 19.2.4** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Google Gemini AI** for chat
- **Supabase** for backend and database
- **Google Drive API** for cloud storage
- **Lucide React** for icons

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key
- Google Cloud project (optional, for Drive)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id (optional)
```

3. Run the app:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Database Schema

The app uses Supabase with the following tables:

- **users** - User profiles and settings
- **chat_history** - AI conversation logs
- **routes** - Saved navigation routes
- **community_reports** - Incident reports
- **saved_places** - Home, work, custom locations
- **traffic_data** - Real-time traffic information
- **report_votes** - Community voting on reports

All tables have Row Level Security (RLS) enabled for data protection.

## Usage Guide

### Navigation
1. Enable location sharing
2. Click "Navigate" tab
3. Enter destination
4. View route details
5. Start navigation

### Community Reports
1. Click "Reports" tab
2. View nearby incidents or create new report
3. Select incident type and severity
4. Add description and submit
5. Vote on existing reports

### Google Drive
1. Click "Drive" tab
2. Connect Google account
3. Upload files or view backups

## Architecture

The application follows a modular architecture:

- **Services**: Gemini AI, navigation calculations, community features, Google Drive
- **Components**: Reusable UI components for navigation, reports, and drive
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Security**: Row Level Security, OAuth, secure API keys

## Future Enhancements

- Map visualization with Mapbox/Google Maps
- Turn-by-turn voice guidance
- Multi-stop route planning
- Traffic prediction with ML
- Offline mode
- Push notifications
- Social features
- Parking availability
- EV charging stations

## License

MIT License

---

**Atlas AI Navigation - Drive smarter with AI**
