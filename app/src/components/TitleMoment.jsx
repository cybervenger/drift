import './TitleMoment.css';

/**
 * The brief, large title/artist moment shown right when a track starts,
 * before handing off to the quieter lyrics view. This is the "photo-worthy"
 * entrance — track name rises in with a blur-to-sharp focus pull, artist
 * name settles in beneath it.
 */
export function TitleMoment({ track, chromeColor }) {
  if (!track) return null;

  return (
    <div className="title-moment">
      <div key={`track-${track.id}`} className="title-moment__track">
        {track.name}
      </div>
      <div
        key={`artist-${track.id}`}
        className="title-moment__artist"
        style={{ color: chromeColor }}
      >
        {track.artists.join(', ')}
      </div>
    </div>
  );
}
