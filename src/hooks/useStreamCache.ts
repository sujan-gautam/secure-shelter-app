import { useState, useEffect } from 'react';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStreamCache = () => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());

  const getCacheKey = (source: string, trackId: string) => `${source}:${trackId}`;

  const get = (source: string, trackId: string): string | null => {
    const key = getCacheKey(source, trackId);
    const entry = cache.get(key);
    
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.url;
    }
    
    return null;
  };

  const set = (source: string, trackId: string, url: string) => {
    const key = getCacheKey(source, trackId);
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, { url, timestamp: Date.now() });
      return newCache;
    });
  };

  // Clean expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map(prev);
        const now = Date.now();
        
        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp >= CACHE_DURATION) {
            newCache.delete(key);
          }
        }
        
        return newCache;
      });
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { get, set };
};
