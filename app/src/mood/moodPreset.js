import { matchScene } from '../scenes/sceneLibrary';

const CACHE_PREFIX = 'drift_mood_';

// Precomputed presets, produced offline by scripts/preprocess-playlist.js
// and committed as JSON. Loaded lazily so an empty/missing file doesn't
// break the app — it just means everything falls back to live album-art
// colors until pre-processing has been run.
let precomputedPresets = null;
async function loadPrecomputedPresets() {
  if (precomputedPresets) return precomputedPresets;
  try {
    const res = await fetch('/presets/track-moods.json');
    precomputedPresets = res.ok ? await res.json() : {};
  } catch {
    precomputedPresets = {};
  }
  return precomputedPresets;
}

/**
 * Resolves the full visual preset for a track: scene + palette.
 * Resolution order:
 *   1. Precomputed preset (from offline Gemini pre-processing) — instant, no lag.
 *   2. localStorage cache (covers tracks processed live in a previous session,
 *      if that path is ever used).
 *   3. Fallback: derive a rough mood from album art dominant colors only,
 *      no network call, so the app never blocks waiting on anything live.
 */
export async function resolveTrackPreset(track, dominantColors) {
  const presets = await loadPrecomputedPresets();
  const precomputed = presets[track.id];
  if (precomputed) {
    return {
      ...precomputed,
      scene: matchScene(precomputed),
      source: 'precomputed',
    };
  }

  const cached = readCache(track.id);
  if (cached) {
    return { ...cached, scene: matchScene(cached), source: 'cache' };
  }

  // Fallback: no mood classification available yet for this track.
  // Use album art colors only — instant, always available, never blocks.
  const fallbackMood = moodFromColors(dominantColors);
  return { ...fallbackMood, scene: matchScene(fallbackMood), source: 'fallback' };
}

function readCache(trackId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + trackId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(trackId, preset) {
  try {
    localStorage.setItem(CACHE_PREFIX + trackId, JSON.stringify(preset));
  } catch {
    // Storage full or unavailable — non-fatal, just skip caching.
  }
}

/**
 * Very rough heuristic mapping from dominant album art color to a mood
 * guess, used only when no Gemini-derived preset exists yet. This is
 * intentionally simple — it's a safety net, not the real mood logic.
 */
function moodFromColors(dominantColors) {
  if (!dominantColors || dominantColors.length === 0) {
    return { energy: 'calm', tone: 'cool', dominantColors: [] };
  }

  const [r, g, b] = dominantColors[0];
  const brightness = (r + g + b) / 3;
  const isWarm = r > b;

  return {
    energy: brightness > 150 ? 'moderate' : 'calm',
    tone: isWarm ? (brightness > 150 ? 'warm' : 'dark') : 'cool',
    dominantColors,
  };
}
