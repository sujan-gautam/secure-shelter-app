import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ListeningStats {
  totalPlays: number;
  totalListeningTime: number;
  topArtists: { artist: string; plays: number }[];
  topTracks: { 
    title: string; 
    artists: string[]; 
    plays: number;
    artworkUrl?: string;
    trackId: string;
  }[];
  recentlyPlayed: {
    title: string;
    artists: string[];
    artworkUrl?: string;
    playedAt: string;
    trackId: string;
  }[];
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch listening history with track metadata
      const { data: history, error } = await supabase
        .from('listening_history')
        .select(`
          duration_played_sec,
          played_at,
          track_metadata (
            id,
            title,
            artists,
            artwork_url
          )
        `)
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate statistics
      const totalPlays = history?.length || 0;
      const totalListeningTime = history?.reduce(
        (sum, item) => sum + (item.duration_played_sec || 0),
        0
      ) || 0;

      // Artist statistics
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
        .map(([artist, plays]) => ({ artist, plays }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10);

      // Track statistics
      const trackMap = new Map<string, {
        title: string;
        artists: string[];
        plays: number;
        artworkUrl?: string;
        trackId: string;
      }>();

      history?.forEach((item: any) => {
        const track = item.track_metadata;
        if (track) {
          const existing = trackMap.get(track.id);
          if (existing) {
            existing.plays += 1;
          } else {
            trackMap.set(track.id, {
              title: track.title,
              artists: track.artists,
              plays: 1,
              artworkUrl: track.artwork_url,
              trackId: track.id,
            });
          }
        }
      });

      const topTracks = Array.from(trackMap.values())
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10);

      // Recently played (unique tracks)
      const recentlyPlayed = history
        ?.filter((item: any, index, self) => 
          item.track_metadata && 
          index === self.findIndex((t: any) => 
            t.track_metadata?.id === item.track_metadata.id
          )
        )
        .slice(0, 20)
        .map((item: any) => ({
          title: item.track_metadata.title,
          artists: item.track_metadata.artists,
          artworkUrl: item.track_metadata.artwork_url,
          playedAt: item.played_at,
          trackId: item.track_metadata.id,
        })) || [];

      setStats({
        totalPlays,
        totalListeningTime,
        topArtists,
        topTracks,
        recentlyPlayed,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return { stats, loading, refresh: fetchAnalytics };
};
