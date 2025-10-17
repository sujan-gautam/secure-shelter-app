import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PlayerBarProps {
  currentTrack: any | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (value: number) => void;
  onProgressChange: (value: number) => void;
}

export const PlayerBar = ({
  currentTrack,
  isPlaying,
  volume,
  progress,
  onPlayPause,
  onPrevious,
  onNext,
  onVolumeChange,
  onProgressChange,
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
      <div className="container mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-muted-foreground w-12 text-right">
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={currentTrack.durationSec || 100}
            step={1}
            onValueChange={(value) => onProgressChange(value[0])}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {formatTime(currentTrack.durationSec || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between">
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
            <Button variant="ghost" size="icon" className="shrink-0">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mx-8">
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
      </div>
    </div>
  );
};
