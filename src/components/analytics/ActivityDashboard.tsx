import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListeningStats } from './ListeningStats';
import { RecommendedTracks } from './RecommendedTracks';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Loader2, BarChart3, Sparkles } from 'lucide-react';
import { Track } from '@/types/music';

interface ActivityDashboardProps {
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  onArtistClick?: (artist: string) => void;
}

export const ActivityDashboard = ({
  onPlayTrack,
  onToggleFavorite,
  isFavorite,
  onArtistClick,
}: ActivityDashboardProps) => {
  const { stats, loading: statsLoading } = useAnalytics();
  const { recommendations, loading: recsLoading } = useRecommendations();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
        <p className="text-muted-foreground">
          Start listening to music to see your stats and get recommendations
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4 md:mb-8">
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Your Stats
        </TabsTrigger>
        <TabsTrigger value="recommendations" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          For You
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <ListeningStats 
          stats={stats} 
          onPlayTrack={onPlayTrack}
          onArtistClick={onArtistClick}
        />
      </TabsContent>

      <TabsContent value="recommendations">
        {recsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <RecommendedTracks
            tracks={recommendations}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
