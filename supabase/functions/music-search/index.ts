const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JAMENDO_CLIENT_ID = Deno.env.get('JAMENDO_CLIENT_ID');

interface Track {
  id: string;
  source: 'jamendo' | 'fma' | 'audius' | 'ytmusic';
  sourceTrackId: string;
  title: string;
  artists: string[];
  albumTitle?: string;
  durationSec: number;
  artworkUrl?: string;
  license?: string;
  streamUrl?: string;
}

// Jamendo API adapter
async function searchJamendo(query: string, limit: number = 10): Promise<Track[]> {
  if (!JAMENDO_CLIENT_ID) {
    console.log('Jamendo API key not configured');
    return [];
  }

  try {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&search=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`;
    console.log('Fetching from Jamendo:', url);
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      console.log('No results from Jamendo');
      return [];
    }

    return data.results.map((track: any) => ({
      id: `jamendo-${track.id}`,
      source: 'jamendo' as const,
      sourceTrackId: track.id,
      title: track.name,
      artists: [track.artist_name],
      albumTitle: track.album_name,
      durationSec: track.duration,
      artworkUrl: track.album_image || track.image,
      license: track.license_ccurl,
      streamUrl: track.audio,
    }));
  } catch (error) {
    console.error('Jamendo search error:', error);
    return [];
  }
}

// Free Music Archive adapter
async function searchFMA(query: string, limit: number = 10): Promise<Track[]> {
  try {
    // Note: FMA API has limited availability, using archive.org instead
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:(freemusicarchive)&fl=identifier,title,creator,date,format&rows=${limit}&output=json`;
    console.log('Fetching from FMA/Archive.org:', url);
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.response?.docs) {
      console.log('No results from FMA');
      return [];
    }

    return data.response.docs
      .filter((doc: any) => doc.format?.includes('VBR MP3'))
      .map((doc: any) => ({
        id: `fma-${doc.identifier}`,
        source: 'fma' as const,
        sourceTrackId: doc.identifier,
        title: doc.title?.[0] || 'Unknown',
        artists: [doc.creator || 'Unknown Artist'],
        durationSec: 180, // Default duration
        artworkUrl: `https://archive.org/services/img/${doc.identifier}`,
        license: 'Creative Commons',
        streamUrl: `https://archive.org/download/${doc.identifier}`,
      }));
  } catch (error) {
    console.error('FMA search error:', error);
    return [];
  }
}

// Audius API adapter
async function searchAudius(query: string, limit: number = 10): Promise<Track[]> {
  try {
    // Get Audius API host
    const hostsResponse = await fetch('https://api.audius.co');
    const hostsData = await hostsResponse.json();
    const apiHost = hostsData.data?.[0] || 'https://discoveryprovider.audius.co';

    const url = `${apiHost}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    console.log('Fetching from Audius:', url);
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data) {
      console.log('No results from Audius');
      return [];
    }

    return data.data.map((track: any) => ({
      id: `audius-${track.id}`,
      source: 'audius' as const,
      sourceTrackId: track.id,
      title: track.title,
      artists: [track.user?.name || 'Unknown Artist'],
      albumTitle: track.release_date ? `Released ${track.release_date}` : undefined,
      durationSec: track.duration,
      artworkUrl: track.artwork?.['480x480'] || track.artwork?.['150x150'],
      license: 'Creative Commons',
      streamUrl: track.permalink ? `https://audius.co${track.permalink}` : undefined,
    }));
  } catch (error) {
    console.error('Audius search error:', error);
    return [];
  }
}

// YouTube Music search using YouTube Data API v3
async function searchYTMusic(query: string, limit: number = 10): Promise<Track[]> {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not configured');
    return [];
  }

  try {
    // Search for music videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&videoCategoryId=10&maxResults=${limit}&key=${YOUTUBE_API_KEY}`;
    console.log('Fetching from YouTube:', searchUrl.replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN'));
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube search error:', searchResponse.status, errorText);
      return [];
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log('No results from YouTube');
      return [];
    }

    // Get video details for duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      console.error('YouTube details error:', detailsResponse.status);
      return [];
    }
    
    const detailsData = await detailsResponse.json();
    
    return detailsData.items.map((video: any) => {
      const duration = parseYouTubeDuration(video.contentDetails.duration);
      const snippet = video.snippet;
      
      return {
        id: `ytmusic-${video.id}`,
        source: 'ytmusic' as const,
        sourceTrackId: video.id,
        title: snippet.title,
        artists: [snippet.channelTitle],
        albumTitle: undefined,
        durationSec: duration,
        artworkUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        license: 'YouTube Standard License',
      };
    });
  } catch (error) {
    console.error('YouTube Music search error:', error);
    return [];
  }
}

// Parse YouTube duration format (PT1M30S -> 90 seconds)
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const sources = url.searchParams.get('sources')?.split(',') || ['jamendo', 'fma', 'audius'];
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Searching for: "${query}" across sources: ${sources.join(', ')}`);

    // Search all sources in parallel
    const searchPromises = [];
    
    if (sources.includes('jamendo')) {
      searchPromises.push(searchJamendo(query, limit));
    }
    if (sources.includes('fma')) {
      searchPromises.push(searchFMA(query, limit));
    }
    if (sources.includes('audius')) {
      searchPromises.push(searchAudius(query, limit));
    }
    if (sources.includes('ytmusic')) {
      searchPromises.push(searchYTMusic(query, limit));
    }

    const results = await Promise.all(searchPromises);
    const allTracks = results.flat();

    console.log(`Found ${allTracks.length} total tracks`);

    return new Response(
      JSON.stringify({ 
        query,
        sources,
        count: allTracks.length,
        tracks: allTracks 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
