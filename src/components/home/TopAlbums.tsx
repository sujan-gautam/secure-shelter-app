import { useState, useEffect } from 'react';
import { Music2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useMusicSearch } from '@/hooks/useMusicSearch';

interface TopAlbumsProps {
  onAlbumClick: (albumTitle: string, artist: string) => void;
}

const FEATURED_ALBUMS = [
  { query: 'top hits 2024', title: 'Top Hits 2024', artist: 'Various Artists' },
  { query: 'best rock albums', title: 'Rock Classics', artist: 'Rock Legends' },
  { query: 'chill electronic', title: 'Chill Electronic', artist: 'Electronic Artists' },
  { query: 'jazz essentials', title: 'Jazz Essentials', artist: 'Jazz Masters' },
  { query: 'hip hop hits', title: 'Hip Hop Hits', artist: 'Hip Hop Artists' },
  { query: 'classical piano', title: 'Classical Piano', artist: 'Piano Masters' },
  { query: 'indie favorites', title: 'Indie Favorites', artist: 'Indie Artists' },
  { query: 'pop anthems', title: 'Pop Anthems', artist: 'Pop Stars' },
];

export const TopAlbums = ({ onAlbumClick }: TopAlbumsProps) => {
  const { search, results, loading } = useMusicSearch();
  const [albumCovers, setAlbumCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch artwork for each album
    const fetchAlbumCovers = async () => {
      const covers: Record<string, string> = {};
      
      for (const album of FEATURED_ALBUMS) {
        try {
          await search(album.query, ['jamendo', 'audius']);
          if (results.length > 0 && results[0].artworkUrl) {
            covers[album.query] = results[0].artworkUrl;
          }
        } catch (error) {
          console.error(`Error fetching cover for ${album.title}:`, error);
        }
      }
      
      setAlbumCovers(covers);
    };

    fetchAlbumCovers();
  }, []);

  return (
    <section className="mb-8 md:mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Music2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold">Top Albums</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
        {FEATURED_ALBUMS.map((album) => (
          <Card
            key={album.query}
            className="group relative overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer hover-scale bg-card/30 backdrop-blur-sm border-border/50"
            onClick={() => onAlbumClick(album.title, album.artist)}
          >
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              {albumCovers[album.query] ? (
                <img
                  src={albumCovers[album.query]}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Music2 className="h-12 w-12 md:h-16 md:w-16 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="p-3 md:p-4">
              <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-1">
                {album.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                {album.artist}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
