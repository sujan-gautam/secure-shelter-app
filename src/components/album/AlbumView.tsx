import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Heart, MoreVertical, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMusicSearch } from '@/hooks/useMusicSearch';
import { Track } from '@/types/music';
import { formatDuration } from '@/lib/utils';

interface AlbumViewProps {
  albumTitle: string;
  artist: string;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
}

export const AlbumView = ({
  albumTitle,
  artist,
  onBack,
  onPlayTrack,
  onToggleFavorite,
  isFavorite,
}: AlbumViewProps) => {
  const { search, results, loading } = useMusicSearch();
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    const fetchAlbumTracks = async () => {
      // Search for tracks from this album
      await search(`${albumTitle} ${artist}`, ['jamendo', 'audius', 'ytmusic']);
    };

    fetchAlbumTracks();
  }, [albumTitle, artist]);

  useEffect(() => {
    if (results.length > 0) {
      setTracks(results);
    }
  }, [results]);

  const albumCover = tracks[0]?.artworkUrl;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Album Cover */}
          <div className="w-full md:w-48 lg:w-64 aspect-square flex-shrink-0">
            {albumCover ? (
              <img
                src={albumCover}
                alt={albumTitle}
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                <Play className="h-16 w-16 md:h-24 md:w-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="flex flex-col justify-end">
            <p className="text-xs md:text-sm text-muted-foreground mb-2">Album</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {albumTitle}
            </h1>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <span className="font-semibold">{artist}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{tracks.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <Card className="p-4 md:p-6 bg-card/30 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tracks found for this album
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 pb-2 mb-2 text-sm text-muted-foreground border-b border-border/50">
              <div className="w-8">#</div>
              <div>Title</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
              </div>
              <div className="w-20"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-4 p-3 md:p-4 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  {/* Track Number / Play Button */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="group-hover:hidden text-muted-foreground text-sm">
                      {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden group-hover:flex h-8 w-8"
                      onClick={() => onPlayTrack(track)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Track Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {track.artworkUrl && (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {track.title}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {track.artists.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="hidden md:flex items-center text-sm text-muted-foreground">
                    {formatDuration(track.durationSec)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToggleFavorite(track)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite(track.id)
                            ? 'fill-primary text-primary'
                            : ''
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hidden md:flex"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
