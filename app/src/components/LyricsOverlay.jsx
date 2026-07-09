import './LyricsOverlay.css';

export function LyricsOverlay({ syncedLines, activeIndex, plainFallback, onSeek }) {
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
        <pre className="lyrics-overlay__plain-text">{plainFallback}</pre>
      </div>
    );
  }

  const prev = activeIndex > 0 ? syncedLines[activeIndex - 1] : null;
  const curr = activeIndex >= 0 ? syncedLines[activeIndex] : null;
  const next = activeIndex < syncedLines.length - 1 ? syncedLines[activeIndex + 1] : null;

  return (
    <div className="lyrics-overlay lyrics-overlay--karaoke">
      <p
        className={'lyrics-overlay__line lyrics-overlay__line--prev' + (prev ? '' : ' lyrics-overlay__line--hidden')}
        onClick={() => prev && onSeek?.(prev.timeMs)}
      >
        {prev?.text || '\u00A0'}
      </p>
      <p
        className="lyrics-overlay__line lyrics-overlay__line--current"
        onClick={() => curr && onSeek?.(curr.timeMs)}
      >
        {curr?.text || '\u00A0'}
      </p>
      <p
        className={'lyrics-overlay__line lyrics-overlay__line--next' + (next ? '' : ' lyrics-overlay__line--hidden')}
        onClick={() => next && onSeek?.(next.timeMs)}
      >
        {next?.text || '\u00A0'}
      </p>
    </div>
  );
}
