import { TrendingNow } from './TrendingNow';
import { RecentlyPlayed } from './RecentlyPlayed';
import { FeaturedPlaylists } from './FeaturedPlaylists';
import { RecommendedTracks } from '../analytics/RecommendedTracks';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Track } from '@/types/music';

interface HomePageProps {
  onPlayTrack: (track: any) => void;
  onToggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  onSearch: (query: string) => void;
}

export const HomePage = ({ 
  onPlayTrack, 
  onToggleFavorite, 
  isFavorite,
  onSearch 
}: HomePageProps) => {
  const { recommendations } = useRecommendations();

  const handlePlaylistClick = (query: string) => {
    onSearch(query);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Trending Now */}
      <TrendingNow onPlayTrack={onPlayTrack} />

      {/* Recently Played */}
      <RecentlyPlayed onPlayTrack={onPlayTrack} />

      {/* Featured Playlists */}
      <FeaturedPlaylists onPlaylistClick={handlePlaylistClick} />

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <section className="animate-fade-in">
          <RecommendedTracks
            tracks={recommendations}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </section>
      )}
    </div>
  );
};
