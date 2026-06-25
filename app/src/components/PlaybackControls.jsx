import { useState, useCallback } from 'react';
import './PlaybackControls.css';

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function PlaybackControls({
  isPlaying,
  progressMs,
  durationMs,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
}) {
  // While dragging, show the drag position instead of live progress so the
  // scrub feels direct rather than fighting the real playback position.
  const [dragMs, setDragMs] = useState(null);

  const displayMs = dragMs ?? progressMs;
  const percent = durationMs > 0 ? (displayMs / durationMs) * 100 : 0;

  const handleScrub = useCallback((e) => {
    const value = Number(e.target.value);
    setDragMs(value);
  }, []);

  const handleScrubCommit = useCallback(
    (e) => {
      const value = Number(e.target.value);
      onSeek(value);
      setDragMs(null);
    },
    [onSeek]
  );

  return (
    <div className="playback-controls">
      <div className="playback-controls__buttons">
        <button
          className="playback-controls__icon-button"
          onClick={onPrevious}
          aria-label="Previous track"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          className="playback-controls__icon-button playback-controls__icon-button--primary"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 5v14l12-7z" />
            </svg>
          )}
        </button>

        <button
          className="playback-controls__icon-button"
          onClick={onNext}
          aria-label="Next track"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
          </svg>
        </button>
      </div>

      <div className="playback-controls__timeline">
        <span className="playback-controls__time">{formatTime(displayMs)}</span>
        <input
          className="playback-controls__scrubber"
          type="range"
          min={0}
          max={durationMs || 1}
          value={displayMs}
          onChange={handleScrub}
          onMouseUp={handleScrubCommit}
          onTouchEnd={handleScrubCommit}
          style={{ '--progress-percent': `${percent}%` }}
          aria-label="Seek"
        />
        <span className="playback-controls__time">{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}
