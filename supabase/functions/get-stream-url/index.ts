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
        // YouTube Music - use parallel requests with Promise.race for fastest response
        console.log(`Extracting YouTube audio for: ${trackId}`);
        
        const invidiousInstances = [
          'https://inv.perditum.com',      // 98.6% uptime, CORS + API
          'https://invidious.nerdvpn.de',  // 99.2% uptime
          'https://inv.nadeko.net',        // 97.9% uptime
          'https://yewtu.be',              // 91.9% uptime, very popular
          'https://invidious.f5.si',       // 91.5% uptime
          'https://inv.riverside.rocks',   // Backup
          'https://invidious.privacydev.net' // Backup
        ];

        // Helper function to fetch from a single instance
        const fetchFromInstance = async (instance: string): Promise<{ url: string; instance: string }> => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // Reduced to 3.5s
            
            const response = await fetch(
              `${instance}/api/v1/videos/${trackId}`,
              { 
                signal: controller.signal,
                headers: { 
                  'Accept': 'application/json',
                  'User-Agent': 'OpenBeats/1.0'
                }
              }
            );
            
            clearTimeout(timeoutId);
            
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
                
                return { url: bestAudio.url, instance };
              }
            }
            
            throw new Error('No audio streams found');
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error';
            throw new Error(`${instance}: ${error}`);
          }
        };

        // Try first batch in parallel (top 4 most reliable instances)
        console.log('Trying primary instances in parallel...');
        try {
          const primaryPromises = invidiousInstances.slice(0, 4).map(fetchFromInstance);
          const result = await Promise.race(primaryPromises);
          streamUrl = result.url;
          console.log(`✓ Audio extracted from ${result.instance} (fastest response)`);
        } catch (primaryError) {
          console.log('Primary instances failed, trying backup instances...');
          
          // If all primary fail, try backup instances in parallel
          try {
            const backupPromises = invidiousInstances.slice(4).map(fetchFromInstance);
            const result = await Promise.race(backupPromises);
            streamUrl = result.url;
            console.log(`✓ Audio extracted from ${result.instance} (backup)`);
          } catch (backupError) {
            throw new Error('All YouTube proxies unavailable. Please try again.');
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
