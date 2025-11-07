import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Track } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Play, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Music2,
  Grip 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PlaylistDetailViewProps {
  playlistId: string;
  onBack: () => void;
  onPlayTrack: (track: Track, playlistTracks: Track[]) => void;
}

interface PlaylistWithTracks {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  tracks: Array<{
    id: string;
    position: number;
    track_metadata: {
      id: string;
      title: string;
      artists: string[];
      artwork_url?: string;
      source: string;
      source_track_id: string;
      duration_sec: number;
      album_title?: string;
    };
  }>;
}

export const PlaylistDetailView = ({ 
  playlistId, 
  onBack, 
  onPlayTrack 
}: PlaylistDetailViewProps) => {
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          title,
          description,
          cover_url,
          is_public,
          playlist_tracks (
            id,
            position,
            track_metadata (
              id,
              title,
              artists,
              artwork_url,
              source,
              source_track_id,
              duration_sec,
              album_title
            )
          )
        `)
        .eq('id', playlistId)
        .single();

      if (error) throw error;

      // Sort tracks by position
      const sortedData = {
        ...data,
        tracks: (data.playlist_tracks || [])
          .map((pt: any) => ({
            id: pt.id,
            position: pt.position,
            track_metadata: pt.track_metadata
          }))
          .sort((a: any, b: any) => a.position - b.position)
      };

      setPlaylist(sortedData as PlaylistWithTracks);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
    } catch (error) {
      console.error('Error fetching playlist:', error);
      toast.error('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlaylist = async () => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          title: editTitle,
          description: editDescription,
        })
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylist(prev => prev ? { ...prev, title: editTitle, description: editDescription } : null);
      setIsEditing(false);
      toast.success('Playlist updated');
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast.error('Failed to update playlist');
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;

      setPlaylist(prev => 
        prev ? { ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) } : null
      );
      toast.success('Track removed');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
    setDeleteTrackId(null);
  };

  const handlePlayTrack = (trackData: any) => {
    if (!playlist) return;
    
    const track: Track = {
      id: trackData.id,
      source: trackData.source as any,
      sourceTrackId: trackData.source_track_id,
      title: trackData.title,
      artists: trackData.artists,
      durationSec: trackData.duration_sec,
      artworkUrl: trackData.artwork_url,
      albumTitle: trackData.album_title,
    };
    
    // Convert all playlist tracks to Track objects for queue
    const playlistTracks: Track[] = playlist.tracks.map(item => ({
      id: item.track_metadata.id,
      source: item.track_metadata.source as any,
      sourceTrackId: item.track_metadata.source_track_id,
      title: item.track_metadata.title,
      artists: item.track_metadata.artists,
      durationSec: item.track_metadata.duration_sec,
      artworkUrl: item.track_metadata.artwork_url,
      albumTitle: item.track_metadata.album_title,
    }));
    
    onPlayTrack(track, playlistTracks);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchPlaylistDetails();

    // Real-time subscription for playlist tracks
    const channel = supabase
      .channel(`playlist-${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_tracks',
          filter: `playlist_id=eq.${playlistId}`
        },
        () => {
          fetchPlaylistDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playlistId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Playlist not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="px-3 md:px-4 py-4 md:py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Playlist title"
                className="text-2xl font-bold h-12"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleUpdatePlaylist} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(playlist.title);
                    setEditDescription(playlist.description || '');
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{playlist.title}</h1>
                  {playlist.description && (
                    <p className="text-sm md:text-base text-muted-foreground mb-2">{playlist.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full md:w-auto">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracks List */}
      <ScrollArea className="flex-1">
        <div className="px-3 md:px-4 py-4 md:py-6">
          {playlist.tracks.length === 0 ? (
            <Card className="p-12 text-center">
              <Music2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground">
                Search for music and add tracks to this playlist
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {playlist.tracks.map((item, index) => (
                <Card
                  key={item.id}
                  className="p-3 md:p-4 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <Grip className="hidden md:block h-5 w-5 text-muted-foreground/50 cursor-grab" />
                    <span className="text-muted-foreground w-6 md:w-8 text-center text-sm">
                      {index + 1}
                    </span>
                    
                    <div className="relative">
                      {item.track_metadata.artwork_url ? (
                        <img
                          src={item.track_metadata.artwork_url}
                          alt={item.track_metadata.title}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Music2 className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => handlePlayTrack(item.track_metadata)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <Play className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{item.track_metadata.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {item.track_metadata.artists.join(', ')}
                      </p>
                    </div>

                    <span className="hidden md:block text-sm text-muted-foreground shrink-0">
                      {formatDuration(item.track_metadata.duration_sec)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTrackId(item.id)}
                      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 md:h-10 md:w-10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTrackId} onOpenChange={() => setDeleteTrackId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove track?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the track from this playlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTrackId && handleDeleteTrack(deleteTrackId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
