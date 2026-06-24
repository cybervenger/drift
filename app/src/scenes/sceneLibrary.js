// The scene library: each entry is a looping background tagged with the
// energy/tone taxonomy we settled on. `file` paths are placeholders until
// real loop assets are sourced and dropped into /public/scenes.
//
// energy: 'calm' | 'moderate' | 'high'
// tone:   'warm' | 'cool' | 'dark' | 'bright'

export const SCENE_LIBRARY = [
  {
    id: 'moonlit-forest',
    energy: 'calm',
    tone: 'cool',
    file: '/scenes/moonlit-forest.mp4',
    label: 'Moonlit forest, night sky',
  },
  {
    id: 'rain-window',
    energy: 'calm',
    tone: 'dark',
    file: '/scenes/rain-window.mp4',
    label: 'Quiet rain on a window, night',
  },
  {
    id: 'sunset-drift',
    energy: 'calm',
    tone: 'warm',
    file: '/scenes/sunset-drift.mp4',
    label: 'Sunset clouds, golden hour drift',
  },
  {
    id: 'blue-river',
    energy: 'moderate',
    tone: 'cool',
    file: '/scenes/blue-river.mp4',
    label: 'Flowing river, blue hour',
  },
  {
    id: 'autumn-fire',
    energy: 'moderate',
    tone: 'warm',
    file: '/scenes/autumn-fire.mp4',
    label: 'Autumn leaves, fireplace glow',
  },
  {
    id: 'night-storm',
    energy: 'high',
    tone: 'dark',
    file: '/scenes/night-storm.mp4',
    label: 'Storm, thunder, night rain',
  },
  {
    id: 'bright-energy',
    energy: 'high',
    tone: 'bright',
    file: '/scenes/bright-energy.mp4',
    label: 'Vivid abstract motion, high energy',
  },
  {
    id: 'easy-daylight',
    energy: 'moderate',
    tone: 'bright',
    file: '/scenes/easy-daylight.mp4',
    label: 'Upbeat but easy, daylight',
  },
];

const ENERGY_ORDER = ['calm', 'moderate', 'high'];
const TONE_GROUPS = {
  warm: ['warm', 'bright', 'dark', 'cool'],
  cool: ['cool', 'dark', 'warm', 'bright'],
  dark: ['dark', 'cool', 'warm', 'bright'],
  bright: ['bright', 'warm', 'cool', 'dark'],
};

/**
 * Finds the closest scene in the library to a given {energy, tone} mood.
 * Exact match wins; otherwise scores by energy distance + tone preference
 * order, so a missing exact combo still lands somewhere sensible (e.g.
 * high+warm falls back to high+dark or moderate+warm rather than a random pick).
 */
export function matchScene(mood) {
  const { energy, tone } = mood;

  const exact = SCENE_LIBRARY.find((s) => s.energy === energy && s.tone === tone);
  if (exact) return exact;

  const toneRank = TONE_GROUPS[tone] || TONE_GROUPS.cool;

  let best = null;
  let bestScore = Infinity;

  for (const scene of SCENE_LIBRARY) {
    const energyDist = Math.abs(
      ENERGY_ORDER.indexOf(scene.energy) - ENERGY_ORDER.indexOf(energy)
    );
    const toneDist = toneRank.indexOf(scene.tone);
    // Energy mismatch matters more than tone mismatch for how a scene "feels".
    const score = energyDist * 10 + toneDist;

    if (score < bestScore) {
      bestScore = score;
      best = scene;
    }
  }

  return best;
}

export function getSceneById(id) {
  return SCENE_LIBRARY.find((s) => s.id === id) ?? null;
}
