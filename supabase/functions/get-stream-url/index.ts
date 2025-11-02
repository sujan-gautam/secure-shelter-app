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
        // YouTube Music - use verified working Invidious instances with API enabled
        console.log(`Extracting YouTube audio for: ${trackId}`);
        
        const invidiousInstances = [
          'https://inv.perditum.com',  // CORS + API enabled
          'https://yewtu.be',           // Popular, reliable
          'https://invidious.nerdvpn.de',
          'https://inv.nadeko.net',
          'https://invidious.f5.si'
        ];

        let lastError = '';
        
        for (const instance of invidiousInstances) {
          try {
            console.log(`Trying ${instance}`);
            
            const response = await fetch(
              `${instance}/api/v1/videos/${trackId}`,
              { 
                signal: AbortSignal.timeout(6000),
                headers: { 
                  'Accept': 'application/json',
                  'User-Agent': 'OpenBeats/1.0'
                }
              }
            );
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Get audio-only streams
            if (data.adaptiveFormats && data.adaptiveFormats.length > 0) {
              const audioStreams = data.adaptiveFormats.filter((f: any) => 
                f.type && f.type.startsWith('audio/') && f.url
              );
              
              if (audioStreams.length > 0) {
                // Sort by bitrate to get best quality
                const bestAudio = audioStreams.sort((a: any, b: any) => {
                  const bitrateA = parseInt(a.bitrate) || 0;
                  const bitrateB = parseInt(b.bitrate) || 0;
                  return bitrateB - bitrateA;
                })[0];
                
                streamUrl = bestAudio.url;
                console.log(`✓ Audio extracted from ${instance} (${bestAudio.type})`);
                break;
              }
            }
            
            throw new Error('No audio streams found');
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Unknown error';
            console.log(`✗ ${instance}: ${lastError}`);
            continue;
          }
        }

        if (!streamUrl) {
          throw new Error(`YouTube audio extraction failed: ${lastError}. All instances unavailable.`);
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
