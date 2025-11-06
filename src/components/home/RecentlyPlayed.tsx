import { useEffect, useState } from 'react';
import { Track } from '@/types/music';
import { Play, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentlyPlayedProps {
  onPlayTrack: (track: any, trackQueue?: Track[]) => void;
}

export const RecentlyPlayed = ({ onPlayTrack }: RecentlyPlayedProps) => {
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePlayTrack = (trackData: any, allTracks: any[]) => {
    const track: Track = {
      id: trackData.id,
      source: trackData.source as any,
      sourceTrackId: trackData.source_track_id,
      title: trackData.title,
      artists: trackData.artists,
      durationSec: trackData.duration_sec,
      artworkUrl: trackData.artwork_url,
      albumTitle: trackData.album_title,
    };
    
    const trackQueue: Track[] = allTracks.map(item => ({
      id: item.track_metadata.id,
      source: item.track_metadata.source as any,
      sourceTrackId: item.track_metadata.source_track_id,
      title: item.track_metadata.title,
      artists: item.track_metadata.artists,
      durationSec: item.track_metadata.duration_sec,
      artworkUrl: item.track_metadata.artwork_url,
      albumTitle: item.track_metadata.album_title,
    }));
    
    onPlayTrack(track, trackQueue);
  };

  useEffect(() => {
    loadRecentlyPlayed();
  }, []);

  const loadRecentlyPlayed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listening_history')
        .select(`
          *,
          track_metadata (*)
        `)
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      // Deduplicate by track_id, keeping most recent
      const uniqueTracks = data?.reduce((acc: any[], item) => {
        if (!acc.find(t => t.track_metadata.id === item.track_metadata.id)) {
          acc.push(item);
        }
        return acc;
      }, []) || [];

      setRecentTracks(uniqueTracks);
    } catch (error) {
      console.error('Error loading recently played:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-12 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recently Played</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!recentTracks.length) return null;

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Recently Played</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {recentTracks.map((item) => {
          const track = item.track_metadata;
          return (
            <Card
              key={item.id}
              className="group relative overflow-hidden hover:shadow-glow-accent transition-all duration-300 cursor-pointer hover-scale bg-card/30 backdrop-blur-sm border-border/50"
              onClick={() => handlePlayTrack(track, recentTracks)}
            >
              <div className="aspect-square relative">
                {track.artwork_url ? (
                  <img
                    src={track.artwork_url}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-card flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>
              </div>

              <div className="p-2">
                <h3 className="font-medium truncate text-xs">
                  {track.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artists.join(', ')}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
