import { useState } from 'react';
import { TrendingNow } from './TrendingNow';
import { RecentlyPlayed } from './RecentlyPlayed';
import { TopAlbums } from './TopAlbums';
import { RecommendedTracks } from '../analytics/RecommendedTracks';
import { AlbumView } from '../album/AlbumView';
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
  const [selectedAlbum, setSelectedAlbum] = useState<{ title: string; artist: string } | null>(null);

  const handleAlbumClick = (albumTitle: string, artist: string) => {
    setSelectedAlbum({ title: albumTitle, artist });
  };

  const handleBackToHome = () => {
    setSelectedAlbum(null);
  };

  if (selectedAlbum) {
    return (
      <AlbumView
        albumTitle={selectedAlbum.title}
        artist={selectedAlbum.artist}
        onBack={handleBackToHome}
        onPlayTrack={onPlayTrack}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
      />
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Trending Now */}
      <TrendingNow onPlayTrack={onPlayTrack} />

      {/* Recently Played */}
      <RecentlyPlayed onPlayTrack={onPlayTrack} />

      {/* Top Albums */}
      <TopAlbums onAlbumClick={handleAlbumClick} />

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
