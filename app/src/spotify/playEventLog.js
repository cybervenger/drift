// Logs basic listening events so that whenever song-suggestion logic gets
// built later, there's real history to work from instead of starting cold.
// Intentionally minimal for now: no analysis, no algorithm, just capture.
//
// Stored in localStorage as a capped array (oldest entries drop off) so it
// never grows unbounded. This is a placeholder store — swapping it for a
// real backend/DB later is a drop-in replacement, since everything else in
// the app only calls logPlayEvent() and never reads this directly.

const EVENTS_KEY = 'drift_play_events';
const MAX_EVENTS = 2000;

/**
 * @param {('track_started'|'track_skipped'|'track_completed'|'track_replayed')} type
 * @param {{id: string, name: string, artists: string[]}} track
 */
export function logPlayEvent(type, track) {
  try {
    const events = readEvents();
    events.push({
      type,
      trackId: track.id,
      trackName: track.name,
      artists: track.artists,
      timestamp: Date.now(),
    });

    // Cap from the front so the array doesn't grow forever.
    const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Non-fatal — logging should never break playback or the UI.
  }
}

export function readEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
