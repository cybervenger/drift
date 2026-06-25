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
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, []);
  return { isFs, toggle };
}

export function NowPlayingBar({ track, isPlaying, onTogglePlay }) {
  const { isFs, toggle: toggleFs } = useFullscreen();
  if (!track) return null;
  return (
    <div className="now-playing-bar">
      <div className="now-playing-bar__info">
        {track.albumArt && (
          <img className="now-playing-bar__art" src={track.albumArt} alt="" />
        )}
        <button className="now-playing-bar__playpause" onClick={onTogglePlay}>
          {isPlaying ? '\u275A\u275A' : '\u25B6'}
        </button>
        <span className="now-playing-bar__track">{track.name}</span>
        <span className="now-playing-bar__sep">\u2014</span>
        <span className="now-playing-bar__artist">{track.artists.join(', ')}</span>
      </div>
      <button
        className="now-playing-bar__fullscreen"
        onClick={toggleFs}
        title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
      >
        \u26F6
      </button>
    </div>
  );
}
