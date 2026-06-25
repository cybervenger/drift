import { useEffect, useRef, useState } from 'react';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

/**
 * Loads the Spotify Web Playback SDK script once, and resolves when
 * window.onSpotifyWebPlaybackSDKReady has fired. Safe to call multiple
 * times — it dedupes via a module-level promise.
 */
let sdkReadyPromise = null;
function loadSpotifySdk() {
  if (sdkReadyPromise) return sdkReadyPromise;

  sdkReadyPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve(window.Spotify);
    };

    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  return sdkReadyPromise;
}

/**
 * Initializes a Spotify Connect device ("Drift") in this browser tab and
 * tracks live playback state. getValidToken should be the function from
 * useSpotifyToken — the SDK calls it whenever it needs a fresh token.
 *
 * Returns:
 *   { deviceId, isReady, currentTrack, isPlaying, progressMs, durationMs, error }
 */
export function useSpotifyPlayer(getValidToken) {
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState(null);
  const [error, setError] = useState(null);
  const [tickedProgressMs, setTickedProgressMs] = useState(0);
  const playerRef = useRef(null);
  const lastStateUpdateRef = useRef({ position: 0, timestamp: Date.now() });
  const getValidTokenRef = useRef(getValidToken);
  getValidTokenRef.current = getValidToken;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const Spotify = await loadSpotifySdk();
        if (cancelled) return;

        const player = new Spotify.Player({
          name: 'Drift',
          getOAuthToken: async (callback) => {
            try {
              const token = await getValidToken();
              callback(token);
            } catch (err) {
              setError(err);
            }
          },
          volume: 0.8,
        });

        player.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
          setIsReady(true);
        });

        player.addListener('not_ready', () => {
          setIsReady(false);
        });

        player.addListener('initialization_error', ({ message }) => {
          setError(new Error(`SDK init error: ${message}`));
        });

        player.addListener('authentication_error', ({ message }) => {
          setError(new Error(`SDK auth error: ${message}`));
        });

        player.addListener('account_error', ({ message }) => {
          setError(
            new Error(
              `SDK account error (Premium required for playback): ${message}`
            )
          );
        });

        player.addListener('player_state_changed', (state) => {
          setPlayerState(state);
          if (state) {
            lastStateUpdateRef.current = { position: state.position, timestamp: Date.now() };
            setTickedProgressMs(state.position);
          }
        });

        await player.connect();
        playerRef.current = player;
      } catch (err) {
        setError(err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SDK state updates only fire on actual changes (play/pause/seek/track
  // change), not every second — this ticks the displayed progress smoothly
  // in between, purely for the timeline UI. Paused at the last known
  // position when not playing.
  useEffect(() => {
    if (!playerState || playerState.paused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastStateUpdateRef.current.timestamp;
      setTickedProgressMs(Math.min(
        lastStateUpdateRef.current.position + elapsed,
        playerState.duration
      ));
    }, 250);

    return () => clearInterval(interval);
  }, [playerState]);

  const track = playerState?.track_window?.current_track ?? null;

  return {
    deviceId,
    isReady,
    error,
    isPlaying: playerState ? !playerState.paused : false,
    progressMs: tickedProgressMs,
    durationMs: playerState?.duration ?? 0,
    currentTrack: track
      ? {
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => a.name),
          albumName: track.album.name,
          albumArt: track.album.images?.[0]?.url ?? null,
        }
      : null,
    player: playerRef.current,
    togglePlay: () => playerRef.current?.togglePlay(),
    // The SDK's own nextTrack()/previousTrack() can silently no-op when
    // there's no in-session queue history yet (e.g. right after Drift
    // becomes the active device) — calling the Web API directly is more
    // reliable and matches standard Spotify behavior (previous restarts
    // the current track if you're more than a few seconds in, otherwise
    // it goes to the actual previous track).
    nextTrack: async () => {
      const token = await getValidTokenRef.current();
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    previousTrack: async () => {
      const token = await getValidTokenRef.current();
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    seek: (positionMs) => {
      // Update the local ticker immediately so the UI feels responsive
      // rather than waiting on the round-trip SDK state update.
      lastStateUpdateRef.current = { position: positionMs, timestamp: Date.now() };
      setTickedProgressMs(positionMs);
      playerRef.current?.seek(positionMs);
    },
  };
}

/**
 * Transfers playback to this browser tab's device so it becomes the active
 * Spotify Connect target. Call after isReady is true (e.g. on a "Play here"
 * button) — Spotify doesn't auto-transfer playback to a new device.
 */
export async function transferPlaybackHere(getValidToken, deviceId) {
  const token = await getValidToken();
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: true }),
  });
}
