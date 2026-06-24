const LRCLIB_BASE = 'https://lrclib.net/api';

/**
 * Parses standard LRC timestamp format "[mm:ss.xx]line text" into
 * an array of { timeMs, text } sorted by time.
 */
function parseLrc(lrcText) {
  const lines = lrcText.split('\n');
  const result = [];
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeTag)];
    if (matches.length === 0) continue;

    const text = line.replace(timeTag, '').trim();
    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      const timeMs = Math.round((minutes * 60 + seconds + fraction) * 1000);
      result.push({ timeMs, text });
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Fetches synced lyrics for a track from lrclib.net.
 * Returns { synced: [{timeMs, text}] | null, plain: string | null }
 * Returns nulls (not a throw) when lyrics simply aren't found — this is
 * common and the UI should handle it gracefully (e.g. fall back to
 * showing just the visual, no lyrics panel).
 */
export async function fetchLyrics({ trackName, artistName, albumName, durationSec }) {
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });
  if (albumName) params.set('album_name', albumName);
  if (durationSec) params.set('duration', String(Math.round(durationSec)));

  const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`);

  if (response.status === 404) {
    return { synced: null, plain: null };
  }
  if (!response.ok) {
    throw new Error(`lrclib request failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    synced: data.syncedLyrics ? parseLrc(data.syncedLyrics) : null,
    plain: data.plainLyrics ?? null,
  };
}

/**
 * Given synced lyric lines and a current playback position, returns the
 * index of the line that should currently be displayed (-1 if before the
 * first line).
 */
export function getActiveLyricIndex(syncedLines, positionMs) {
  if (!syncedLines || syncedLines.length === 0) return -1;

  let activeIndex = -1;
  for (let i = 0; i < syncedLines.length; i++) {
    if (syncedLines[i].timeMs <= positionMs) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
