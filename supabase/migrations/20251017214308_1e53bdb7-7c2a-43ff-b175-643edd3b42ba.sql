-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{"crossfadeSec": 3, "eqBands": [0,0,0,0,0,0,0,0,0,0], "offlineCacheAllowed": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Track metadata cache
CREATE TABLE public.track_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'jamendo', 'fma', 'audius', 'ytmusic'
  source_track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artists TEXT[] NOT NULL,
  album_title TEXT,
  album_id TEXT,
  duration_sec INTEGER,
  artwork_url TEXT,
  license TEXT,
  raw_data JSONB,
  last_fetched TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source, source_track_id)
);

-- Playlist tracks (junction table)
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.track_metadata(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- User favorites
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.track_metadata(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Listening history
CREATE TABLE public.listening_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.track_metadata(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_played_sec INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Playlists policies
CREATE POLICY "Users can view public playlists"
  ON public.playlists FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = owner_id);

-- Track metadata policies (public read, authenticated write for caching)
CREATE POLICY "Anyone can view track metadata"
  ON public.track_metadata FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert track metadata"
  ON public.track_metadata FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update track metadata"
  ON public.track_metadata FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Playlist tracks policies
CREATE POLICY "Users can view tracks in accessible playlists"
  ON public.playlist_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (playlists.is_public = true OR playlists.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage tracks in own playlists"
  ON public.playlist_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.owner_id = auth.uid()
    )
  );

-- User favorites policies
CREATE POLICY "Users can view own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Listening history policies
CREATE POLICY "Users can view own history"
  ON public.listening_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own history"
  ON public.listening_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id);
CREATE INDEX idx_track_metadata_source ON public.track_metadata(source, source_track_id);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_listening_history_user ON public.listening_history(user_id);
CREATE INDEX idx_listening_history_played_at ON public.listening_history(played_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();