const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-type, accept-ranges',
};

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
        JSON.stringify({ error: 'source and trackId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxying stream for ${source}:${trackId}`);

    // Get audio URL from Invidious
    const invidiousInstances = [
      'https://inv.perditum.com',
      'https://invidious.nerdvpn.de',
      'https://yewtu.be',
      'https://inv.nadeko.net',
    ];

    let audioUrl = '';
    
    for (const instance of invidiousInstances) {
      try {
        const response = await fetch(
          `${instance}/api/v1/videos/${trackId}`,
          { 
            signal: AbortSignal.timeout(3000),
            headers: { 'User-Agent': 'OpenBeats/1.0' }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.adaptiveFormats?.length > 0) {
            const audioStreams = data.adaptiveFormats.filter((f: any) => 
              f.type?.startsWith('audio/') && f.url
            );
            
            if (audioStreams.length > 0) {
              const bestAudio = audioStreams.sort((a: any, b: any) => {
                return (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0);
              })[0];
              
              audioUrl = bestAudio.url;
              console.log(`✓ Got stream URL from ${instance}`);
              break;
            }
          }
        }
      } catch (err) {
        console.log(`✗ ${instance} failed`);
        continue;
      }
    }

    if (!audioUrl) {
      throw new Error('Could not fetch audio URL');
    }

    // Fetch the actual audio and stream it
    console.log('Fetching audio stream...');
    const audioResponse = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': req.headers.get('range') || '',
      },
    });

    if (!audioResponse.ok) {
      throw new Error(`Audio fetch failed: ${audioResponse.status}`);
    }

    // Forward the audio stream with CORS headers
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', audioResponse.headers.get('content-type') || 'audio/webm');
    headers.set('Accept-Ranges', 'bytes');
    
    if (audioResponse.headers.get('content-length')) {
      headers.set('Content-Length', audioResponse.headers.get('content-length')!);
    }
    if (audioResponse.headers.get('content-range')) {
      headers.set('Content-Range', audioResponse.headers.get('content-range')!);
    }

    console.log('✓ Streaming audio');
    
    return new Response(audioResponse.body, {
      status: audioResponse.status,
      headers,
    });

  } catch (error) {
    console.error('Stream proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Stream failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
