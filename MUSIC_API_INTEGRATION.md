# Music API Integration Guide

## Overview

OpenBeats integrates with multiple free and legal music sources through edge functions. This ensures API keys are kept secure and allows for server-side caching and rate limiting.

## Supported Music Sources

### 1. Jamendo (✅ Integrated)
- **Type**: Free music platform
- **License**: Creative Commons
- **API**: Official REST API
- **Authentication**: Client ID required
- **Features**: 
  - High-quality MP3 streams
  - Rich metadata (artist, album, artwork)
  - Large catalog of CC-licensed music

### 2. Free Music Archive (✅ Integrated)
- **Type**: Public domain music
- **License**: Various Creative Commons
- **API**: Archive.org API
- **Authentication**: None required
- **Features**:
  - Historical recordings
  - Public domain content
  - Multiple formats available

### 3. Audius (✅ Integrated)
- **Type**: Decentralized music streaming
- **License**: Artist-controlled
- **API**: Public REST API
- **Authentication**: None required
- **Features**:
  - Modern independent artists
  - Web3-based platform
  - High-quality streams

### 4. YouTube Music (⏳ Planned)
- **Type**: Video/music platform
- **License**: Varies
- **API**: Unofficial (ytmusicapi)
- **Authentication**: Complex OAuth flow
- **Status**: Requires Python microservice
- **Note**: For MVP, implement this as a separate service

## Edge Functions

### 1. `music-search`

**Endpoint**: `/functions/v1/music-search`

**Method**: GET

**Parameters**:
- `q` (required): Search query
- `sources` (optional): Comma-separated list of sources (default: `jamendo,fma,audius`)
- `limit` (optional): Max results per source (default: 10)

**Example**:
```bash
curl "https://zokteleyadyodflghuse.supabase.co/functions/v1/music-search?q=jazz&sources=jamendo,audius&limit=20"
```

**Response**:
```json
{
  "query": "jazz",
  "sources": ["jamendo", "audius"],
  "count": 25,
  "tracks": [
    {
      "id": "jamendo-123456",
      "source": "jamendo",
      "sourceTrackId": "123456",
      "title": "Cool Jazz",
      "artists": ["Jazz Artist"],
      "albumTitle": "Jazz Album",
      "durationSec": 240,
      "artworkUrl": "https://...",
      "license": "CC-BY",
      "streamUrl": "https://..."
    }
  ]
}
```

### 2. `get-stream-url`

**Endpoint**: `/functions/v1/get-stream-url`

**Method**: GET

**Parameters**:
- `source` (required): Music source (`jamendo`, `fma`, `audius`)
- `trackId` (required): Source-specific track ID

**Example**:
```bash
curl "https://zokteleyadyodflghuse.supabase.co/functions/v1/get-stream-url?source=jamendo&trackId=123456"
```

**Response**:
```json
{
  "source": "jamendo",
  "trackId": "123456",
  "streamUrl": "https://mp3d.jamendo.com/...",
  "proxied": false
}
```

## Security Features

### JWT Verification
- Edge functions are set to `verify_jwt = false` to allow public access
- This is safe because:
  - Functions only query public APIs
  - No user data is modified
  - Rate limiting is handled server-side
  - API keys are stored securely in Supabase secrets

### API Key Management
- Jamendo Client ID stored in Supabase secrets
- Never exposed to client-side code
- Accessed via `Deno.env.get('JAMENDO_CLIENT_ID')`

### CORS Configuration
- Shared CORS headers in `_shared/cors.ts`
- Allows all origins for public API
- Proper preflight handling

## Rate Limiting & Caching

### Current Implementation
- No caching (MVP version)
- Direct API calls

### Recommended for Production
1. **Server-side caching**:
   ```typescript
   // Cache track metadata in PostgreSQL
   await supabase
     .from('track_metadata')
     .upsert({
       source,
       source_track_id,
       title,
       artists,
       // ... other fields
       last_fetched: new Date()
     });
   ```

2. **Rate limiting**:
   - Implement per-IP rate limits
   - Use Redis for distributed rate limiting
   - Respect API provider rate limits

3. **CDN caching**:
   - Cache search results for popular queries
   - TTL: 1 hour for search results
   - TTL: 7 days for track metadata

## Frontend Integration

### Using the Hook

```typescript
import { useMusicSearch } from '@/hooks/useMusicSearch';

function MyComponent() {
  const { search, getStreamUrl, loading, results } = useMusicSearch();

  const handleSearch = async () => {
    await search('jazz', ['jamendo', 'audius']);
  };

  const handlePlay = async (track) => {
    const url = await getStreamUrl(track.source, track.sourceTrackId);
    audioElement.src = url;
    audioElement.play();
  };

  return (
    // Your UI
  );
}
```

## Adding More Sources

To add a new music source:

1. **Create adapter function** in `music-search/index.ts`:
```typescript
async function searchNewSource(query: string, limit: number): Promise<Track[]> {
  // Implement API call
  // Transform to Track format
  // Return results
}
```

2. **Add to search logic**:
```typescript
if (sources.includes('newsource')) {
  searchPromises.push(searchNewSource(query, limit));
}
```

3. **Add stream URL handling** in `get-stream-url/index.ts`:
```typescript
case 'newsource': {
  // Get stream URL for this source
  streamUrl = await getNewSourceStreamUrl(trackId);
  break;
}
```

4. **Update TypeScript types** in `src/types/music.ts`:
```typescript
export interface Track {
  source: 'jamendo' | 'fma' | 'audius' | 'newsource';
  // ...
}
```

## Testing

### Local Testing
```bash
# Start Supabase locally
npx supabase start

# Deploy functions
npx supabase functions deploy music-search
npx supabase functions deploy get-stream-url

# Test
curl "http://localhost:54321/functions/v1/music-search?q=test"
```

### Production Testing
```bash
curl "https://zokteleyadyodflghuse.supabase.co/functions/v1/music-search?q=jazz"
```

## Troubleshooting

### "Jamendo API key not configured"
- Ensure `JAMENDO_CLIENT_ID` secret is set in Supabase
- Get API key from: https://developer.jamendo.com/

### CORS Errors
- Check `corsHeaders` are included in all responses
- Ensure OPTIONS request handler is present

### No Results
- Check API response logs in edge function logs
- Verify API endpoints are accessible
- Check for rate limiting

### Stream URL Issues
- Verify track exists in source API
- Check for expired URLs (some APIs use temporary URLs)
- Test URL directly in browser

## Legal Compliance

- ✅ All sources use legal, licensed content
- ✅ Attribution provided via `license` field
- ✅ No DRM circumvention
- ✅ Respects API Terms of Service
- ✅ No downloading of paid/premium content

## Performance Considerations

### Current (MVP)
- Direct API calls (no caching)
- Sequential source searches
- No CDN

### Production Recommendations
- Implement Redis caching
- Parallel API calls ✅ (already implemented)
- CDN for popular queries
- Database caching for track metadata
- Connection pooling for API requests

## Future Enhancements

1. **YouTube Music Integration**
   - Create Python microservice with ytmusicapi
   - Deploy as separate Deno function calling Python service
   - Implement aggressive caching

2. **Playlist Sync**
   - Cache entire playlists
   - Offline support via service workers

3. **Advanced Search**
   - Filters (genre, year, license)
   - Fuzzy matching
   - Relevance scoring

4. **Analytics**
   - Track popular searches
   - Monitor API performance
   - User listening habits

---

Built with ❤️ for the OpenBeats community
