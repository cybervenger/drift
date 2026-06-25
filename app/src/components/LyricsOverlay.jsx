import './LyricsOverlay.css';

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
        <p className="lyrics-overlay__line lyrics-overlay__line--prev">{prev.text}</p>
      )}
      {/* key=activeIndex forces remount on each line change, triggering the CSS animation */}
      <p key={activeIndex} className="lyrics-overlay__line lyrics-overlay__line--current">
        {current?.text || '\u00A0'}
      </p>
      {next?.text && (
        <p className="lyrics-overlay__line lyrics-overlay__line--next">{next.text}</p>
      )}
    </div>
  );
}
