/**
 * pay-simulate and the unlock "bypass" used to let any employer publish or unlock a job for free in
 * production. They now only work on a local dev server or for a real SUPERADMIN account.
 */
jest.mock('@/services/integrations/email.service', () => ({ EmailService: { send: jest.fn(async () => true) } }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { paymentBypassAllowed } from '@/lib/billing/payfast-itn';
import { POST as paySimulate } from '@/app/api/jobs/pay-simulate/route';
import { POST as unlock } from '@/app/api/employer/unlock/route';
import { jsonRequest, signedInAs } from '../test-utils/session';

const fdb = db as any;
const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;

beforeEach(async () => {
  fdb.reset();
  env.NODE_ENV = 'production';
  await fdb.user.create({ data: { email: 'boss@acme.co.za', role: 'EMPLOYER' } }); // id 1
  await fdb.job.create({ data: { title: 'Junior Analyst', employer_id: 1, status: 'PENDING' } });
});
afterAll(() => {
  env.NODE_ENV = originalNodeEnv;
});

describe('paymentBypassAllowed', () => {
  it('allows a real SUPERADMIN and local development only', () => {
    expect(paymentBypassAllowed({ realRole: 'EMPLOYER' })).toBe(false);
    expect(paymentBypassAllowed(null)).toBe(false);
    expect(paymentBypassAllowed({ realRole: 'SUPERADMIN' })).toBe(true);
    env.NODE_ENV = 'development';
    expect(paymentBypassAllowed({ realRole: 'EMPLOYER' })).toBe(true);
  });
});

describe('POST /api/jobs/pay-simulate', () => {
  it('refuses an employer in production and leaves the job pending', async () => {
    signedInAs('EMPLOYER', 1);
    const res = await paySimulate(jsonRequest('http://localhost/api/jobs/pay-simulate', { jobId: 1 }));
    expect(res.status).toBe(403);
    expect(fdb._tables.job[0].status).toBe('PENDING');
  });

  it('still works for the owner on a local dev server', async () => {
    env.NODE_ENV = 'development';
    signedInAs('EMPLOYER', 1);
    const res = await paySimulate(jsonRequest('http://localhost/api/jobs/pay-simulate', { jobId: 1 }));
    expect(res.status).toBe(200);
    expect(fdb._tables.job[0].status).toBe('ACTIVE');
  });
});

describe('POST /api/employer/unlock (bypass)', () => {
  it('refuses a free unlock for an employer in production', async () => {
    signedInAs('EMPLOYER', 1);
    const res = await unlock(jsonRequest('http://localhost/api/employer/unlock', { action: 'bypass', jobId: 1 }));
    expect(res.status).toBe(403);
    const tenant = fdb._tables.tenant?.[0];
    expect(JSON.parse(tenant?.features || '{}').unlockedJobIds).toBeUndefined();
  });
});
