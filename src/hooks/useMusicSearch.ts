import { useState } from 'react';
import { Track } from '@/types/music';

const SUPABASE_PROJECT_ID = 'zokteleyadyodflghuse';
const FUNCTIONS_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export const useMusicSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Track[]>([]);

  const search = async (query: string, sources: string[] = ['jamendo', 'fma', 'audius']) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sourcesParam = sources.join(',');
      const response = await fetch(
        `${FUNCTIONS_URL}/music-search?q=${encodeURIComponent(query)}&sources=${sourcesParam}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      // Transform to Track format
      const tracks: Track[] = data.tracks.map((track: any) => ({
        id: track.id,
        source: track.source,
        sourceTrackId: track.sourceTrackId,
        title: track.title,
        artists: track.artists,
        albumTitle: track.albumTitle,
        durationSec: track.durationSec,
        artworkUrl: track.artworkUrl,
        license: track.license,
      }));

      setResults(tracks);
      console.log(`Found ${tracks.length} tracks`);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStreamUrl = async (source: string, trackId: string): Promise<string> => {
    try {
      const response = await fetch(
        `${FUNCTIONS_URL}/get-stream-url?source=${source}&trackId=${trackId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get stream URL');
      }

      const data = await response.json();
      return data.streamUrl;
    } catch (err) {
      console.error('Stream URL error:', err);
      throw err;
    }
  };

  return {
    search,
    getStreamUrl,
    loading,
    error,
    results,
  };
};
