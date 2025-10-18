import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTrackMetadata } from './useTrackMetadata';
import { Track } from '@/types/music';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { ensureTrackExists } = useTrackMetadata();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('track_id');

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map(f => f.track_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (track: Track) => {
    try {
      // Ensure track exists in metadata first
      const trackMetadataId = await ensureTrackExists(track);
      const isFav = favorites.has(track.id);

      if (isFav) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('track_id', trackMetadataId);

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.delete(track.id);
        setFavorites(newFavorites);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            track_id: trackMetadataId,
          });

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.add(track.id);
        setFavorites(newFavorites);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const isFavorite = (trackId: string) => favorites.has(trackId);

  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
};
