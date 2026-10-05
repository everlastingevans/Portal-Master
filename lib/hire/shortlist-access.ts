import { createHash, randomBytes } from 'crypto';

/**
 * Shortlist share links. The raw token is 256 bits of randomness, given to the employer once in the
 * link `/shortlist#t=<token>` (a URL fragment, so it never reaches server logs, analytics or Referer
 * headers). Only its SHA-256 hash is stored.
 */
export const DEFAULT_LINK_DAYS = 14;
export const MAX_LINK_DAYS = 60;

export function generateShortlistToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashShortlistToken(token) };
}

export function hashShortlistToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Shape check before touching the database (43 base64url chars for 32 bytes). */
export function isWellFormedToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function shortlistUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za';
  return `${base}/shortlist#t=${token}`;
}

export type LinkState = 'ok' | 'not_found' | 'revoked' | 'expired';

export function linkState(link: { revoked_at: Date | null; expires_at: Date } | null, now = new Date()): LinkState {
  if (!link) return 'not_found';
  if (link.revoked_at) return 'revoked';
  if (link.expires_at.getTime() <= now.getTime()) return 'expired';
  return 'ok';
}

/** Same message for every failure so a link's existence can't be probed. */
export const LINK_UNAVAILABLE = 'This shortlist link has expired or is no longer available. Please contact LaunchPath for a new link.';

/**
 * Resolves a token to an active link plus its shortlist, or null. Works with the Prisma client or a
 * transaction client.
 */
export async function resolveShortlistLink(db: any, token: unknown, now = new Date()) {
  if (!isWellFormedToken(token)) return null;
  const link = await db.shortlistLink.findUnique({
    where: { token_hash: hashShortlistToken(token) },
    include: { shortlist: { include: { vacancy: { select: { id: true, role_title: true, company_name: true, contact_email: true, status: true } } } } },
  });
  if (linkState(link, now) !== 'ok') return null;
  return link as {
    id: number;
    shortlist_id: number;
    expires_at: Date;
    shortlist: { id: number; vacancy_id: number; status: string; vacancy: { id: number; role_title: string; company_name: string; contact_email: string; status: string } };
  };
}
