import './NowPlayingBar.css';

export function NowPlayingBar({ track, isPlaying, onToggleView, viewMode }) {
  if (!track) return null;

  return (
    <div className="now-playing-bar">
      <div className="now-playing-bar__info">
        <span className="now-playing-bar__status">{isPlaying ? '▶' : '❙❙'}</span>
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
