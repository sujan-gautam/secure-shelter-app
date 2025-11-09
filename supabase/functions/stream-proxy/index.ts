const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-type, accept-ranges, content-range',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackId = url.searchParams.get('trackId');

    if (!trackId) {
      return new Response(
        JSON.stringify({ error: 'trackId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Streaming ${trackId}`);

    // Try Invidious instances to get audio URL
    const instances = [
      'https://inv.perditum.com',
      'https://yewtu.be', 
      'https://invidious.nerdvpn.de',
    ];

    let audioUrl = '';
    
    for (const instance of instances) {
      try {
        const res = await fetch(`${instance}/api/v1/videos/${trackId}`, {
          signal: AbortSignal.timeout(2500),
        });

        if (res.ok) {
          const data = await res.json();
          const audioStreams = data.adaptiveFormats?.filter((f: any) => 
            f.type?.startsWith('audio/') && f.url
          ) || [];
          
          if (audioStreams.length > 0) {
            audioUrl = audioStreams.sort((a: any, b: any) => 
              (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0)
            )[0].url;
            console.log(`Got URL from ${instance}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio unavailable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and proxy the audio
    const rangeHeader = req.headers.get('range');
    const audioRes = await fetch(audioUrl, {
      headers: rangeHeader ? { Range: rangeHeader } : {},
    });

    if (!audioRes.ok) {
      throw new Error(`Audio fetch failed: ${audioRes.status}`);
    }

    // Build response headers
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', 'audio/webm');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    const contentLength = audioRes.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    const contentRange = audioRes.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    console.log(`Streaming audio (${audioRes.status})`);
    
    return new Response(audioRes.body, {
      status: audioRes.status,
      headers,
    });

  } catch (error) {
    console.error('Stream error:', error);
    return new Response(
      JSON.stringify({ error: 'Stream failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});