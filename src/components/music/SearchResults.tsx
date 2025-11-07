import { Track } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Play, Heart, Music2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlaylistDialog } from './PlaylistDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

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
  const [activeTab, setActiveTab] = useState('all');

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

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'jamendo': return { icon: '🎸', name: 'Jamendo' };
      case 'fma': return { icon: '🎹', name: 'FMA' };
      case 'audius': return { icon: '🎧', name: 'Audius' };
      case 'ytmusic': return { icon: '▶️', name: 'YouTube Music' };
      default: return { icon: '🎵', name: source };
    }
  };

  if (tracks.length === 0) {
    return null;
  }

  const sources = Array.from(new Set(tracks.map(t => t.source)));
  const filteredTracks = activeTab === 'all' 
    ? tracks 
    : tracks.filter(t => t.source === activeTab);

  const renderTrackList = (trackList: Track[]) => (
    <div className="space-y-2">
      {trackList.map((track) => (
        <div
          key={track.id}
          className="group bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-3 md:p-4 hover:bg-card/50 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-2 md:gap-4">
            {/* Artwork */}
            <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0">
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
              <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2 mb-1">
                <h4 className="font-semibold text-sm md:text-base text-foreground truncate flex-1">
                  {track.title}
                </h4>
                <Badge variant="outline" className={`shrink-0 text-xs ${getSourceColor(track.source)} w-fit`}>
                  {track.source.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                {track.artists.join(', ')}
              </p>
              
              {track.albumTitle && (
                <p className="hidden md:block text-xs text-muted-foreground/70 truncate">
                  {track.albumTitle}
                </p>
              )}
            </div>

            {/* Duration - Hidden on mobile */}
            <div className="hidden md:block text-sm text-muted-foreground shrink-0">
              {formatDuration(track.durationSec)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10"
                onClick={() => onToggleFavorite(track)}
              >
                <Heart className={isFavorite(track.id) ? "h-3.5 w-3.5 md:h-4 md:w-4 fill-primary text-primary" : "h-3.5 w-3.5 md:h-4 md:w-4"} />
              </Button>
              <div className="hidden md:block">
                <PlaylistDialog track={track} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Music2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold">
            {filteredTracks.length} {filteredTracks.length === 1 ? 'Track' : 'Tracks'}
          </h2>
        </div>
        
        <TabsList className="bg-card/50 border border-border/50 w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 text-xs md:text-sm whitespace-nowrap">
            All Sources
          </TabsTrigger>
          {sources.map(source => {
            const { icon, name } = getSourceLabel(source);
            return (
              <TabsTrigger 
                key={source} 
                value={source}
                className="data-[state=active]:bg-primary/20 text-xs md:text-sm whitespace-nowrap"
              >
                <span className="mr-1">{icon}</span>
                <span className="hidden sm:inline">{name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="mt-0">
        {renderTrackList(filteredTracks)}
      </TabsContent>
    </Tabs>
  );
};
