// Drift Spotify Player hook
import { useEffect, useRef, useState } from 'react';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

let sdkReadyPromise = null;
function loadSpotifySdk() {
  if (sdkReadyPromise) return sdkReadyPromise;

  sdkReadyPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  return sdkReadyPromise;
}

export function useSpotifyPlayer(getValidToken) {
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState(null);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  // Throttle refs — track changes and pause/play always go through immediately;
  // position-only updates are throttled to 500 ms so React doesn't re-render
  // the whole tree dozens of times per second.
  const lastTrackIdRef = useRef(null);
  const lastPausedRef = useRef(null);
  const lastPositionUpdateRef = useRef(0);

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

        player.addListener('not_ready', () => setIsReady(false));

        player.addListener('initialization_error', ({ message }) =>
          setError(new Error(`SDK init error: ${message}`))
        );
        player.addListener('authentication_error', ({ message }) =>
          setError(new Error(`SDK auth error: ${message}`))
        );
        player.addListener('account_error', ({ message }) =>
          setError(new Error(`SDK account error (Premium required): ${message}`))
        );

        player.addListener('player_state_changed', (state) => {
          if (!state) return;

          const newTrackId = state.track_window?.current_track?.id;
          const newPaused = state.paused;
          const trackChanged = newTrackId !== lastTrackIdRef.current;
          const pauseChanged = newPaused !== lastPausedRef.current;
          const now = Date.now();
          const positionDue = now - lastPositionUpdateRef.current >= 500;

          if (trackChanged || pauseChanged || positionDue) {
            lastTrackIdRef.current = newTrackId;
            lastPausedRef.current = newPaused;
            lastPositionUpdateRef.current = now;
            setPlayerState(state);
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
      playerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = playerState?.track_window?.current_track ?? null;

  return {
    deviceId,
    isReady,
    error,
    isPlaying: playerState ? !playerState.paused : false,
    progressMs: playerState?.position ?? 0,
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
  };
}

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
