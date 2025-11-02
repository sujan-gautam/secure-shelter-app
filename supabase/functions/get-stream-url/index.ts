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
        // YouTube Music - use Cobalt API for reliable audio extraction
        const cobaltInstances = [
          'https://api.cobalt.tools',
          'https://co.wuk.sh'
        ];

        let lastError = null;
        
        for (const instance of cobaltInstances) {
          try {
            console.log(`Trying Cobalt API: ${instance} for ${trackId}`);
            
            const response = await fetch(`${instance}/api/json`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${trackId}`,
                vCodec: 'h264',
                vQuality: '360',
                aFormat: 'mp3',
                isAudioOnly: true,
                filenamePattern: 'basic'
              }),
              signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'stream' || data.status === 'success') {
              streamUrl = data.url;
              console.log(`YouTube audio extracted via Cobalt from ${instance}`);
              break;
            } else if (data.status === 'redirect') {
              streamUrl = data.url;
              console.log(`YouTube audio redirect via Cobalt from ${instance}`);
              break;
            } else {
              throw new Error(`Cobalt returned status: ${data.status}`);
            }
          } catch (err) {
            lastError = err;
            console.log(`Failed ${instance}: ${err instanceof Error ? err.message : 'Unknown'}`);
            continue;
          }
        }

        if (!streamUrl) {
          throw new Error(`YouTube extraction failed. Last error: ${lastError instanceof Error ? lastError.message : 'Service unavailable'}`);
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
