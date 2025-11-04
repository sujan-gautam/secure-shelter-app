import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTrackMetadata } from './useTrackMetadata';
import { Track } from '@/types/music';

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const { ensureTrackExists } = useTrackMetadata();

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (title: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          title,
          description,
          owner_id: user.id,
          is_public: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists([data, ...playlists]);
      toast.success('Playlist created');
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      throw error;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(playlists.filter(p => p.id !== playlistId));
      toast.success('Playlist deleted');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  const updatePlaylist = async (
    playlistId: string, 
    updates: { title?: string; description?: string; is_public?: boolean }
  ) => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      setPlaylists(playlists.map(p => p.id === playlistId ? data : p));
      toast.success('Playlist updated');
      return data;
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast.error('Failed to update playlist');
      throw error;
    }
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    try {
      // Ensure track exists in metadata first
      const trackMetadataId = await ensureTrackExists(track);

      // Check if track already exists in playlist
      const { data: existingTracks } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('track_id', trackMetadataId);

      if (existingTracks && existingTracks.length > 0) {
        toast.info('Track already in playlist');
        return;
      }

      // Get current max position
      const { data: tracks } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const position = tracks && tracks.length > 0 ? tracks[0].position + 1 : 0;

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackMetadataId,
          position,
        });

      if (error) throw error;
      toast.success('Added to playlist');
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast.error('Failed to add track');
    }
  };

  const removeTrackFromPlaylist = async (playlistTrackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', playlistTrackId);

      if (error) throw error;
      toast.success('Track removed');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
  };

  useEffect(() => {
    fetchPlaylists();

    // Set up real-time subscription for playlists
    const channel = supabase
      .channel('playlists-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlists'
        },
        (payload) => {
          console.log('Playlist change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPlaylists(prev => [payload.new as Playlist, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPlaylists(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as Playlist : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setPlaylists(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    refreshPlaylists: fetchPlaylists,
  };
};
