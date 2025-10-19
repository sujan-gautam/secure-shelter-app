import { Track } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Play, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlaylistDialog } from './PlaylistDialog';

interface SearchResultsProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
}

export const SearchResults = ({ 
  tracks, 
  onPlayTrack,
  onToggleFavorite,
  isFavorite
}: SearchResultsProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'jamendo': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'fma': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'audius': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'ytmusic': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="group bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/50 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-4">
            {/* Artwork */}
            <div className="relative w-16 h-16 shrink-0">
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-muted rounded flex items-center justify-center text-2xl">🎵</div>';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-muted rounded flex items-center justify-center text-2xl">
                  🎵
                </div>
              )}
              
              {/* Play button overlay */}
              <button
                onClick={() => onPlayTrack(track)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center"
              >
                <Play className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h4 className="font-semibold text-foreground truncate flex-1">
                  {track.title}
                </h4>
                <Badge variant="outline" className={`shrink-0 ${getSourceColor(track.source)}`}>
                  {track.source.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground truncate mb-1">
                {track.artists.join(', ')}
              </p>
              
              {track.albumTitle && (
                <p className="text-xs text-muted-foreground/70 truncate">
                  {track.albumTitle}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="text-sm text-muted-foreground shrink-0">
              {formatDuration(track.durationSec)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(track)}
              >
                <Heart className={isFavorite(track.id) ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
              </Button>
              <PlaylistDialog track={track} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
