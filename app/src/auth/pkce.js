// PKCE (Proof Key for Code Exchange) helpers for Spotify Authorization Code flow.
// No client secret is ever used or stored — this is the correct flow for a
// pure client-side app like Drift.

const CODE_VERIFIER_KEY = 'drift_pkce_code_verifier';

/**
 * Generates a cryptographically random string used as the PKCE code verifier.
 */
function generateRandomString(length) {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((v) => possible[v % possible.length])
    .join('');
}

/**
 * SHA-256 hashes the verifier and base64url-encodes it, per the PKCE spec.
 */
async function sha256Base64Url(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Creates a fresh code verifier + challenge pair, and stashes the verifier
 * in sessionStorage so it survives the redirect to Spotify and back.
 */
export async function createPkcePair() {
  const verifier = generateRandomString(64);
  const challenge = await sha256Base64Url(verifier);
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
  return { verifier, challenge };
}

export function getStoredVerifier() {
  return sessionStorage.getItem(CODE_VERIFIER_KEY);
}

export function clearStoredVerifier() {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
}
