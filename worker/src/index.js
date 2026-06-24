/**
 * Drift mood-classification proxy.
 *
 * Single route: POST /mood
 * Body: { track: string, artist: string, album?: string }
 * Returns: { energy: "calm"|"moderate"|"high", tone: "warm"|"cool"|"dark"|"bright" }
 *
 * This Worker exists for exactly one reason: GitHub Pages serves static
 * files only, so the Gemini API key can't live in the frontend bundle
 * without being exposed to anyone who opens devtools. This Worker keeps
 * GEMINI_API_KEY in Cloudflare secrets, server-side, never shipped to
 * the client.
 *
 * This is called by scripts/preprocess-playlist.js (run locally by you),
 * NOT by the live app — the live app only ever reads the precomputed
 * track-moods.json. That keeps the live app fast and this Worker's usage
 * tiny (one call per track, once, ever).
 */

const ALLOWED_ENERGY = ['calm', 'moderate', 'high'];
const ALLOWED_TONE = ['warm', 'cool', 'dark', 'bright'];

const MOOD_PROMPT = (track, artist, album) => `
You are classifying a song's overall mood for a generative ambient visual
backdrop. Based on the track name, artist, and album below, infer the
likely mood and respond with ONLY a JSON object, no other text, no
markdown fences.

Track: ${track}
Artist: ${artist}
Album: ${album || 'unknown'}

Respond in exactly this shape:
{"energy": "calm" | "moderate" | "high", "tone": "warm" | "cool" | "dark" | "bright"}

energy = how intense/driving the song likely feels.
tone = the color temperature/emotional shade the song evokes.
`.trim();

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/mood' || request.method !== 'POST') {
      return jsonResponse({ error: 'Not found' }, 404, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
    }

    const { track, artist, album } = body;
    if (!track || !artist) {
      return jsonResponse({ error: 'track and artist are required' }, 400, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: 'Worker misconfigured: missing GEMINI_API_KEY' }, 500, origin);
    }

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: MOOD_PROMPT(track, artist, album) }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 100,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const detail = await geminiResponse.text();
        return jsonResponse(
          { error: `Gemini request failed: ${geminiResponse.status}`, detail },
          502,
          origin
        );
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const cleaned = rawText.replace(/```json|```/g, '').trim();

      let mood;
      try {
        mood = JSON.parse(cleaned);
      } catch {
        return jsonResponse(
          { error: 'Gemini returned non-JSON output', raw: rawText },
          502,
          origin
        );
      }

      if (!ALLOWED_ENERGY.includes(mood.energy) || !ALLOWED_TONE.includes(mood.tone)) {
        return jsonResponse(
          { error: 'Gemini returned an out-of-range mood value', raw: mood },
          502,
          origin
        );
      }

      return jsonResponse({ energy: mood.energy, tone: mood.tone }, 200, origin);
    } catch (err) {
      return jsonResponse({ error: `Worker error: ${err.message}` }, 500, origin);
    }
  },
};
