import { Card } from '@/components/ui/card';
import { Music2, Clock, TrendingUp, Headphones } from 'lucide-react';
import { ListeningStats as Stats } from '@/hooks/useAnalytics';

interface ListeningStatsProps {
  stats: Stats;
}

export const ListeningStats = ({ stats }: ListeningStatsProps) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Plays</p>
              <p className="text-3xl font-bold mt-1">{stats.totalPlays}</p>
            </div>
            <div className="p-3 bg-primary/20 rounded-lg">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Listening Time</p>
              <p className="text-3xl font-bold mt-1">
                {formatTime(stats.totalListeningTime)}
              </p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <Clock className="h-6 w-6 text-secondary-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Top Artists</p>
              <p className="text-3xl font-bold mt-1">{stats.topArtists.length}</p>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique Tracks</p>
              <p className="text-3xl font-bold mt-1">{stats.topTracks.length}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Music2 className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Artists */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Artists
        </h3>
        <div className="space-y-3">
          {stats.topArtists.slice(0, 5).map((artist, index) => (
            <div key={artist.artist} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground/50 w-8">
                  {index + 1}
                </span>
                <span className="font-medium">{artist.artist}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {artist.plays} plays
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Tracks */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Music2 className="h-5 w-5 text-primary" />
          Most Played Tracks
        </h3>
        <div className="space-y-4">
          {stats.topTracks.slice(0, 5).map((track, index) => (
            <div key={track.trackId} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-muted-foreground/50 w-8">
                {index + 1}
              </span>
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artists.join(', ')}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {track.plays} plays
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
