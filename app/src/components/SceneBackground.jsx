import { useEffect, useState } from 'react';
import './SceneBackground.css';

// Gradient palettes keyed by scene id — used instead of video files
// so the app always has a rich visual background without requiring
// video assets to be hosted separately.
const SCENE_GRADIENTS = {
  'moonlit-forest': 'radial-gradient(ellipse at 30% 20%, #1a2a4a 0%, #0d1520 50%, #060d14 100%)',
  'rain-window':    'radial-gradient(ellipse at 50% 0%, #1c2535 0%, #0a0f18 60%, #050810 100%)',
  'sunset-drift':   'radial-gradient(ellipse at 50% 100%, #8b3a1a 0%, #c4621e 20%, #e8a040 40%, #7a3060 70%, #1a0d2e 100%)',
  'blue-river':     'radial-gradient(ellipse at 40% 60%, #1a4060 0%, #0d2540 50%, #060f1e 100%)',
  'autumn-fire':    'radial-gradient(ellipse at 50% 80%, #7a2a00 0%, #c45a10 25%, #8b3500 50%, #1e0d05 100%)',
  'night-storm':    'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0d0d1e 50%, #050508 100%)',
  'bright-energy':  'radial-gradient(ellipse at 60% 40%, #3a1a6e 0%, #6a1a8e 30%, #1a0a3e 70%, #050310 100%)',
  'easy-daylight':  'radial-gradient(ellipse at 50% 30%, #4a7a9e 0%, #2a5a7e 40%, #1a3a5e 70%, #0d1e30 100%)',
};

const DEFAULT_GRADIENT = 'radial-gradient(ellipse at 50% 50%, #0d1520 0%, #060a10 100%)';

export function SceneBackground({ scene, dominantColors }) {
  const [current, setCurrent] = useState(scene);
  const [prev, setPrev] = useState(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!scene) return;
    if (scene?.id === current?.id) return;
    setPrev(current);
    setCurrent(scene);
    setFading(true);
    const t = setTimeout(() => { setPrev(null); setFading(false); }, 1800);
    return () => clearTimeout(t);
  }, [scene?.id]);

  const gradient = (s) => {
    if (!s) {
      // Fall back to album art dominant color if available
      if (dominantColors && dominantColors[0]) {
        const [r, g, b] = dominantColors[0];
        return `radial-gradient(ellipse at 40% 30%, rgba(${r},${g},${b},0.8) 0%, rgba(${Math.round(r*0.3)},${Math.round(g*0.3)},${Math.round(b*0.3)},1) 100%)`;
      }
      return DEFAULT_GRADIENT;
    }
    return SCENE_GRADIENTS[s.id] || DEFAULT_GRADIENT;
  };

  return (
    <div className="scene-background">
      {prev && (
        <div
          className="scene-background__layer"
          style={{ background: gradient(prev), opacity: fading ? 0 : 1 }}
        />
      )}
      <div
        className="scene-background__layer"
        style={{ background: gradient(current), opacity: 1 }}
      />
      <div className="scene-background__vignette" />
    </div>
  );
}
