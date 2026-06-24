import { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import { isLoggedIn } from './auth/config';
import { useSpotifyToken } from './auth/useSpotifyToken';
import { useSpotifyPlayer, transferPlaybackHere } from './spotify/useSpotifyPlayer';
import { fetchLyrics, getActiveLyricIndex } from './lyrics/lrclib';
import { extractDominantColors } from './scenes/extractColors';
import { resolveTrackPreset } from './mood/moodPreset';
import { logPlayEvent } from './spotify/playEventLog';

import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { SceneBackground } from './components/SceneBackground';
import { LyricsOverlay } from './components/LyricsOverlay';
import { NowPlayingBar } from './components/NowPlayingBar';

function MainApp() {
  const getValidToken = useSpotifyToken();
  const player = useSpotifyPlayer(getValidToken);

  const [viewMode, setViewMode] = useState('lyrics'); // 'lyrics' | 'visual'
  const [lyricsState, setLyricsState] = useState({ synced: null, plain: null });
  const [preset, setPreset] = useState(null);
  const [hasTransferred, setHasTransferred] = useState(false);

  const { currentTrack, isReady, deviceId, isPlaying, progressMs, durationMs, error } = player;

  // Once the SDK device is ready, move playback here so the app actually
  // becomes the active Spotify Connect target.
  useEffect(() => {
    if (isReady && deviceId && !hasTransferred) {
      transferPlaybackHere(getValidToken, deviceId)
        .then(() => setHasTransferred(true))
        .catch(() => {
          /* user can still press play from another device manually */
        });
    }
  }, [isReady, deviceId, hasTransferred, getValidToken]);

  // Re-resolve lyrics + mood preset whenever the track actually changes.
  useEffect(() => {
    if (!currentTrack) return;

    logPlayEvent('track_started', currentTrack);

    let cancelled = false;

    fetchLyrics({
      trackName: currentTrack.name,
      artistName: currentTrack.artists[0],
      albumName: currentTrack.albumName,
      durationSec: durationMs / 1000,
    })
      .then((result) => {
        if (!cancelled) setLyricsState(result);
      })
      .catch(() => {
        if (!cancelled) setLyricsState({ synced: null, plain: null });
      });

    extractDominantColors(currentTrack.albumArt)
      .then((colors) => resolveTrackPreset(currentTrack, colors))
      .then((resolved) => {
        if (!cancelled) setPreset(resolved);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const activeLyricIndex = useMemo(
    () => getActiveLyricIndex(lyricsState.synced, progressMs),
    [lyricsState.synced, progressMs]
  );

  const handleToggleView = useCallback(() => {
    setViewMode((m) => (m === 'lyrics' ? 'visual' : 'lyrics'));
  }, []);

  if (error) {
    return (
      <div className="state-message state-message--error">
        {error.message}
        {error.message.includes('Premium') && (
          <p className="state-message__hint">
            Drift's playback requires Spotify Premium.
          </p>
        )}
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="state-message">
        {isReady
          ? 'Connected. Start playing something on Spotify to bring Drift to life.'
          : 'Connecting to Spotify…'}
      </div>
    );
  }

  return (
    <div className="drift-stage">
      <SceneBackground scene={preset?.scene} />
      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        onToggleView={handleToggleView}
        viewMode={viewMode}
      />
      {viewMode === 'lyrics' && (
        <LyricsOverlay
          syncedLines={lyricsState.synced}
          activeIndex={activeLyricIndex}
          plainFallback={lyricsState.plain}
        />
      )}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(() =>
    new URLSearchParams(window.location.search).has('code') || new URLSearchParams(window.location.search).has('error') ? 'callback' : 'home'
  );
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  if (route === 'callback') {
    return (
      <CallbackScreen
        onComplete={() => {
          setLoggedIn(true);
          setRoute('home');
        }}
      />
    );
  }

  if (!loggedIn) {
    return <LoginScreen />;
  }

  return <MainApp />;
}

export default App;
import { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import { isLoggedIn } from './auth/config';
import { useSpotifyToken } from './auth/useSpotifyToken';
import { useSpotifyPlayer, transferPlaybackHere } from './spotify/useSpotifyPlayer';
import { fetchLyrics, getActiveLyricIndex } from './lyrics/lrclib';
import { extractDominantColors } from './scenes/extractColors';
import { resolveTrackPreset } from './mood/moodPreset';
import { logPlayEvent } from './spotify/playEventLog';

import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { SceneBackground } from './components/SceneBackground';
import { LyricsOverlay } from './components/LyricsOverlay';
import { NowPlayingBar } from './components/NowPlayingBar';

function MainApp() {
  const getValidToken = useSpotifyToken();
  const player = useSpotifyPlayer(getValidToken);

  const [viewMode, setViewMode] = useState('lyrics'); // 'lyrics' | 'visual'
  const [lyricsState, setLyricsState] = useState({ synced: null, plain: null });
  const [preset, setPreset] = useState(null);
  const [hasTransferred, setHasTransferred] = useState(false);

  const { currentTrack, isReady, deviceId, isPlaying, progressMs, durationMs, error } = player;

  // Once the SDK device is ready, move playback here so the app actually
  // becomes the active Spotify Connect target.
  useEffect(() => {
    if (isReady && deviceId && !hasTransferred) {
      transferPlaybackHere(getValidToken, deviceId)
        .then(() => setHasTransferred(true))
        .catch(() => {
          /* user can still press play from another device manually */
        });
    }
  }, [isReady, deviceId, hasTransferred, getValidToken]);

  // Re-resolve lyrics + mood preset whenever the track actually changes.
  useEffect(() => {
    if (!currentTrack) return;

    logPlayEvent('track_started', currentTrack);

    let cancelled = false;

    fetchLyrics({
      trackName: currentTrack.name,
      artistName: currentTrack.artists[0],
      albumName: currentTrack.albumName,
      durationSec: durationMs / 1000,
    })
      .then((result) => {
        if (!cancelled) setLyricsState(result);
      })
      .catch(() => {
        if (!cancelled) setLyricsState({ synced: null, plain: null });
      });

    extractDominantColors(currentTrack.albumArt)
      .then((colors) => resolveTrackPreset(currentTrack, colors))
      .then((resolved) => {
        if (!cancelled) setPreset(resolved);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const activeLyricIndex = useMemo(
    () => getActiveLyricIndex(lyricsState.synced, progressMs),
    [lyricsState.synced, progressMs]
  );

  const handleToggleView = useCallback(() => {
    setViewMode((m) => (m === 'lyrics' ? 'visual' : 'lyrics'));
  }, []);

  if (error) {
    return (
      <div className="state-message state-message--error">
        {error.message}
        {error.message.includes('Premium') && (
          <p className="state-message__hint">
            Drift's playback requires Spotify Premium.
          </p>
        )}
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="state-message">
        {isReady
          ? 'Connected. Start playing something on Spotify to bring Drift to life.'
          : 'Connecting to Spotify…'}
      </div>
    );
  }

  return (
    <div className="drift-stage">
      <SceneBackground scene={preset?.scene} />
      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        onToggleView={handleToggleView}
        viewMode={viewMode}
      />
      {viewMode === 'lyrics' && (
        <LyricsOverlay
          syncedLines={lyricsState.synced}
          activeIndex={activeLyricIndex}
          plainFallback={lyricsState.plain}
        />
      )}
    </div>
  );
}
