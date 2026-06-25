import { useEffect, useRef } from 'react';
import './GradientBackdrop.css';

const POSITIONS = [
  { top: '10%', left: '15%', size: '55%' },
  { top: '50%', left: '60%', size: '60%' },
  { top: '70%', left: '10%', size: '50%' },
  { top: '20%', left: '70%', size: '45%' },
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The permanent background layer for Drift: an animated gradient mesh
 * derived from the current track's album art colors, with the album art
 * itself blurred underneath, a slow breathing zoom on the whole composite,
 * and drifting particles on top.
 *
 * This is the always-available base — unlike scene videos (which depend on
 * sourced assets existing for a given mood), this needs nothing but the
 * album art every track already has, so there's never a blank/black state.
 */
export function GradientBackdrop({ colors, albumArtUrl }) {
  const meshRef = useRef(null);
  const particlesRef = useRef(null);
  const spawnIntervalRef = useRef(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !colors || colors.length === 0) return;

    mesh.innerHTML = '';
    colors.forEach((color, i) => {
      const blob = document.createElement('div');
      blob.className = 'gradient-backdrop__blob';
      const pos = POSITIONS[i % POSITIONS.length];
      blob.style.top = pos.top;
      blob.style.left = pos.left;
      blob.style.width = pos.size;
      blob.style.height = pos.size;
      blob.style.background = `radial-gradient(circle, ${hexToRgba(color, 0.9)} 0%, transparent 70%)`;
      blob.style.animationDuration = `${18 + i * 4}s`;
      blob.style.animationDelay = `${i * -3}s`;
      mesh.appendChild(blob);
    });
  }, [colors]);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    function spawnOne() {
      const p = document.createElement('div');
      p.className = 'gradient-backdrop__particle';
      const size = 2 + Math.random() * 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${12 + Math.random() * 10}s`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 24000);
    }

    for (let i = 0; i < 10; i++) {
      setTimeout(spawnOne, i * 500);
    }
    spawnIntervalRef.current = setInterval(spawnOne, 1100);

    return () => clearInterval(spawnIntervalRef.current);
  }, []);

  return (
    <div className="gradient-backdrop">
      <div className="gradient-backdrop__zoom-wrapper">
        <div className="gradient-backdrop__mesh" ref={meshRef} />
        {albumArtUrl && (
          <div className="gradient-backdrop__album">
            <img src={albumArtUrl} alt="" />
          </div>
        )}
      </div>
      <div className="gradient-backdrop__particles" ref={particlesRef} />
      <div className="gradient-backdrop__vignette" />
    </div>
  );
}
