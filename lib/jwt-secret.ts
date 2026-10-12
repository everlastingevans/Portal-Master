// Shared by middleware (Edge runtime) and lib/auth (Node), so no Node-only imports here.

const DEV_ONLY_SECRET = 'launchpath-local-dev-only-jwt-secret';

/**
 * The HS256 signing key. Production must set JWT_SECRET: with a known fallback anyone could forge a
 * SUPERADMIN token. Resolved at call time (not import time) so `next build` doesn't need the secret,
 * and a missing secret fails closed: signing throws and verification rejects every token.
 */
export function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set. Refusing to sign or verify sessions with a default key.');
  }
  return new TextEncoder().encode(DEV_ONLY_SECRET);
}
