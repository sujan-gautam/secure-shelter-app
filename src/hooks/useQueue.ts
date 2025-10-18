import { useState } from 'react';
import { Track } from '@/types/music';

export type RepeatMode = 'off' | 'one' | 'all';

export const useQueue = () => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);

  const addToQueue = (track: Track) => {
    setQueue([...queue, track]);
  };

  const playNext = (track: Track) => {
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, track);
    setQueue(newQueue);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const playTrack = (track: Track, trackQueue?: Track[]) => {
    if (trackQueue) {
      setQueue(trackQueue);
      setOriginalQueue(trackQueue);
      const index = trackQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      // If no queue provided, add to existing queue
      const existingIndex = queue.findIndex(t => t.id === track.id);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
      } else {
        setQueue([...queue, track]);
        setCurrentIndex(queue.length);
      }
    }
  };

  const next = (): Track | null => {
    if (queue.length === 0) return null;

    if (repeat === 'one') {
      return queue[currentIndex];
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        return null;
      }
    }

    setCurrentIndex(nextIndex);
    return queue[nextIndex];
  };

  const previous = (): Track | null => {
    if (queue.length === 0) return null;

    if (repeat === 'one') {
      return queue[currentIndex];
    }

    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        return null;
      }
    }

    setCurrentIndex(prevIndex);
    return queue[prevIndex];
  };

  const toggleShuffle = () => {
    if (!shuffle) {
      // Shuffle the queue
      const currentTrack = queue[currentIndex];
      const remaining = queue.filter((_, i) => i !== currentIndex);
      
      // Fisher-Yates shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }

      const shuffled = [currentTrack, ...remaining];
      setQueue(shuffled);
      setCurrentIndex(0);
    } else {
      // Restore original order
      const currentTrack = queue[currentIndex];
      const originalIndex = originalQueue.findIndex(t => t.id === currentTrack.id);
      setQueue(originalQueue);
      setCurrentIndex(originalIndex >= 0 ? originalIndex : 0);
    }
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeat(nextMode);
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
    setOriginalQueue([]);
  };

  return {
    queue,
    currentIndex,
    currentTrack: queue[currentIndex] || null,
    shuffle,
    repeat,
    addToQueue,
    playNext,
    removeFromQueue,
    playTrack,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    clearQueue,
  };
};
