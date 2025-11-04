import { Plus, Music, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaylists } from '@/hooks/usePlaylists';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface PlaylistSidebarProps {
  onPlaylistSelect?: (playlistId: string) => void;
}

export const PlaylistSidebar = ({ onPlaylistSelect }: PlaylistSidebarProps) => {
  const { playlists, createPlaylist, deletePlaylist, loading } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName);
    setNewPlaylistName('');
    setShowInput(false);
  };

  return (
    <div className="w-64 bg-card/50 border-r border-border/50 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold mb-3">Your Library</h2>
        
        {!showInput ? (
          <Button
            onClick={() => setShowInput(true)}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Playlist
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowInput(false);
                  setNewPlaylistName('');
                }}
              >
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : playlists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No playlists yet
            </p>
          ) : (
            playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 group cursor-pointer"
                onClick={() => onPlaylistSelect?.(playlist.id)}
              >
                <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-sm">{playlist.title}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{playlist.title}" and all its tracks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePlaylist(playlist.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
