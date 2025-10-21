import { supabase } from '@/integrations/supabase/client';
import { Track } from '@/types/music';
import { useTrackMetadata } from './useTrackMetadata';

export const useListeningHistory = () => {
  const { ensureTrackExists } = useTrackMetadata();

  const trackPlay = async (track: Track, durationPlayedSec: number = 0) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Ensure track exists in track_metadata
      const trackId = await ensureTrackExists(track);

      // Record listening history
      const { error } = await supabase
        .from('listening_history')
        .insert([{
          user_id: user.id,
          track_id: trackId,
          duration_played_sec: durationPlayedSec,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  };

  return { trackPlay };
};
