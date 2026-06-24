// 1. Grab the playback controls from your player hook
  const { 
    currentTrack, isReady, deviceId, isPlaying, progressMs, durationMs, error,
    togglePlay, nextTrack, previousTrack, seek, setVolume 
  } = player;

  // ... (useEffect and other logic remains exactly the same)

  return (
    <div className="drift-stage">
      <SceneBackground scene={preset?.scene} />
      
      {/* 2. Pass the controls and timing data down to the UI */}
      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        progressMs={progressMs}
        durationMs={durationMs}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrev={previousTrack}
        onSeek={seek}
        onVolumeChange={setVolume}
        onToggleView={handleToggleView}
        viewMode={viewMode}
      />

      {viewMode === 'lyrics' && (
        <LyricsOverlay
          syncedLines={lyricsState.synced}
          activeIndex={activeLyricIndex}
          plainFallback={lyricsState.plain}
        />
      )}
    </div>
  );
