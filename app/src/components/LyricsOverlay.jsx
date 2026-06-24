import './LyricsOverlay.css';

/**
 * Shows the active lyric line large and bright, with the line before/after
 * faded — classic lyric-video rhythm, but restrained: no karaoke-style
 * word-by-word highlighting, just a calm line-by-line breathe.
 */
export function LyricsOverlay({ syncedLines, activeIndex, plainFallback }) {
  if (!syncedLines && !plainFallback) {
    return null;
  }

  if (!syncedLines) {
    // No timing data — show plain lyrics in a quieter, static treatment
    // rather than pretending we can sync something we don't have.
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
      {prev?.text && <p className="lyrics-overlay__line lyrics-overlay__line--prev">{prev.text}</p>}
      <p className="lyrics-overlay__line lyrics-overlay__line--current">
        {current?.text || '\u00A0'}
      </p>
      {next?.text && <p className="lyrics-overlay__line lyrics-overlay__line--next">{next.text}</p>}
    </div>
  );
}
