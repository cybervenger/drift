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

export function NowPlayingBar({ track, isPlaying, chromeColor }) {
  const { isFs, toggle: toggleFs } = useFullscreen();

  if (!track) return null;

  return (
    <div className="now-playing-bar">
      <div className="now-playing-bar__info">
        {track.albumArt && (
          <img className="now-playing-bar__art" src={track.albumArt} alt="" />
        )}
        <span className="now-playing-bar__status">{isPlaying ? '▶' : '❙❙'}</span>
        <span className="now-playing-bar__track">{track.name}</span>
        <span className="now-playing-bar__sep" style={{ color: chromeColor }}>
          —
        </span>
        <span className="now-playing-bar__artist" style={{ color: chromeColor }}>
          {track.artists.join(', ')}
        </span>
      </div>
      <div className="now-playing-bar__actions">
        <button
          className="now-playing-bar__fullscreen"
          onClick={toggleFs}
          aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
