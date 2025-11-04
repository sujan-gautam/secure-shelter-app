import { useState, useEffect, useRef, useCallback } from 'react';
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

type DashboardView = 'home' | 'search' | 'analytics' | 'playlist';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { search, getStreamUrl, loading: searchLoading, results } = useMusicSearch();
  const queue = useQueue();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { trackPlay } = useListeningHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar] = useState(true);
  const [view, setView] = useState<DashboardView>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const lastTrackRef = useRef<Track | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextRef = useRef<() => void>(() => {});
  const handlePreviousRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume / 100;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      handleNextRef.current();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const updateMediaSession = useCallback((track: Track) => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (typeof window !== 'undefined' && 'MediaMetadata' in window) {
      mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artists.join(', '),
        album: track.albumTitle || 'Unknown Album',
        artwork: track.artworkUrl
          ? [
              { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
          : [],
      });
    }

    const actionHandlers: Array<[
      MediaSessionAction,
      MediaSessionActionHandler
    ]> = [
      [
        'play',
        () => {
          const audio = audioRef.current;
          if (audio) {
            void audio.play();
            setIsPlaying(true);
          }
        },
      ],
      [
        'pause',
        () => {
          audioRef.current?.pause();
          setIsPlaying(false);
        },
      ],
      [
        'previoustrack',
        () => {
          handlePreviousRef.current();
        },
      ],
      [
        'nexttrack',
        () => {
          handleNextRef.current();
        },
      ],
      [
        'seekto',
        (details) => {
          const audio = audioRef.current;
          if (audio && details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
            setProgress(audio.currentTime);
          }
        },
      ],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`Failed to set media session action handler for ${action}`, error);
      }
    });
  }, []);

  const performPlay = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const previousTrack = lastTrackRef.current;
      if (previousTrack && playStartTimeRef.current > 0) {
        const durationPlayed = Math.floor(audio.currentTime);
        await trackPlay(previousTrack, durationPlayed);
      }

      const streamUrl = await getStreamUrl(track.source, track.sourceTrackId);

      if (audio.src !== streamUrl) {
        audio.src = streamUrl;
      }

      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
      setProgress(0);
      playStartTimeRef.current = Date.now();
      lastTrackRef.current = track;
      updateMediaSession(track);
      toast.success(`Now playing: ${track.title}`);
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play track');
    }
  }, [getStreamUrl, trackPlay, updateMediaSession]);

  const handleSearch = async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      setActivePlaylistId(null);
      setView('search');
      setSearchQuery(searchTerm);
      await search(searchTerm);
    }
  };

  const handleSearchFromHome = async (query: string) => {
    setSearchQuery(query);
    setActivePlaylistId(null);
    setView('search');
    await search(query);
  };

  const handleArtistClick = (artist: string) => {
    setSearchQuery(artist);
    setActivePlaylistId(null);
    setView('search');
    void handleSearch(undefined, artist);
  };

  const handlePlayTrack = async (track: Track, trackQueue?: Track[]) => {
    let queueSource: Track[] = trackQueue && trackQueue.length ? trackQueue : [];

    if (!queueSource.length) {
      queueSource = results.some((result) => result.id === track.id)
        ? results
        : [track];
    }

    queue.playTrack(track, queueSource);
    await performPlay(track);
  };

  const handlePlayTrackFromPlaylist = async (track: Track, playlistTracks: Track[]) => {
    queue.playTrack(track, playlistTracks);
    await performPlay(track);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Playback resume failed:', error);
          toast.error('Unable to resume playback');
        });
    }
  };

  const handlePrevious = useCallback(() => {
    const prevTrack = queue.previous();
    if (prevTrack) {
      void performPlay(prevTrack);
    } else {
      toast.info('No previous track');
    }
  }, [queue, performPlay]);

  const handleNext = useCallback(() => {
    const nextTrack = queue.next();
    if (nextTrack) {
      void performPlay(nextTrack);
    } else {
      setIsPlaying(false);
      const audio = audioRef.current;
      if (audio) {
        if (lastTrackRef.current && playStartTimeRef.current > 0) {
          const durationPlayed = Math.floor(audio.currentTime);
          void trackPlay(lastTrackRef.current, durationPlayed);
        }
        audio.pause();
        audio.currentTime = 0;
      }
      playStartTimeRef.current = 0;
    }
  }, [queue, performPlay, trackPlay]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    handlePreviousRef.current = handlePrevious;
  }, [handlePrevious]);

  const handleProgressChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
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
    setActivePlaylistId(playlistId);
    setView('playlist');
  };

  const handleBackFromPlaylist = () => {
    setActivePlaylistId(null);
    setView('home');
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
                variant={view === 'home' ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setActivePlaylistId(null);
                  setView('home');
                }}
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant={view === 'analytics' ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setActivePlaylistId(null);
                  setView('analytics');
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
        {activePlaylistId && view === 'playlist' ? (
          <PlaylistDetailView
            playlistId={activePlaylistId}
            onBack={handleBackFromPlaylist}
            onPlayTrack={handlePlayTrackFromPlaylist}
          />
        ) : (
          <>
            {view === 'analytics' && (
              <ActivityDashboard
                onPlayTrack={handlePlayTrack}
                onArtistClick={handleArtistClick}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
            )}

            {view === 'home' && (
              <HomePage
                onPlayTrack={handlePlayTrack}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                onSearch={handleSearchFromHome}
              />
            )}

            {view === 'search' && (
              <>
                {searchLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : results.length > 0 ? (
                  <SearchResults
                    tracks={results}
                    onPlayTrack={handlePlayTrack}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={isFavorite}
                  />
                ) : (
                  searchQuery && (
                    <div className="text-center py-20">
                      <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try searching for something else
                      </p>
                    </div>
                  )
                )}
              </>
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
