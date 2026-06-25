import './SceneBackground.css';

// One solid color per scene — smooth CSS background-color transition
// replaces the video files that were placeholder paths.
const SCENE_COLORS = {
  'moonlit-forest': '#0e1a2e',
  'rain-window':    '#111822',
  'sunset-drift':   '#2a1200',
  'blue-river':     '#0a1e30',
  'autumn-fire':    '#1e0900',
  'night-storm':    '#0a0a18',
  'bright-energy':  '#1a0830',
  'easy-daylight':  '#0e2035',
};

const DEFAULT_COLOR = '#0d0d14';

export function SceneBackground({ scene }) {
  const bg = scene ? (SCENE_COLORS[scene.id] ?? DEFAULT_COLOR) : DEFAULT_COLOR;

  return (
    <div className="scene-background" style={{ backgroundColor: bg }}>
      <div className="scene-background__vignette" />
    </div>
  );
}
