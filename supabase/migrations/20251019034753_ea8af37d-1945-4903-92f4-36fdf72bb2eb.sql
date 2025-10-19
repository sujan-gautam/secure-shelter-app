-- Enable realtime for playlists and playlist_tracks tables
ALTER TABLE public.playlists REPLICA IDENTITY FULL;
ALTER TABLE public.playlist_tracks REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_tracks;