import './LyricsOverlay.css';

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
export function LyricsOverlay({ syncedLines, activeIndex, plainFallback }) {
  if (!syncedLines && !plainFallback) {
    return null;
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
      )}
    </div>
  );
}
