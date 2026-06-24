#!/usr/bin/env node
/**
 * Pre-processes a Spotify playlist into mood presets, ahead of time, so
 * the live app never makes a live Gemini call and never lags on a new track.
 *
 * Usage:
 *   SPOTIFY_ACCESS_TOKEN=... node scripts/preprocess-playlist.js <playlist_id>
 *
 * Writes/merges results into public/presets/track-moods.json, keyed by
 * Spotify track ID. Safe to re-run — already-processed tracks are skipped,
 * so adding new tracks to a playlist and re-running only costs Gemini calls
 * for the new ones.
 *
 * Requires:
 *   - A Spotify access token with playlist-read access (grab one manually
 *     via the Spotify Web API console, or run the app, log in, and copy
 *     the token from localStorage — it's short-lived, just for this script).
 *   - The Worker deployed and reachable at WORKER_URL below.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_PATH = path.join(__dirname, '../public/presets/track-moods.json');

// Update this once the Worker is deployed — `wrangler deploy` prints the URL.
const WORKER_URL = process.env.DRIFT_WORKER_URL || 'https://drift-mood-proxy.YOUR-SUBDOMAIN.workers.dev';

async function fetchPlaylistTracks(playlistId, accessToken) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Spotify API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    for (const item of data.items) {
      if (item.track) tracks.push(item.track);
    }
    url = data.next;
  }

  return tracks;
}

async function classifyMood(track) {
  const res = await fetch(`${WORKER_URL}/mood`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track: track.name,
      artist: track.artists[0]?.name ?? 'unknown',
      album: track.album?.name,
    }),
  });

  if (!res.ok) {
    throw new Error(`Worker error for "${track.name}": ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function loadExistingPresets() {
  try {
    return JSON.parse(fs.readFileSync(PRESETS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

async function main() {
  const playlistId = process.argv[2];
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;

  if (!playlistId) {
    console.error('Usage: SPOTIFY_ACCESS_TOKEN=... node scripts/preprocess-playlist.js <playlist_id>');
    process.exit(1);
  }
  if (!accessToken) {
    console.error('Missing SPOTIFY_ACCESS_TOKEN env var.');
    process.exit(1);
  }

  console.log(`Fetching tracks for playlist ${playlistId}...`);
  const tracks = await fetchPlaylistTracks(playlistId, accessToken);
  console.log(`Found ${tracks.length} tracks.`);

  const presets = loadExistingPresets();
  let processed = 0;
  let skipped = 0;

  for (const track of tracks) {
    if (presets[track.id]) {
      skipped += 1;
      continue;
    }

    try {
      const mood = await classifyMood(track);
      presets[track.id] = {
        ...mood,
        trackName: track.name,
        artist: track.artists[0]?.name,
      };
      processed += 1;
      console.log(`✓ ${track.name} — ${track.artists[0]?.name} → ${mood.energy}/${mood.tone}`);
    } catch (err) {
      console.error(`✗ ${track.name}: ${err.message}`);
    }

    // Be polite to the Worker/Gemini — small delay between calls.
    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(PRESETS_PATH, JSON.stringify(presets, null, 2));
  console.log(`\nDone. ${processed} newly processed, ${skipped} already cached, ${tracks.length} total.`);
  console.log(`Written to ${PRESETS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
