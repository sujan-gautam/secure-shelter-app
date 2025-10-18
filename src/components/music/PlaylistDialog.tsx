import { useState } from 'react';
import { Plus, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaylists } from '@/hooks/usePlaylists';
import { Track } from '@/types/music';

interface PlaylistDialogProps {
  track: Track;
}

export const PlaylistDialog = ({ track }: PlaylistDialogProps) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylists();
  const [open, setOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);

  const handleAddToPlaylist = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, track);
    setOpen(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    
    try {
      const playlist = await createPlaylist(newPlaylistName);
      if (playlist) {
        await addTrackToPlaylist(playlist.id, track);
        setOpen(false);
        setNewPlaylistName('');
        setShowNewPlaylist(false);
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <List className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>

        {!showNewPlaylist ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowNewPlaylist(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Playlist
            </Button>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {playlists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No playlists yet. Create one!
                  </p>
                ) : (
                  playlists.map((playlist) => (
                    <Button
                      key={playlist.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <List className="h-4 w-4 mr-2" />
                      {playlist.title}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNewPlaylist(false);
                  setNewPlaylistName('');
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateAndAdd}>
                Create & Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
