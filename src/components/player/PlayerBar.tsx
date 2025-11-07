import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RepeatMode } from '@/hooks/useQueue';

interface PlayerBarProps {
  currentTrack: any | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isFavorite: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (value: number) => void;
  onProgressChange: (value: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: () => void;
}

export const PlayerBar = ({
  currentTrack,
  isPlaying,
  volume,
  progress,
  shuffle,
  repeat,
  isFavorite,
  onPlayPause,
  onPrevious,
  onNext,
  onVolumeChange,
  onProgressChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
}: PlayerBarProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50">
      <div className="px-2 md:px-4 py-2 md:py-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
          <span className="text-xs text-muted-foreground w-10 md:w-12 text-right">
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={currentTrack.durationSec || 100}
            step={1}
            onValueChange={(value) => onProgressChange(value[0])}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10 md:w-12">
            {formatTime(currentTrack.durationSec || 0)}
          </span>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentTrack.artworkUrl && (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate">{currentTrack.title}</h4>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artists.join(', ')}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0"
              onClick={onToggleFavorite}
            >
              <Heart className={isFavorite ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"} />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mx-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleShuffle}
              className={shuffle ? "text-primary" : ""}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onPrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 bg-gradient-primary hover:opacity-90"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext}>
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleRepeat}
              className={repeat !== 'off' ? "text-primary" : ""}
            >
              {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(value) => onVolumeChange(value[0])}
              className="w-32"
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-2">
          {/* Track Info + Favorite */}
          <div className="flex items-center gap-2">
            {currentTrack.artworkUrl && (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-foreground truncate">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artists.join(', ')}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-9 w-9"
              onClick={onToggleFavorite}
            >
              <Heart className={isFavorite ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={onToggleShuffle}
            >
              <Shuffle className={shuffle ? "h-3.5 w-3.5 text-primary" : "h-3.5 w-3.5"} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onPrevious}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 bg-gradient-primary hover:opacity-90"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNext}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={onToggleRepeat}
            >
              {repeat === 'one' ? 
                <Repeat1 className="h-3.5 w-3.5 text-primary" /> : 
                <Repeat className={repeat === 'all' ? "h-3.5 w-3.5 text-primary" : "h-3.5 w-3.5"} />
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
