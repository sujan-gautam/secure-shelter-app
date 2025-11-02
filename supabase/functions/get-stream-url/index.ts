const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JAMENDO_CLIENT_ID = Deno.env.get('JAMENDO_CLIENT_ID');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source');
    const trackId = url.searchParams.get('trackId');

    if (!source || !trackId) {
      return new Response(
        JSON.stringify({ error: 'Both "source" and "trackId" parameters are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Getting stream URL for ${source}:${trackId}`);

    let streamUrl = '';

    switch (source) {
      case 'jamendo': {
        if (!JAMENDO_CLIENT_ID) {
          throw new Error('Jamendo API key not configured');
        }
        
        const response = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&id=${trackId}&audioformat=mp32`
        );
        const data = await response.json();
        
        if (data.results?.[0]?.audio) {
          streamUrl = data.results[0].audio;
        }
        break;
      }

      case 'fma': {
        // FMA tracks are hosted on archive.org
        streamUrl = `https://archive.org/download/${trackId}`;
        break;
      }

      case 'audius': {
        // Get Audius API host
        const hostsResponse = await fetch('https://api.audius.co');
        const hostsData = await hostsResponse.json();
        const apiHost = hostsData.data?.[0] || 'https://discoveryprovider.audius.co';

        // Get track details including stream URL
        const response = await fetch(`${apiHost}/v1/tracks/${trackId}`);
        const data = await response.json();
        
        if (data.data) {
          // Construct the actual stream URL
          streamUrl = `${apiHost}/v1/tracks/${trackId}/stream`;
        }
        break;
      }

      case 'ytmusic': {
        // YouTube Music - try multiple extraction methods with fallback
        console.log(`Attempting YouTube extraction for: ${trackId}`);
        
        // Method 1: Try a curated list of working Invidious instances
        const invidiousInstances = [
          'https://invidious.jing.rocks',
          'https://iv.nboeck.de',
          'https://invidious.slipfox.xyz',
          'https://invidious.perennialte.ch',
          'https://yt.oelrichsgarcia.de',
          'https://invidious.protokolla.fi',
          'https://inv.tux.pizza',
          'https://invidious.drgns.space'
        ];

        for (const instance of invidiousInstances) {
          try {
            const response = await fetch(
              `${instance}/api/v1/videos/${trackId}`,
              { 
                signal: AbortSignal.timeout(5000),
                headers: { 'Accept': 'application/json' }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.adaptiveFormats) {
                const audioFormats = data.adaptiveFormats.filter((f: any) => 
                  f.type?.startsWith('audio/')
                );
                
                if (audioFormats.length > 0) {
                  const bestAudio = audioFormats.sort((a: any, b: any) => 
                    (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0)
                  )[0];
                  
                  streamUrl = bestAudio.url;
                  console.log(`Success with ${instance}`);
                  break;
                }
              }
            }
          } catch (err) {
            console.log(`Failed ${instance}: ${err instanceof Error ? err.message : 'error'}`);
            continue;
          }
        }

        // If all methods fail, return YouTube URL for external playback
        if (!streamUrl) {
          console.log('All extraction methods failed, returning YouTube URL');
          streamUrl = `https://www.youtube.com/watch?v=${trackId}`;
        }
        break;
      }

      default:
        throw new Error(`Unknown source: ${source}`);
    }

    if (!streamUrl) {
      throw new Error('Could not retrieve stream URL');
    }

    return new Response(
      JSON.stringify({ 
        source,
        trackId,
        streamUrl,
        proxied: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Stream URL error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
