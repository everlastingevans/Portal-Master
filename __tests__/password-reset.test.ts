/**
 * Forgot / reset password against an in-memory database. The reset code must only ever reach the
 * user's inbox, and a reset password must work with the normal login check.
 */
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => true), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { sendEmail } from '@/lib/notifications';
import { hashPassword, hashResetToken, verifyPassword } from '@/lib/auth';
import { POST as forgot } from '@/app/api/auth/forgot-password/route';
import { POST as reset } from '@/app/api/auth/reset-password/route';
import { jsonRequest } from '../test-utils/session';

const fdb = db as any;
const mockedSend = sendEmail as jest.Mock;
const call = async (handler: (r: any) => Promise<Response>, body: object) => {
  const r = await handler(jsonRequest('http://localhost/api/auth/x', body));
  return { status: r.status, body: await r.json() };
};
const sentCode = () => String(mockedSend.mock.calls.at(-1)[0].text).match(/[0-9a-f]{64}/)![0];

beforeEach(async () => {
  fdb.reset();
  mockedSend.mockClear();
  await fdb.user.create({ data: { email: 'thandi@example.com', name: 'Thandi', password: hashPassword('old-password') } });
});

describe('forgot password', () => {
  it('emails the code, never returns it, and stores only its hash', async () => {
    const res = await call(forgot, { email: 'thandi@example.com' });
    expect(res.status).toBe(200);
    expect(res.body._devToken).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/[0-9a-f]{64}/);

    const code = sentCode();
    const user = fdb._tables.user[0];
    expect(user.reset_token).toBe(hashResetToken(code));
    expect(user.reset_token).not.toBe(code);
  });

  it('gives the same answer for unknown emails and sends nothing', async () => {
    const known = await call(forgot, { email: 'thandi@example.com' });
    const unknown = await call(forgot, { email: 'nobody@example.com' });
    expect(unknown).toEqual({ status: 200, body: { message: known.body.message } });
    expect(mockedSend).toHaveBeenCalledTimes(1);
  });
});

describe('reset password', () => {
  it('sets a password that login accepts and clears the code', async () => {
    await call(forgot, { email: 'thandi@example.com' });
    const res = await call(reset, { email: 'thandi@example.com', token: sentCode(), newPassword: 'new-password-1' });
    expect(res.status).toBe(200);

    const user = fdb._tables.user[0];
    expect(await verifyPassword('new-password-1', user.password)).toBe(true);
    expect(await verifyPassword('old-password', user.password)).toBe(false);
    expect(user.reset_token).toBeNull();
  });

  it('rejects a reused, wrong, or expired code', async () => {
    await call(forgot, { email: 'thandi@example.com' });
    const code = sentCode();
    expect((await call(reset, { email: 'thandi@example.com', token: 'f'.repeat(64), newPassword: 'new-password-1' })).status).toBe(400);
    expect((await call(reset, { email: 'thandi@example.com', token: code, newPassword: 'new-password-1' })).status).toBe(200);
    expect((await call(reset, { email: 'thandi@example.com', token: code, newPassword: 'another-pass' })).status).toBe(400);

    await call(forgot, { email: 'thandi@example.com' });
    fdb._tables.user[0].reset_token_expiry = new Date(Date.now() - 1000);
    expect((await call(reset, { email: 'thandi@example.com', token: sentCode(), newPassword: 'new-password-1' })).status).toBe(400);
  });

  it('enforces the same minimum length as registration', async () => {
    await call(forgot, { email: 'thandi@example.com' });
    expect((await call(reset, { email: 'thandi@example.com', token: sentCode(), newPassword: 'short' })).status).toBe(400);
  });
});
