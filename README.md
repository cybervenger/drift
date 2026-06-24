# Drift

Your currently-playing Spotify track, given somewhere calm to live —
full-bleed mood-matched ambient scenery with synced lyrics on top, built for
studying. No live API lag: mood/scene matching is pre-computed offline per
playlist, not calculated live while you're listening.

## Structure

```
drift/
├── app/      React frontend — deployed to GitHub Pages
└── worker/   Cloudflare Worker — proxies Gemini calls, keeps the API key
              server-side. Only used by the offline preprocessing script,
              never called by the live app.
```

## How it works

1. **Offline, once per playlist**: `app/scripts/preprocess-playlist.js`
   pulls a playlist's tracks from Spotify, sends each one to the Worker,
   which asks Gemini to classify the track's mood (`energy` + `tone`), and
   writes the results to `app/public/presets/track-moods.json`.
2. **Live app**: reads `track-moods.json` instantly when a track starts —
   no API call, no delay. Matches the mood to the closest scene in
   `app/src/scenes/sceneLibrary.js`, fetches synced lyrics from lrclib.net,
   and renders everything full-bleed via the Spotify Web Playback SDK.
3. Any track not yet pre-processed falls back to mood inferred from its own
   album art colors (instant, zero network calls) — the app never blocks
   waiting on anything live.

## Local setup

### 1. App

```bash
cd app
npm install
npm run dev
```

Opens at `http://127.0.0.1:5173`. This must match a Redirect URI registered
in your [Spotify Dashboard](https://developer.spotify.com/dashboard) app.

### 2. Worker (only needed when pre-processing a new playlist)

```bash
cd worker
npm install
npx wrangler secret put GEMINI_API_KEY   # paste your key when prompted
npm run dev      # local testing
npm run deploy   # deploy to Cloudflare, prints your Worker URL
```

Copy the printed Worker URL into `DRIFT_WORKER_URL` when running the
preprocessing script.

### 3. Pre-process a playlist

```bash
cd app
DRIFT_WORKER_URL=https://drift-mood-proxy.YOUR-SUBDOMAIN.workers.dev \
SPOTIFY_ACCESS_TOKEN=your-token-here \
node scripts/preprocess-playlist.js <playlist_id>
```

Safe to re-run — already-processed tracks are skipped, so adding songs to
a playlist later only costs Gemini calls for the new ones.

## Deploying to GitHub Pages

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
`app/` and publishes it via GitHub Pages.

Before your first deploy, add a **second** Redirect URI in the Spotify
Dashboard for the production URL (keep the localhost one too, for local
dev):

```
https://<your-username>.github.io/drift/callback
```

Then set `VITE_REDIRECT_URI` in the GitHub Actions environment (or as a
repo variable) to that same URL — see `app/.env.example`.

## Scene assets

`app/public/scenes/` needs real looping video files — see
`app/public/scenes/README.md` for the list and specs. Not included yet.

## What's intentionally not built yet

- Real audio-reactive (FFT) visuals — preset-driven only for now, see the
  build discussion for the audio-capture tradeoffs.
- Song-suggestion/recommendation algorithm — `app/src/spotify/playEventLog.js`
  already logs basic play events (started/skipped/completed/replayed) to
  localStorage so there's real history to build on once this gets tackled.
