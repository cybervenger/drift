// Central config + token storage for Spotify auth.
// CLIENT_ID is not a secret — it's meant to be public and ships in the
// client bundle. Nothing secret lives in this file or anywhere in /app.

export const SPOTIFY_CLIENT_ID = 'af20348169f743c3b25af572cc81d01f';

// Must exactly match a Redirect URI registered in the Spotify Dashboard.
// 127.0.0.1 (not localhost) for local dev, per Spotify's loopback exception.
export const REDIRECT_URI =
  import.meta.env.VITE_REDIRECT_URI || 'http://127.0.0.1:5173/callback';

// Scopes needed:
// - streaming: required for Web Playback SDK
// - user-read-email / user-read-private: required by the SDK to init a player
// - user-read-playback-state / user-modify-playback-state: read & control playback
export const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

const ACCESS_TOKEN_KEY = 'drift_access_token';
const REFRESH_TOKEN_KEY = 'drift_refresh_token';
const EXPIRES_AT_KEY = 'drift_expires_at';

export function storeTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
  // expires_in is in seconds; store an absolute timestamp with a 60s safety margin.
  const expiresAt = Date.now() + (expires_in - 60) * 1000;
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isTokenExpired() {
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAt) return true;
  return Date.now() > Number(expiresAt);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}

export function isLoggedIn() {
  return Boolean(getAccessToken()) && Boolean(getRefreshToken());
}
