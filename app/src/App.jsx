import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { isLoggedIn } from './auth/config';
import { useSpotifyToken } from './auth/useSpotifyToken';
import { useSpotifyPlayer, transferPlaybackHere } from './spotify/useSpotifyPlayer';
import { fetchLyrics, getActiveLyricIndex } from './lyrics/lrclib';
import { extractDominantColors } from './scenes/extractColors';
import { logPlayEvent } from './spotify/playEventLog';
import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { LyricsOverlay } from './components/LyricsOverlay';
import { NowPlayingBar } from './components/NowPlayingBar';

/** Animated color-blob backdrop derived from album art palette. */
function GradientBackdrop({ colors }) {
  const palette = (colors && colors.length > 0) ? colors : [[80, 40, 130], [30, 60, 120], [100, 30, 80]];
  const blobs = [
    { c: palette[0], x: '12%',  y: '45%', s: '75vmax', delay: '0s',   dur: '14s' },
    { c: palette[1] || palette[0], x: '78%',  y: '18%', s: '65vmax', delay: '-5s',  dur: '17s' },
    { c: palette[2] || palette[0], x: '50%',  y: '80%', s: '58vmax', delay: '-9s',  dur: '11s' },
    { c: palette[3] || palette[1] || palette[0], x: '32%', y: '12%', s: '48vmax', delay: '-3s', dur: '15s' },
  ];
  return (
    <div className="gradient-backdrop" aria-hidden="true">
      {blobs.map((b, i) => (
        <div key={i} className="gradient-backdrop__blob" style={{
          left: b.x, top: b.y, width: b.s, height: b.s,
          background: `radial-gradient(circle, rgba(${b.c[0]},${b.c[1]},${b.c[2]},0.6) 0%, transparent 70%)`,
          animationDelay: b.delay,
          animationDuration: b.dur,
        }} />
      ))}
      <div className="gradient-backdrop__vignette" />
    </div>
  );
}

function MainApp() {
  const getValidToken = useSpotifyToken();
  const playerHook = useSpotifyPlayer(getValidToken);
  const { currentTrack, isReady, deviceId, isPlaying, progressMs,
          durationMs, error, player: sdkPlayer, connect } = playerHook;

  const [lyricsState, setLyricsState] = useState({ synced: null, plain: null });
  const [palette, setPalette] = useState([]);
  const [hasTransferred, setHasTransferred] = useState(false);
  const [liveProgressMs, setLiveProgressMs] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);
  const syncRef = useRef({ progressMs: 0, timestamp: 0 });

  useEffect(() => {
    syncRef.current = { progressMs, timestamp: Date.now() };
    setLiveProgressMs(progressMs);
  }, [progressMs]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const { progressMs: base, timestamp } = syncRef.current;
      setLiveProgressMs(base + (Date.now() - timestamp));
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (isReady && deviceId && !hasTransferred) {
      transferPlaybackHere(getValidToken, deviceId)
        .then(() => setHasTransferred(true))
        .catch(() => {});
    }
  }, [isReady, deviceId, hasTransferred, getValidToken]);

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
      .then(r => { if (!cancelled) setLyricsState(r); })
      .catch(() => { if (!cancelled) setLyricsState({ synced: null, plain: null }); });
    extractDominantColors(currentTrack.albumArt)
      .then(colors => { if (!cancelled) setPalette(colors && colors.length > 0 ? colors : [[80,40,130],[30,60,120],[100,30,80]]); })
      .catch(() => { if (!cancelled) setPalette([[80,40,130],[30,60,120],[100,30,80]]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const activeLyricIndex = useMemo(
    () => getActiveLyricIndex(lyricsState.synced, liveProgressMs),
    [lyricsState.synced, liveProgressMs]
  );

  const handleTogglePlay = useCallback(() => {
    sdkPlayer?.togglePlay();
  }, [sdkPlayer]);

  const handleUnlock = useCallback(async () => {
    setUnlocking(true);
    setUnlockError(null);
    try {
      await connect();
      setAudioUnlocked(true);
    } catch (err) {
      setUnlockError(err);
    } finally {
      setUnlocking(false);
    }
  }, [connect]);

  if (error) {
    return (
      <div className="state-message state-message--error">
        {error.message}
        {error.message.includes('Premium') && (
          <p className="state-message__hint">Drift requires Spotify Premium.</p>
        )}
      </div>
    );
  }

  if (!audioUnlocked) {
    return (
      <div className="state-message state-message--unlock">
        <p>drift</p>
        <button
          className="state-message__unlock-button"
          onClick={handleUnlock}
          disabled={unlocking}
        >
          {unlocking ? 'Connecting…' : 'Start listening'}
        </button>
        {unlockError && (
          <p style={{ color: '#e07a5f', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {unlockError.message}
          </p>
        )}
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="state-message">
        {isReady
          ? 'Connected. Start playing something on Spotify.'
          : 'Connecting to Spotify…'}
      </div>
    );
  }

  return (
    <div className="drift-stage">
      <GradientBackdrop colors={palette} />
      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
      />
      <LyricsOverlay
        syncedLines={lyricsState.synced}
        activeIndex={activeLyricIndex}
        plainFallback={lyricsState.plain}
      />
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(() =>
    new URLSearchParams(window.location.search).has('code') ||
    new URLSearchParams(window.location.search).has('error')
      ? 'callback' : 'home'
  );
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  if (route === 'callback') {
    return (
      <CallbackScreen onComplete={() => { setLoggedIn(true); setRoute('home'); }} />
    );
  }
  if (!loggedIn) return <LoginScreen />;
  return <MainApp />;
}

export default App;
