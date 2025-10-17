export interface Track {
  id: string;
  source: 'jamendo' | 'fma' | 'audius' | 'ytmusic';
  sourceTrackId: string;
  title: string;
  artists: string[];
  albumTitle?: string;
  albumId?: string;
  durationSec: number;
  artworkUrl?: string;
  license?: string;
  rawData?: any;
}

export interface Playlist {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tracks?: Track[];
}

export interface Profile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  settings: {
    crossfadeSec: number;
    eqBands: number[];
    offlineCacheAllowed: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  repeat: 'off' | 'one' | 'all';
  shuffle: boolean;
}
