import './LyricsOverlay.css';

<<<<<<< HEAD
/**
 * Shows the active lyric line large and bright, with the line before/after
 * faded — classic lyric-video rhythm, but restrained: no karaoke-style
 * word-by-word highlighting, just a calm line-by-line breathe.
 *
 * Each line is keyed by its timeMs (a stable, unique identity per line in
 * the song) so React actually mounts a fresh element when the active line
 * changes, rather than reusing the same node and silently skipping the
 * enter transition.
 */
=======
>>>>>>> cd21118bcb0443aaaa47f2f8a982db2959513807
export function LyricsOverlay({ syncedLines, activeIndex, plainFallback }) {
  if (!syncedLines && !plainFallback) {
    return (
      <div className="lyrics-overlay lyrics-overlay--none">
        <p className="lyrics-overlay__none-text">No lyrics found for this track.</p>
      </div>
    );
  }

  if (!syncedLines) {
    return (
      <div className="lyrics-overlay lyrics-overlay--plain">
        <p className="lyrics-overlay__plain-text">{plainFallback}</p>
      </div>
    );
  }

  const prev = activeIndex > 0 ? syncedLines[activeIndex - 1] : null;
  const current = activeIndex >= 0 ? syncedLines[activeIndex] : null;
  const next =
    activeIndex >= -1 && activeIndex + 1 < syncedLines.length
      ? syncedLines[activeIndex + 1]
      : null;

  return (
    <div className="lyrics-overlay">
      {prev?.text && (
<<<<<<< HEAD
        <p key={`prev-${prev.timeMs}`} className="lyrics-overlay__line lyrics-overlay__line--prev">
          {prev.text}
        </p>
      )}
      <p
        key={`current-${current?.timeMs ?? 'empty'}`}
        className="lyrics-overlay__line lyrics-overlay__line--current"
      >
        {current?.text || '\u00A0'}
      </p>
      {next?.text && (
        <p key={`next-${next.timeMs}`} className="lyrics-overlay__line lyrics-overlay__line--next">
          {next.text}
        </p>
=======
        <p className="lyrics-overlay__line lyrics-overlay__line--prev">{prev.text}</p>
      )}
      {/* key=activeIndex forces remount on each line change, triggering the CSS animation */}
      <p key={activeIndex} className="lyrics-overlay__line lyrics-overlay__line--current">
        {current?.text || '\u00A0'}
      </p>
      {next?.text && (
        <p className="lyrics-overlay__line lyrics-overlay__line--next">{next.text}</p>
>>>>>>> cd21118bcb0443aaaa47f2f8a982db2959513807
      )}
    </div>
  );
}
