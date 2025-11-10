const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-type, accept-ranges, content-range',
};

Deno.serve(async (req) => {
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

    console.log(`[Stream] Starting for ${trackId}`);

    // Best Invidious instances (tested and reliable)
    const instances = [
      'https://invidious.privacyredirect.com',
      'https://inv.riverside.rocks',
      'https://invidious.snopyta.org',
      'https://yewtu.be',
      'https://invidious.kavin.rocks',
    ];

    // Try to get audio URL from multiple instances in parallel
    const promises = instances.map(async (instance) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${instance}/api/v1/videos/${trackId}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeout);

        if (!res.ok) return null;

        const data = await res.json();
        
        // Prefer opus audio (itag 251) or m4a (itag 140) - standard YouTube audio formats
        const audioFormats = data.adaptiveFormats?.filter((f: any) => 
          f.type?.startsWith('audio/') && f.url
        ) || [];

        if (audioFormats.length === 0) return null;

        // Sort by quality: opus > m4a, then by bitrate
        const bestAudio = audioFormats.sort((a: any, b: any) => {
          const aIsOpus = a.type?.includes('opus') ? 1 : 0;
          const bIsOpus = b.type?.includes('opus') ? 1 : 0;
          if (aIsOpus !== bIsOpus) return bIsOpus - aIsOpus;
          return (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0);
        })[0];

        console.log(`[Stream] Got URL from ${instance} - Format: ${bestAudio.type}, Bitrate: ${bestAudio.bitrate}`);
        return { url: bestAudio.url, contentType: bestAudio.type };
      } catch (e) {
        const error = e as Error;
        console.log(`[Stream] Failed ${instance}: ${error.message || 'Unknown error'}`);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const audioData = results.find(r => r !== null);

    if (!audioData) {
      console.error(`[Stream] No working instance found for ${trackId}`);
      return new Response(
        JSON.stringify({ error: 'Audio stream unavailable from all sources' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and proxy the audio stream
    const rangeHeader = req.headers.get('range');
    const audioRes = await fetch(audioData.url, {
      headers: rangeHeader ? { Range: rangeHeader } : {},
    });

    if (!audioRes.ok) {
      console.error(`[Stream] Audio fetch failed: ${audioRes.status}`);
      throw new Error(`Audio fetch failed: ${audioRes.status}`);
    }

    // Build response headers
    const headers = new Headers(corsHeaders);
    const contentType = audioData.contentType || audioRes.headers.get('content-type') || 'audio/webm';
    headers.set('Content-Type', contentType);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    const contentLength = audioRes.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    const contentRange = audioRes.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    console.log(`[Stream] Streaming ${trackId} (${audioRes.status}) - ${contentType}`);
    
    return new Response(audioRes.body, {
      status: audioRes.status,
      headers,
    });

  } catch (err) {
    const error = err as Error;
    console.error('[Stream] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Stream failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});