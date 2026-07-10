import { useEffect, useRef } from 'react';
import './LyricsOverlay.css';

export function LyricsOverlay({ syncedLines, activeIndex, plainFallback, onSeek }) {
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);
  const userScrollingRef = useRef(false);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    if (userScrollingRef.current) return;
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex]);

  const handleScroll = () => {
    userScrollingRef.current = true;
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => { userScrollingRef.current = false; }, 3000);
  };

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

  return (
    <div
      className="lyrics-overlay lyrics-overlay--scroll"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="lyrics-overlay__pad" />
      {syncedLines.map((line, i) => {
        const dist = i - activeIndex;
        let cls;
        if      (dist === 0)  cls = 'lyrics-overlay__line--current';
        else if (dist === -1) cls = 'lyrics-overlay__line--prev';
        else if (dist === 1)  cls = 'lyrics-overlay__line--next';
        else                  cls = 'lyrics-overlay__line--far';

        return (
          <p
            key={line.timeMs}
            ref={dist === 0 ? activeLineRef : null}
            className={'lyrics-overlay__line ' + cls}
            onClick={() => onSeek?.(line.timeMs)}
          >
            {line.text || '\u00A0'}
          </p>
        );
      })}
      <div className="lyrics-overlay__pad" />
    </div>
  );
}
