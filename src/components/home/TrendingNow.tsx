import { Track } from '@/types/music';
import { Play, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingNowProps {
  onPlayTrack: (track: any, trackQueue?: Track[]) => void;
}

export const TrendingNow = ({ onPlayTrack }: TrendingNowProps) => {
  const { stats, loading } = useAnalytics();

  const handlePlayTrack = (trackData: any, allTracks: any[]) => {
    const track: Track = {
      id: trackData.trackId,
      source: trackData.source as any,
      sourceTrackId: trackData.sourceTrackId,
      title: trackData.title,
      artists: trackData.artists,
      durationSec: trackData.durationSec,
      artworkUrl: trackData.artworkUrl,
    };
    
    const trackQueue: Track[] = allTracks.map(t => ({
      id: t.trackId,
      source: t.source as any,
      sourceTrackId: t.sourceTrackId,
      title: t.title,
      artists: t.artists,
      durationSec: t.durationSec,
      artworkUrl: t.artworkUrl,
    }));
    
    onPlayTrack(track, trackQueue);
  };

  if (loading) {
    return (
      <section className="mb-12 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!stats?.topTracks.length) return null;

  const trendingTracks = stats.topTracks.slice(0, 10);

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Trending Now</h2>
        <Badge variant="secondary" className="ml-2">
          Hot 🔥
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {trendingTracks.map((track, index) => (
          <Card
            key={track.trackId}
            className="group relative overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer hover-scale bg-card/50 backdrop-blur-sm border-border/50"
            onClick={() => handlePlayTrack(track, trendingTracks)}
          >
            <div className="aspect-square relative">
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-card flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-primary rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                </div>
              </div>

              {/* Ranking Badge */}
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">#{index + 1}</span>
              </div>
            </div>

            <div className="p-3">
              <h3 className="font-semibold truncate text-sm mb-1">
                {track.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {track.artists.join(', ')}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {track.plays} plays
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
