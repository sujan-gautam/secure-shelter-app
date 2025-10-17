import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMusicSearch } from '@/hooks/useMusicSearch';
import { PlayerBar } from '@/components/player/PlayerBar';
import { SearchResults } from '@/components/music/SearchResults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music2, Search, Library, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Track } from '@/types/music';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { search, getStreamUrl, loading: searchLoading, results } = useMusicSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [progress, setProgress] = useState(0);
  const [audioElement] = useState<HTMLAudioElement>(new Audio());

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Setup audio element
    audioElement.volume = volume / 100;
    
    audioElement.addEventListener('timeupdate', () => {
      setProgress(audioElement.currentTime);
    });

    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
      handleNext();
    });

    return () => {
      audioElement.pause();
    };
  }, []);

  useEffect(() => {
    audioElement.volume = volume / 100;
  }, [volume]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      await search(searchQuery);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      console.log('Playing track:', track);
      
      // Get stream URL
      const streamUrl = await getStreamUrl(track.source, track.sourceTrackId);
      console.log('Stream URL:', streamUrl);
      
      // Load and play
      audioElement.src = streamUrl;
      setCurrentTrack(track);
      
      await audioElement.play();
      setIsPlaying(true);
      toast.success(`Now playing: ${track.title}`);
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play track');
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    toast.info('Previous track (not implemented)');
  };

  const handleNext = () => {
    toast.info('Next track (not implemented)');
  };

  const handleProgressChange = (value: number) => {
    audioElement.currentTime = value;
    setProgress(value);
  };

  const handleAddToPlaylist = (track: Track) => {
    toast.info(`Add "${track.title}" to playlist (coming soon)`);
  };

  const handleToggleFavorite = (track: Track) => {
    toast.info(`Toggle favorite for "${track.title}" (coming soon)`);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-xl">
                <Music2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                OpenBeats
              </h1>
            </div>

            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search songs, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Library className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {searchLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!searchLoading && results.length === 0 && !searchQuery && (
          <div className="text-center py-20">
            <Music2 className="h-24 w-24 mx-auto mb-6 text-primary opacity-50" />
            <h2 className="text-3xl font-bold mb-3">Welcome to OpenBeats</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Search for free music from Jamendo, Free Music Archive, and Audius
            </p>
          </div>
        )}

        {!searchLoading && results.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Search Results</h2>
              <p className="text-muted-foreground">Found {results.length} tracks</p>
            </div>
            <SearchResults
              tracks={results}
              onPlayTrack={handlePlayTrack}
              onAddToPlaylist={handleAddToPlaylist}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </main>

      {/* Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        progress={progress}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onVolumeChange={setVolume}
        onProgressChange={handleProgressChange}
      />
    </div>
  );
};

export default Dashboard;
