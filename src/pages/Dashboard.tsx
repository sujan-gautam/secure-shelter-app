import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PlayerBar } from '@/components/player/PlayerBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music2, Search, Library, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Search feature coming soon!');
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
        <div className="text-center py-20">
          <Music2 className="h-24 w-24 mx-auto mb-6 text-primary opacity-50" />
          <h2 className="text-3xl font-bold mb-3">Welcome to OpenBeats</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Your music library is empty. Start exploring free music!
          </p>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Search className="mr-2 h-5 w-5" />
            Browse Music
          </Button>
        </div>
      </main>

      {/* Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        progress={progress}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrevious={() => toast.info('Previous track')}
        onNext={() => toast.info('Next track')}
        onVolumeChange={setVolume}
        onProgressChange={setProgress}
      />
    </div>
  );
};

export default Dashboard;
