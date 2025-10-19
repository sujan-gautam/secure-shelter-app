import { supabase } from '@/integrations/supabase/client';
import { Track } from '@/types/music';

export const useTrackMetadata = () => {
  const ensureTrackExists = async (track: Track): Promise<string> => {
    try {
      // Check if track already exists
      const { data: existing, error: fetchError } = await supabase
        .from('track_metadata')
        .select('id')
        .eq('source', track.source)
        .eq('source_track_id', track.sourceTrackId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Insert new track metadata
      const { data, error } = await supabase
        .from('track_metadata')
        .insert({
          source: track.source,
          source_track_id: track.sourceTrackId,
          title: track.title,
          artists: track.artists,
          album_title: track.albumTitle,
          album_id: track.albumId,
          duration_sec: track.durationSec,
          artwork_url: track.artworkUrl,
          license: track.license,
          raw_data: track.rawData,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error ensuring track exists:', error);
      throw error;
    }
  };

  return { ensureTrackExists };
};
