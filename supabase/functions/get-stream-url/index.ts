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
        // YouTube Music - stream directly through Invidious proxy with CORS support
        console.log(`Getting YouTube stream for: ${trackId}`);
        
        // Use Invidious instances that support direct audio streaming with CORS
        const invidiousInstances = [
          'https://inv.perditum.com',
          'https://yewtu.be',
          'https://invidious.nerdvpn.de',
          'https://inv.nadeko.net',
          'https://invidious.f5.si'
        ];

        // Try instances in parallel for fastest response
        const fetchFromInstance = async (instance: string): Promise<string> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          try {
            // Use Invidious direct stream endpoint
            const streamEndpoint = `${instance}/latest_version?id=${trackId}&itag=251`;
            
            // Test if endpoint is accessible
            const testResponse = await fetch(streamEndpoint, {
              method: 'HEAD',
              signal: controller.signal,
              headers: { 'User-Agent': 'OpenBeats/1.0' }
            });
            
            clearTimeout(timeoutId);
            
            if (testResponse.ok) {
              console.log(`✓ Stream ready from ${instance}`);
              return streamEndpoint;
            }
            
            throw new Error(`Not accessible`);
          } catch (err) {
            clearTimeout(timeoutId);
            const error = err instanceof Error ? err.message : 'Unknown';
            console.log(`✗ ${instance}: ${error}`);
            throw new Error(error);
          }
        };

        console.log('Finding fastest working proxy...');
        try {
          const allPromises = invidiousInstances.map(fetchFromInstance);
          streamUrl = await Promise.any(allPromises);
          console.log(`✓ Using Invidious direct stream`);
        } catch (error) {
          console.error('All Invidious instances failed, trying fallback method');
          
          // Fallback: Use first instance with direct format
          for (const instance of invidiousInstances.slice(0, 2)) {
            try {
              streamUrl = `${instance}/latest_version?id=${trackId}&itag=251`;
              console.log(`Using fallback: ${instance}`);
              break;
            } catch (e) {
              continue;
            }
          }
          
          if (!streamUrl) {
            throw new Error('YouTube streaming temporarily unavailable');
          }
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
