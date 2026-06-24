import { useEffect, useState } from 'react';
import './SceneBackground.css';

/**
 * Renders the looping ambient scene video full-bleed, cross-dissolving
 * smoothly whenever the scene changes (i.e. whenever the track's matched
 * mood changes). This transition is Drift's signature moment — the visual
 * proof that the screen is actually responding to the music.
 */
export function SceneBackground({ scene }) {
  // Keep both the outgoing and incoming scene mounted briefly so we can
  // cross-fade between them rather than hard-cutting.
  const [layers, setLayers] = useState(() => (scene ? [{ scene, key: 0 }] : []));

  useEffect(() => {
    if (!scene) return;
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top?.scene.id === scene.id) return prev;
      const nextKey = (top?.key ?? -1) + 1;
      const next = [...prev, { scene, key: nextKey }];
      // Keep at most 2 layers — drop anything older once it's faded out.
      return next.slice(-2);
    });
  }, [scene]);

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => {
      setLayers((prev) => prev.slice(-1));
    }, 1800);
    return () => clearTimeout(timer);
  }, [layers]);

  return (
    <div className="scene-background">
      {layers.map((layer, i) => (
        <video
          key={layer.key}
          className="scene-background__layer"
          style={{ opacity: i === layers.length - 1 ? 1 : 0 }}
          src={layer.scene.file}
          autoPlay
          loop
          muted
          playsInline
        />
      ))}
      <div className="scene-background__vignette" />
    </div>
  );
}
