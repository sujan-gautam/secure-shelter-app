import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMusicSearch } from '@/hooks/useMusicSearch';
import { useQueue } from '@/hooks/useQueue';
import { useFavorites } from '@/hooks/useFavorites';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { PlayerBar } from '@/components/player/PlayerBar';
import { SearchResults } from '@/components/music/SearchResults';
import { PlaylistSidebar } from '@/components/music/PlaylistSidebar';
import { ActivityDashboard } from '@/components/analytics/ActivityDashboard';
import { HomePage } from '@/components/home/HomePage';
import { PlaylistDetailView } from '@/components/playlist/PlaylistDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music2, Search, LogOut, Loader2, BarChart3, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Track } from '@/types/music';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { search, getStreamUrl, loading: searchLoading, results } = useMusicSearch();
  const queue = useQueue();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { trackPlay } = useListeningHistory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const playStartTimeRef = useRef<number>(0);
  
  // Player state
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

  const handleSearch = async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      setShowDashboard(false);
      setShowHome(false);
      setSearchQuery(searchTerm);
      await search(searchTerm);
    }
  };

  const handleSearchFromHome = async (query: string) => {
    setSearchQuery(query);
    setShowDashboard(false);
    setShowHome(false);
    await search(query);
  };

  const handleArtistClick = (artist: string) => {
    handleSearch(undefined, artist);
  };

  const playTrack = async (track: Track) => {
    try {
      console.log('Playing track:', track);
      
      // Track listening duration of previous track
      if (queue.currentTrack && playStartTimeRef.current > 0) {
        const durationPlayed = Math.floor(audioElement.currentTime);
        await trackPlay(queue.currentTrack, durationPlayed);
      }
      
      // Get stream URL
      const streamUrl = await getStreamUrl(track.source, track.sourceTrackId);
      console.log('Stream URL:', streamUrl);
      
      // Load and play
      audioElement.src = streamUrl;
      
      // Update Media Session API for background playback
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artists.join(', '),
          album: track.albumTitle || 'Unknown Album',
          artwork: track.artworkUrl ? [
            { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });

        navigator.mediaSession.setActionHandler('play', () => {
          audioElement.play();
          setIsPlaying(true);
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          audioElement.pause();
          setIsPlaying(false);
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNext();
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime) {
            audioElement.currentTime = details.seekTime;
          }
        });
      }
      
      await audioElement.play();
      setIsPlaying(true);
      playStartTimeRef.current = Date.now();
      toast.success(`Now playing: ${track.title}`);
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play track');
    }
  };

  const handlePlayTrack = async (track: Track, trackQueue?: Track[]) => {
    setShowDashboard(false);
    setShowHome(false);
    queue.playTrack(track, trackQueue || results);
    await playTrack(track);
  };

  const handlePlayTrackFromPlaylist = async (track: Track, playlistTracks: Track[]) => {
    setShowDashboard(false);
    setShowHome(false);
    setSelectedPlaylistId(null);
    queue.playTrack(track, playlistTracks);
    await playTrack(track);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = async () => {
    const prevTrack = queue.previous();
    if (prevTrack) {
      await playTrack(prevTrack);
    } else {
      toast.info('No previous track');
    }
  };

  const handleNext = async () => {
    const nextTrack = queue.next();
    if (nextTrack) {
      await playTrack(nextTrack);
    } else {
      setIsPlaying(false);
      audioElement.pause();
    }
  };

  const handleProgressChange = (value: number) => {
    audioElement.currentTime = value;
    setProgress(value);
  };

  const handleToggleFavorite = async (track: Track) => {
    await toggleFavorite(track);
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

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowDashboard(false);
    setShowHome(false);
  };

  const handleBackFromPlaylist = () => {
    setSelectedPlaylistId(null);
    setShowHome(true);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-32 flex">
      {showSidebar && <PlaylistSidebar onPlaylistSelect={handlePlaylistSelect} />}
      
      <div className="flex-1 flex flex-col">
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
              <Button 
                variant={showHome ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setShowHome(true);
                  setShowDashboard(false);
                }}
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button 
                variant={showDashboard ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setShowDashboard(true);
                  setShowHome(false);
                }}
                title="Analytics"
              >
                <BarChart3 className="h-5 w-5" />
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
        {selectedPlaylistId ? (
          <PlaylistDetailView
            playlistId={selectedPlaylistId}
            onBack={handleBackFromPlaylist}
            onPlayTrack={handlePlayTrackFromPlaylist}
          />
        ) : (
          <>
            {searchLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {showHome && !searchLoading && !results.length && (
          <HomePage
            onPlayTrack={handlePlayTrack}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
            onSearch={handleSearchFromHome}
          />
        )}

        {showDashboard && !searchLoading && (
          <ActivityDashboard
            onPlayTrack={handlePlayTrack}
            onArtistClick={handleArtistClick}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
          />
        )}

        {!showDashboard && !showHome && !searchLoading && results.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching for something else
            </p>
          </div>
        )}

            {results.length > 0 && (
              <SearchResults
                tracks={results}
                onPlayTrack={handlePlayTrack}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
            )}
          </>
        )}
      </main>

      {/* Player Bar */}
      <PlayerBar
        currentTrack={queue.currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        progress={progress}
        shuffle={queue.shuffle}
        repeat={queue.repeat}
        isFavorite={queue.currentTrack ? isFavorite(queue.currentTrack.id) : false}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onVolumeChange={setVolume}
        onProgressChange={handleProgressChange}
        onToggleShuffle={queue.toggleShuffle}
        onToggleRepeat={queue.toggleRepeat}
        onToggleFavorite={() => queue.currentTrack && handleToggleFavorite(queue.currentTrack)}
      />
      </div>
    </div>
  );
};

export default Dashboard;
