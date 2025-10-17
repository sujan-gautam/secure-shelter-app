# OpenBeats - Open-Source Music Streaming Platform

Free, ad-free, privacy-focused music streaming powered by legal sources.

## 🎵 Features

- **Free & Legal Music**: Stream from Jamendo, Free Music Archive, Audius
- **Secure Authentication**: JWT-based auth via Lovable Cloud (Supabase)
- **Playlist Management**: Create, edit, and manage your playlists
- **Search & Discovery**: Find music across multiple free APIs
- **Favorites & History**: Save your favorite tracks and view listening history
- **Responsive Design**: Beautiful UI that works on all devices
- **Privacy First**: No tracking, no ads, your data stays yours

## 🏗️ Architecture

### Frontend
- **React** with TypeScript
- **Vite** for fast builds
- **TailwindCSS** for styling
- **shadcn/ui** components

### Backend (Lovable Cloud)
- **PostgreSQL** database for user data, playlists, and cached metadata
- **Edge Functions** for music API integrations
- **Row Level Security** (RLS) for data protection
- **Built-in Authentication** with JWT

## 📁 Project Structure

```
src/
├── assets/              # Images and static assets
├── components/
│   ├── player/         # Music player components
│   └── ui/             # shadcn UI components
├── hooks/
│   ├── useAuth.tsx     # Authentication hook
│   └── use-mobile.tsx  # Mobile detection
├── pages/
│   ├── Index.tsx       # Landing page
│   ├── Auth.tsx        # Login/Signup
│   ├── Dashboard.tsx   # Main app interface
│   └── NotFound.tsx    # 404 page
├── types/
│   └── music.ts        # TypeScript interfaces
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utility functions
└── integrations/
    └── supabase/       # Auto-generated Supabase types
```

## 🗄️ Database Schema

### Tables
- **profiles**: User profile data and settings
- **playlists**: User-created playlists
- **track_metadata**: Cached track information
- **playlist_tracks**: Junction table for playlist tracks
- **user_favorites**: User's favorite tracks
- **listening_history**: Play history

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public playlists are viewable by everyone

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Lovable Cloud account (automatically provided)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd openbeats
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open http://localhost:8080 in your browser

## 🔐 Security Features

- **Password Hashing**: bcrypt via Supabase Auth
- **JWT Tokens**: Secure session management
- **Row Level Security**: Database-level access control
- **HTTPS Only**: All connections encrypted
- **No Tracking**: Privacy-focused architecture

## 🎨 Design System

The app uses a beautiful dark theme with:
- **Primary**: Deep purple gradient (#8B5CF6 → #6366F1)
- **Accent**: Cyan (#06B6D4)
- **Background**: Dark navy with gradients
- **Glass morphism** effects on player controls
- **Smooth animations** throughout

## 🔌 API Integration (Coming Soon)

Future edge functions will integrate with:
- **Jamendo API**: Free music platform
- **Free Music Archive**: Public domain music
- **Audius**: Decentralized music streaming

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 🔗 Links

- [Documentation](https://docs.lovable.dev/)
- [Lovable Cloud](https://lovable.dev/)
- [Report Issues](https://github.com/your-repo/issues)

---

Built with ❤️ using [Lovable](https://lovable.dev)
