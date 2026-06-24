import { createPkcePair, getStoredVerifier, clearStoredVerifier } from './pkce';
import {
  SPOTIFY_CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  storeTokens,
  getRefreshToken,
} from './config';

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * Kicks off the Authorization Code + PKCE flow by redirecting to Spotify's
 * consent screen. Call this from a button click (e.g. "Connect Spotify").
 */
export async function redirectToSpotifyLogin() {
  const { challenge } = await createPkcePair();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: REDIRECT_URI,
  });

  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Call this on the /callback route. Reads ?code= from the URL, exchanges it
 * for tokens using the stashed PKCE verifier, and stores the result.
 * Returns true on success, throws on failure.
 */
export async function handleAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    throw new Error(`Spotify auth error: ${error}`);
  }
  if (!code) {
    throw new Error('No authorization code found in callback URL.');
  }

  const verifier = getStoredVerifier();
  if (!verifier) {
    throw new Error(
      'Missing PKCE verifier — the login flow may have started in a different tab/session.'
    );
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${detail}`);
  }

  const tokenData = await response.json();
  storeTokens(tokenData);
  clearStoredVerifier();
  return true;
}

/**
 * Exchanges the stored refresh token for a new access token.
 * Spotify may also rotate the refresh token — we store whatever comes back.
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available — user must log in again.');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${detail}`);
  }

  const tokenData = await response.json();
  storeTokens(tokenData);
  return tokenData.access_token;
}
