/**
 * Job-board PayFast ITN (/api/webhooks/payfast). Before this, any logged-in user could POST
 * payment_status=COMPLETE&m_payment_id=JOB_<id> and publish any job for free.
 */
jest.mock('@/services/integrations/email.service', () => ({ EmailService: { send: jest.fn(async () => true) } }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { pfSignature } from '@/lib/billing/payfast-sandbox';
import { parsePaymentRef, verifyJobBoardItn } from '@/lib/billing/payfast-itn';
import { POST as webhook } from '@/app/api/webhooks/payfast/route';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

const fdb = db as any;
const PASS = 'live pass phrase';
const valid = async () => ({ ok: true, text: async () => 'VALID' });

function itn(over: Record<string, string> = {}, passphrase = PASS) {
  const fields = Object.entries({
    m_payment_id: 'JOB_1',
    pf_payment_id: '2088331',
    payment_status: 'COMPLETE',
    item_name: 'LaunchPath Job Posting: Junior Developer',
    amount_gross: '1999.00',
    amount_fee: '-45.98',
    amount_net: '1953.02',
    merchant_id: 'LIVE-MERCHANT',
    ...over,
  });
  return new URLSearchParams([...fields, ['signature', pfSignature(fields, passphrase, false)]]).toString();
}
const post = (body: string) => webhook(new Request('http://localhost/api/webhooks/payfast', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } }));
let fetchSpy: jest.SpyInstance;

beforeEach(async () => {
  fdb.reset();
  process.env.PAYFAST_ENV = 'production';
  process.env.PAYFAST_MERCHANT_ID = 'LIVE-MERCHANT';
  process.env.PAYFAST_PASSPHRASE = PASS;
  fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((async () => new Response('VALID')) as any);
  await fdb.job.create({ data: { title: 'Junior Developer', employer_id: 7, status: 'PENDING' } });
});
afterEach(() => fetchSpy.mockRestore());
afterAll(() => {
  for (const k of ['PAYFAST_ENV', 'PAYFAST_MERCHANT_ID', 'PAYFAST_PASSPHRASE']) delete process.env[k];
});

describe('verifyJobBoardItn', () => {
  it('accepts a correctly signed, validated notification', async () => {
    expect(await verifyJobBoardItn(itn(), { fetchImpl: valid })).toMatchObject({ ok: true, complete: true, purpose: 'JOB', jobId: 1 });
  });

  it.each([
    ['a forged signature', itn({}, 'wrong passphrase')],
    ['another merchant', itn({ merchant_id: '10000100' })],
    ['an underpayment', itn({ amount_gross: '1.00' })],
    ['an unlock paid at the job price', itn({ m_payment_id: 'UNLOCK_JOB_1', amount_gross: '1999.00' })],
    ['a reference we never issue', itn({ m_payment_id: 'UNLOCK_TENANT_1', amount_gross: '1999.00' })],
  ])('rejects %s', async (_label, body) => {
    expect(await verifyJobBoardItn(body, { fetchImpl: valid })).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects when PayFast does not confirm, and asks for a retry when unreachable', async () => {
    expect(await verifyJobBoardItn(itn(), { fetchImpl: async () => ({ ok: true, text: async () => 'INVALID' }) })).toMatchObject({ ok: false, status: 400 });
    expect(await verifyJobBoardItn(itn(), { fetchImpl: async () => { throw new Error('down'); } })).toMatchObject({ ok: false, status: 503 });
  });

  it('refuses to run in production without a configured merchant id', async () => {
    delete process.env.PAYFAST_MERCHANT_ID;
    expect(await verifyJobBoardItn(itn(), { fetchImpl: valid })).toMatchObject({ ok: false, status: 500 });
  });

  it('validates against the live host in production', async () => {
    const fetchImpl = jest.fn(valid);
    await verifyJobBoardItn(itn(), { fetchImpl });
    expect((fetchImpl.mock.calls[0] as unknown[])[0]).toBe('https://www.payfast.co.za/eng/query/validate');
  });

  it('parses only the references checkout issues', () => {
    expect(parsePaymentRef('JOB_12')).toEqual({ purpose: 'JOB', jobId: 12 });
    expect(parsePaymentRef('UNLOCK_JOB_3')).toEqual({ purpose: 'UNLOCK_JOB', jobId: 3 });
    expect(parsePaymentRef('JOB_12; DROP')).toBeNull();
    expect(parsePaymentRef(undefined)).toBeNull();
  });
});

describe('POST /api/webhooks/payfast', () => {
  it('activates a pending job once for a verified payment', async () => {
    expect((await post(itn())).status).toBe(200);
    expect(fdb._tables.job[0].status).toBe('ACTIVE');
    expect((await post(itn())).status).toBe(200); // PayFast retries are harmless
    expect(fdb._tables.job[0].status).toBe('ACTIVE');
  });

  it('does not activate on a forged notification', async () => {
    expect((await post(itn({}, 'guessed'))).status).toBe(400);
    expect(fdb._tables.job[0].status).toBe('PENDING');
  });

  it('acknowledges non-complete statuses without changes', async () => {
    expect((await post(itn({ payment_status: 'CANCELLED' }))).status).toBe(200);
    expect(fdb._tables.job[0].status).toBe('PENDING');
  });

  it('does not reopen a closed job', async () => {
    fdb._tables.job[0].status = 'CLOSED';
    expect((await post(itn())).status).toBe(200);
    expect(fdb._tables.job[0].status).toBe('CLOSED');
  });

  it('is reachable by PayFast without a session', async () => {
    const res = await middleware(new NextRequest('http://localhost/api/webhooks/payfast', { method: 'POST', headers: { 'x-forwarded-for': '41.74.179.194' } }));
    expect(res.status).toBe(200);
  });
});
