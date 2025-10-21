import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Track } from '@/types/music';

export const useRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const generateRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's listening history
      const { data: history, error: historyError } = await supabase
        .from('listening_history')
        .select(`
          track_metadata (
            id,
            artists,
            album_title,
            source
          )
        `)
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      // Extract favorite artists
      const artistMap = new Map<string, number>();
      history?.forEach((item: any) => {
        const track = item.track_metadata;
        if (track?.artists) {
          track.artists.forEach((artist: string) => {
            artistMap.set(artist, (artistMap.get(artist) || 0) + 1);
          });
        }
      });

      const topArtists = Array.from(artistMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artist]) => artist);

      // Get recently played track IDs to exclude
      const recentTrackIds = new Set(
        history
          ?.map((item: any) => item.track_metadata?.id)
          .filter(Boolean) || []
      );

      // Find similar tracks based on artists
      const { data: similarTracks, error: similarError } = await supabase
        .from('track_metadata')
        .select('*')
        .overlaps('artists', topArtists)
        .limit(50);

      if (similarError) throw similarError;

      // Filter out recently played and convert to Track format
      const recommended = (similarTracks || [])
        .filter((track) => !recentTrackIds.has(track.id))
        .slice(0, 20)
        .map((track) => ({
          id: `${track.source}-${track.source_track_id}`,
          source: track.source as 'jamendo' | 'fma' | 'audius' | 'ytmusic',
          sourceTrackId: track.source_track_id,
          title: track.title,
          artists: track.artists,
          albumTitle: track.album_title || undefined,
          albumId: track.album_id || undefined,
          durationSec: track.duration_sec || 0,
          artworkUrl: track.artwork_url || undefined,
          license: track.license || undefined,
          rawData: track.raw_data,
        }));

      setRecommendations(recommended);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, [user]);

  return { recommendations, loading, refresh: generateRecommendations };
};
