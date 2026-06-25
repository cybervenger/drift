import { useEffect, useRef, useState } from 'react';

/**
 * Returns true while the mouse has moved recently, false after `timeoutMs`
 * of no movement. Used to auto-hide playback controls so they don't sit
 * permanently over the lyrics/visual, while still being reachable by
 * just moving the mouse.
 */
export function useMouseIdle(timeoutMs = 3000) {
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    function handleActivity() {
      setIsActive(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsActive(false), timeoutMs);
    }

    handleActivity();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return isActive;
}
