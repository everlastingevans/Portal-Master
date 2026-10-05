import { NextResponse } from 'next/server';

/** Responses for token-protected shortlist endpoints: never cached, never indexed. */
export function privateJson(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'private, no-store, max-age=0');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res;
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}
