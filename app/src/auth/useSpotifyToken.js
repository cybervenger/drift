import { useCallback } from 'react';
import { getAccessToken, isTokenExpired, isLoggedIn, clearTokens } from './config';
import { refreshAccessToken } from './spotifyAuth';

/**
 * Returns a function you can call to get a guaranteed-fresh access token.
 * Refreshes automatically if the stored token has expired.
 *
 * Usage:
 *   const getValidToken = useSpotifyToken();
 *   const token = await getValidToken();
 */
export function useSpotifyToken() {
  return useCallback(async () => {
    if (!isLoggedIn()) {
      throw new Error('Not logged in to Spotify.');
    }

    if (isTokenExpired()) {
      try {
        return await refreshAccessToken();
      } catch (err) {
        // Refresh token itself is invalid/expired — force a clean re-login
        // rather than looping on a broken token.
        clearTokens();
        throw err;
      }
    }

    return getAccessToken();
  }, []);
}
