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
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

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
    queue.playTrack(track, trackQueue || results);
    await playTrack(track);
  };

  const handlePlayTrackFromPlaylist = async (track: Track, playlistTracks: Track[]) => {
    setSelectedPlaylistId(null);
    setShowHome(true);
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
    <>
      <div className="min-h-screen bg-gradient-hero pb-32 flex flex-col lg:flex-row">
        {/* Mobile: Sidebar as overlay, Desktop: Fixed sidebar */}
        <div className={`
          fixed lg:static inset-0 z-50 lg:z-auto
          transform transition-transform duration-300 lg:transform-none
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {showSidebar && (
            <>
              {/* Mobile overlay backdrop */}
              <div 
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowSidebar(false)}
              />
              <div className="relative lg:static">
                <PlaylistSidebar onPlaylistSelect={handlePlaylistSelect} />
              </div>
            </>
          )}
        </div>
      
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="px-3 md:px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
            {/* Top row: Logo + Actions */}
            <div className="flex items-center justify-between md:flex-1">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden"
                >
                  <Music2 className="h-5 w-5" />
                </Button>
                <div className="bg-gradient-primary p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <Music2 className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  OpenBeats
                </h1>
              </div>

              <div className="flex items-center gap-1 md:hidden">
                <Button 
                  variant={showHome ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowHome(true);
                    setShowDashboard(false);
                  }}
                  title="Home"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button 
                  variant={showDashboard ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowDashboard(true);
                    setShowHome(false);
                  }}
                  title="Analytics"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search bar - Full width on mobile */}
            <form onSubmit={handleSearch} className="flex-1 md:max-w-2xl md:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search songs, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-9 md:h-10 bg-secondary/50 border-border/50 text-sm md:text-base"
                />
              </div>
            </form>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
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
      <main className="px-3 md:px-4 py-4 md:py-8 overflow-auto">
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
      </div>
      </div>

      {/* Player Bar - Outside main container for proper fixed positioning */}
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
};

export default Dashboard;
