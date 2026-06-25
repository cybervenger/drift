import './NowPlayingBar.css';

export function NowPlayingBar({ track, isPlaying, onTogglePlay, onToggleView, viewMode }) {
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
      <button
        className="now-playing-bar__toggle"
        onClick={onToggleView}
        aria-label="Toggle lyrics/visual view"
      >
        {viewMode === 'lyrics' ? 'visual' : 'lyrics'}
      </button>
    </div>
  );
}
