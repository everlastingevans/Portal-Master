/**
 * Middleware auth gate. jest.setup.js mocks jose, so a session token is base64 JSON.
 * Headers forwarded to route handlers show up on the response as x-middleware-request-<name>.
 */
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const token = (userId: number, role: string) => Buffer.from(JSON.stringify({ userId, role })).toString('base64');
const request = (path: string, headers: Record<string, string> = {}, auth?: string) =>
  new NextRequest(`http://localhost${path}`, {
    headers: { 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...headers, ...(auth ? { cookie: `auth-token=${auth}` } : {}) },
  });
const forwarded = (res: Response, name: string) => res.headers.get(`x-middleware-request-${name}`);

describe('middleware', () => {
  it('does not let a dot in an API path skip authentication', async () => {
    const res = await middleware(request('/api/video-interview/list.json', { 'x-user-id': '1', 'x-user-role': 'SUPERADMIN' }));
    expect(res.status).toBe(401);
  });

  it('still serves static files without a session', async () => {
    const res = await middleware(request('/logo.png'));
    expect(res.status).toBe(200);
  });

  it('drops spoofed identity headers on public routes', async () => {
    const res = await middleware(request('/api/contact', { 'x-user-id': '1', 'x-user-role': 'SUPERADMIN' }));
    expect(forwarded(res, 'x-user-id')).toBeNull();
    expect(forwarded(res, 'x-user-role')).toBeNull();
  });

  it('forwards the identity from the verified token, not from request headers', async () => {
    const res = await middleware(request('/api/candidate/dashboard', { 'x-user-id': '1', 'x-user-role': 'SUPERADMIN' }, token(42, 'CANDIDATE')));
    expect(forwarded(res, 'x-user-id')).toBe('42');
    expect(forwarded(res, 'x-user-role')).toBe('CANDIDATE');
  });

  it('does not echo request headers back on a 401', async () => {
    const res = await middleware(request('/api/candidate/dashboard', { cookie: 'other=secret-value' }));
    expect(res.status).toBe(401);
    expect(res.headers.get('cookie')).toBeNull();
  });
});
