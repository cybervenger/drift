import './NowPlayingBar.css';

export function NowPlayingBar({ track, isPlaying, chromeColor }) {
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
    </div>
  );
}
