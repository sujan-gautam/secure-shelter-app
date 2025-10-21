import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Heart, Sparkles } from 'lucide-react';
import { Track } from '@/types/music';

interface RecommendedTracksProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
}

export const RecommendedTracks = ({
  tracks,
  onPlayTrack,
  onToggleFavorite,
  isFavorite,
}: RecommendedTracksProps) => {
  if (tracks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
        <p className="text-muted-foreground">
          Listen to more music to get personalized recommendations
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Recommended For You
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Based on your listening history
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <Card key={track.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="aspect-square mb-3 relative group">
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => onPlayTrack(track)}
                >
                  <Play className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => onToggleFavorite(track)}
                >
                  <Heart
                    className={
                      isFavorite(track.id)
                        ? 'h-5 w-5 fill-primary text-primary'
                        : 'h-5 w-5'
                    }
                  />
                </Button>
              </div>
            </div>
            <h4 className="font-semibold text-sm truncate mb-1">{track.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {track.artists.join(', ')}
            </p>
          </Card>
        ))}
      </div>
    </Card>
  );
};
