import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import './App.css';
import { isLoggedIn } from './auth/config';
import { useMouseIdle } from './components/useMouseIdle';
import { useSpotifyToken } from './auth/useSpotifyToken';
import { useSpotifyPlayer, transferPlaybackHere } from './spotify/useSpotifyPlayer';
import { fetchLyrics, getActiveLyricIndex } from './lyrics/lrclib';
import { extractDominantColors } from './scenes/extractColors';
import { logPlayEvent } from './spotify/playEventLog';

import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { GradientBackdrop } from './components/GradientBackdrop';
import { TitleMoment } from './components/TitleMoment';
import { LyricsOverlay } from './components/LyricsOverlay';
import { NowPlayingBar } from './components/NowPlayingBar';
import { PlaybackControls } from './components/PlaybackControls';

const TITLE_MOMENT_DURATION_MS = 2200;
const DEFAULT_CHROME_COLOR = '#8b8578';

function MainApp() {
  const getValidToken = useSpotifyToken();
  const player = useSpotifyPlayer(getValidToken);

  const [lyricsState, setLyricsState] = useState({ synced: null, plain: null });
  const [palette, setPalette] = useState([]);
  const [showTitleMoment, setShowTitleMoment] = useState(false);
  const [hasTransferred, setHasTransferred] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const isControlsActive = useMouseIdle(3000);
  const titleTimerRef = useRef(null);

  const {
    currentTrack,
    isReady,
    deviceId,
    isPlaying,
    progressMs,
    durationMs,
    error,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
  } = player;

  const handleTogglePlay = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  useEffect(() => {
    if (isReady && deviceId && audioUnlocked && !hasTransferred) {
      transferPlaybackHere(getValidToken, deviceId)
        .then(() => setHasTransferred(true))
        .catch(() => {});
    }
  }, [isReady, deviceId, audioUnlocked, hasTransferred, getValidToken]);

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
      .then((r) => { if (!cancelled) setLyricsState(r); })
      .catch(() => { if (!cancelled) setLyricsState({ synced: null, plain: null }); });

    extractDominantColors(currentTrack.albumArt).then((colors) => {
      if (!cancelled) setPalette(colors);
    });

    setShowTitleMoment(true);
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      setShowTitleMoment(false);
    }, TITLE_MOMENT_DURATION_MS);

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => () => clearTimeout(titleTimerRef.current), []);

  const activeLyricIndex = useMemo(
    () => getActiveLyricIndex(lyricsState.synced, progressMs),
    [lyricsState.synced, progressMs]
  );

  const chromeColor = palette[0] ? lightenForChrome(palette[0]) : DEFAULT_CHROME_COLOR;

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

  if (isReady && !audioUnlocked) {
    return (
      <div className="state-message state-message--unlock">
        <p>Connected to Spotify.</p>
        <button className="state-message__unlock-button" onClick={() => setAudioUnlocked(true)}>
          Start listening
        </button>
        <p className="state-message__hint">
          One click to let this tab play audio — after this, you can control playback from your
          phone or anywhere else as usual.
        </p>
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
    <div className={`drift-stage ${isControlsActive ? '' : 'drift-stage--idle'}`}>
      <GradientBackdrop colors={palette} albumArtUrl={currentTrack.albumArt} />
      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        chromeColor={chromeColor}
      />

      {showTitleMoment ? (
        <TitleMoment track={currentTrack} chromeColor={chromeColor} />
      ) : (
        <LyricsOverlay
          syncedLines={lyricsState.synced}
          activeIndex={activeLyricIndex}
          plainFallback={lyricsState.plain}
        />
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        progressMs={progressMs}
        durationMs={durationMs}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrevious={previousTrack}
        onSeek={seek}
      />
    </div>
  );
}

function lightenForChrome(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * 0.55);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function App() {
  const [route, setRoute] = useState(() =>
    new URLSearchParams(window.location.search).has('code') ||
    new URLSearchParams(window.location.search).has('error')
      ? 'callback'
      : 'home'
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
