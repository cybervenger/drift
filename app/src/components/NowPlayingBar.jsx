import { useCallback, useEffect, useState } from 'react';
import './NowPlayingBar.css';

function useFullscreen() {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return { isFs, toggle };
}

export function NowPlayingBar({ track, isPlaying, onTogglePlay, onToggleView, viewMode }) {
  const { isFs, toggle: toggleFs } = useFullscreen();

  if (!track) return null;

  return (
    <div className="now-playing-bar">
      <div className="now-playing-bar__info">
        <button
          className="now-playing-bar__playpause"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❙❙' : '▶'}
        </button>
        <span className="now-playing-bar__track">{track.name}</span>
        <span className="now-playing-bar__sep">—</span>
        <span className="now-playing-bar__artist">{track.artists.join(', ')}</span>
      </div>
      <div className="now-playing-bar__actions">
        <button
          className="now-playing-bar__toggle"
          onClick={onToggleView}
          aria-label="Toggle lyrics/visual view"
        >
          {viewMode === 'lyrics' ? 'visual' : 'lyrics'}
        </button>
        <button
          className="now-playing-bar__fullscreen"
          onClick={toggleFs}
          aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFs ? '⛶' : '⛶'}
        </button>
      </div>
    </div>
  );
}
