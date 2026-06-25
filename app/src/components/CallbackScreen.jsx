import { useEffect, useState } from 'react';
import { handleAuthCallback } from '../auth/spotifyAuth';

export function CallbackScreen({ onComplete }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    handleAuthCallback()
      .then(() => {
        // Clean the ?code=... params out of the URL, then hand off.
        window.history.replaceState({}, '', import.meta.env.BASE_URL || '/');
        onComplete();
      })
      .catch((err) => setError(err.message));
  }, [onComplete]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        color: error ? '#e07a5f' : 'var(--drift-muted)',
        fontSize: '0.9rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {error ? `Login failed: ${error}` : 'Connecting to Spotify…'}
    </div>
  );
}
