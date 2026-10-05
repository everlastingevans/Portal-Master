/**
 * PayFast SANDBOX subscription billing: never touches production credentials, verifies every ITN
 * (signature, merchant, amount, server validation) and applies each notification at most once.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => false), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import { createHash } from 'crypto';
import db from '@/lib/db';
import { buildSubscriptionCheckout, pfSignature, processSubscriptionItn } from '@/lib/billing/payfast-sandbox';
import { POST as webhook } from '@/app/api/webhooks/payfast-subscriptions/route';

const fdb = db as any;
const PASS = 'sandbox-pass phrase';
const valid = async () => ({ ok: true, text: async () => 'VALID' });

/** Builds an ITN body the way PayFast does: ordered fields, then signature over them. */
function itn(fields: [string, string][], passphrase = PASS) {
  const sig = pfSignature(fields, passphrase, false);
  return new URLSearchParams([...fields, ['signature', sig]]).toString();
}
const baseFields = (over: Record<string, string> = {}): [string, string][] =>
  Object.entries({
    m_payment_id: 'HP_test123',
    pf_payment_id: '1089250',
    payment_status: 'COMPLETE',
    item_name: 'LaunchPath Hiring Partner (SANDBOX)',
    amount_gross: '4999.00',
    amount_fee: '-114.98',
    amount_net: '4884.02',
    name_first: '',
    email_address: 'test@example.com',
    merchant_id: '10000100',
    token: 'dc0521d3-55fe-269b-fa00-b647310d760f',
    billing_date: '2026-10-05',
    ...over,
  });

beforeEach(async () => {
  fdb.reset();
  process.env.FEATURE_PARTNER_BILLING_SANDBOX = 'true';
  process.env.PAYFAST_SANDBOX_PASSPHRASE = PASS;
  delete process.env.PARTNER_BILLING_LIVE;
  // Production job-checkout credentials present in this project: must never be used here
  process.env.PAYFAST_ENV = 'production';
  process.env.PAYFAST_MERCHANT_ID = 'LIVE-MERCHANT';
  process.env.PAYFAST_MERCHANT_KEY = 'LIVE-KEY';
  await fdb.company.create({ data: { name: 'Acme' } });
  await fdb.partnerSubscription.create({
    data: { company_id: 1, plan_version_id: 1, billing_mode: 'PAYFAST_SANDBOX', checkout_ref: 'HP_test123', monthly_price: 4999, vat_treatment: 'UNDECIDED', vacancy_limit: 3, success_fee_bps: 350, fee_rule: 'UNDECIDED', guarantee_days: 60, starts_on: new Date() },
  });
});
afterAll(() => {
  for (const k of ['FEATURE_PARTNER_BILLING_SANDBOX', 'PAYFAST_SANDBOX_PASSPHRASE', 'PAYFAST_ENV', 'PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY']) delete process.env[k];
});

describe('checkout', () => {
  it('targets the sandbox with sandbox credentials only, and signs fields in order', () => {
    const c = buildSubscriptionCheckout({ checkoutRef: 'HP_test123', monthlyPrice: 4999, itemName: 'LaunchPath Hiring Partner (SANDBOX) - Acme & Co', billingDate: new Date('2026-10-05'), appUrl: 'https://example.test' });
    expect(c.action).toBe('https://sandbox.payfast.co.za/eng/process');
    const f = Object.fromEntries(c.fields);
    expect(f.merchant_id).toBe('10000100');
    expect(JSON.stringify(c)).not.toContain('LIVE-');
    expect(f).toMatchObject({ amount: '4999.00', recurring_amount: '4999.00', subscription_type: '1', frequency: '3', cycles: '0', m_payment_id: 'HP_test123' });

    // Independent re-computation of PayFast's documented signature
    const enc = (v: string) => encodeURIComponent(v.trim()).replace(/%20/g, '+').replace(/[!'()*]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase());
    const str = c.fields.filter(([k]) => k !== 'signature').map(([k, v]) => `${k}=${enc(v)}`).join('&') + `&passphrase=${enc(PASS)}`;
    expect(f.signature).toBe(createHash('md5').update(str).digest('hex'));
    expect(str).toContain('item_name=LaunchPath+Hiring+Partner+%28SANDBOX%29+-+Acme+%26+Co');
  });

  it('refuses when the feature is off or live billing is requested', () => {
    const input = { checkoutRef: 'x', monthlyPrice: 1, itemName: 'x', billingDate: new Date(), appUrl: 'https://x' };
    process.env.FEATURE_PARTNER_BILLING_SANDBOX = 'false';
    expect(() => buildSubscriptionCheckout(input)).toThrow(/disabled/);
    process.env.FEATURE_PARTNER_BILLING_SANDBOX = 'true';
    process.env.PARTNER_BILLING_LIVE = 'true';
    expect(() => buildSubscriptionCheckout(input)).toThrow(/not implemented/);
  });
});

describe('ITN processing', () => {
  it('activates on a verified payment and stores the subscription token', async () => {
    const validate = jest.fn(valid);
    const r = await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: validate, now: new Date('2026-10-05T10:00:00Z') });
    expect(r).toMatchObject({ status: 200, outcome: 'APPLIED' });
    expect(validate.mock.calls[0][0]).toBe('https://sandbox.payfast.co.za/eng/query/validate');
    const sub = fdb._tables.partnerSubscription[0];
    expect(sub).toMatchObject({ status: 'ACTIVE', provider_token: 'dc0521d3-55fe-269b-fa00-b647310d760f' });
    expect(sub.current_period_end.toISOString().slice(0, 10)).toBe('2026-11-05');
  });

  it('ignores a duplicate notification (PayFast retries)', async () => {
    const body = itn(baseFields());
    await processSubscriptionItn(fdb, body, { fetchImpl: valid, now: new Date('2026-10-05T10:00:00Z') });
    const again = await processSubscriptionItn(fdb, body, { fetchImpl: valid, now: new Date('2026-10-05T10:05:00Z') });
    expect(again.outcome).toBe('DUPLICATE');
    expect(fdb._tables.billingEvent.filter((e: any) => e.outcome === 'APPLIED')).toHaveLength(1);
    expect(fdb._tables.partnerSubscription[0].current_period_end.toISOString().slice(0, 10)).toBe('2026-11-05'); // not extended twice
  });

  it('extends the period on the next monthly payment', async () => {
    await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: valid, now: new Date('2026-10-05T10:00:00Z') });
    await processSubscriptionItn(fdb, itn(baseFields({ pf_payment_id: '1089999' })), { fetchImpl: valid, now: new Date('2026-11-05T10:00:00Z') });
    expect(fdb._tables.partnerSubscription[0].current_period_end.toISOString().slice(0, 10)).toBe('2026-12-05');
  });

  it.each([
    ['a bad signature', () => itn(baseFields()).replace(/signature=[a-f0-9]+/, 'signature=deadbeef')],
    ['a tampered amount after signing', () => itn(baseFields()).replace('amount_gross=4999.00', 'amount_gross=1.00')],
    ['the wrong passphrase', () => itn(baseFields(), 'wrong')],
    ['a different merchant', () => itn(baseFields({ merchant_id: '99999' }))],
    ['an amount that differs from the agreed price', () => itn(baseFields({ amount_gross: '1.00' }))],
    ['an unknown subscription', () => itn(baseFields({ m_payment_id: 'HP_nope' }))],
  ])('rejects %s without changing the subscription', async (_name, body) => {
    const r = await processSubscriptionItn(fdb, body(), { fetchImpl: valid });
    expect(r).toMatchObject({ status: 400, outcome: 'REJECTED' });
    expect(fdb._tables.partnerSubscription[0].status).toBe('PENDING');
    expect(fdb._tables.billingEvent.every((e: any) => e.outcome === 'REJECTED')).toBe(true);
  });

  it('rejects when PayFast does not confirm, and leaves a network failure retryable', async () => {
    const invalid = await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: async () => ({ ok: true, text: async () => 'INVALID' }) });
    expect(invalid.outcome).toBe('REJECTED');
    const down = await processSubscriptionItn(fdb, itn(baseFields()), {
      fetchImpl: async () => {
        throw new Error('ECONNRESET');
      },
    });
    expect(down.status).toBe(503);
    const retry = await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: valid });
    expect(retry.outcome).toBe('APPLIED');
    expect(fdb._tables.partnerSubscription[0].status).toBe('ACTIVE');
  });

  it('handles cancellation and failed payments', async () => {
    await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: valid });
    await processSubscriptionItn(fdb, itn(baseFields({ pf_payment_id: '2', payment_status: 'FAILED', amount_gross: '0.00' })), { fetchImpl: valid });
    expect(fdb._tables.partnerSubscription[0].status).toBe('PAST_DUE');
    await processSubscriptionItn(fdb, itn(baseFields({ pf_payment_id: '3', payment_status: 'CANCELLED', amount_gross: '0.00' })), { fetchImpl: valid });
    expect(fdb._tables.partnerSubscription[0].status).toBe('CANCELLED');
    // A late payment for a cancelled subscription is recorded for review, not reactivated
    const late = await processSubscriptionItn(fdb, itn(baseFields({ pf_payment_id: '4' })), { fetchImpl: valid });
    expect(late.outcome).toBe('IGNORED');
    expect(fdb._tables.partnerSubscription[0].status).toBe('CANCELLED');
  });

  it('rejects notifications for manually billed subscriptions', async () => {
    fdb._tables.partnerSubscription[0].billing_mode = 'MANUAL';
    expect((await processSubscriptionItn(fdb, itn(baseFields()), { fetchImpl: valid })).outcome).toBe('REJECTED');
  });
});

describe('webhook route', () => {
  it('is not reachable when the sandbox feature is off', async () => {
    process.env.FEATURE_PARTNER_BILLING_SANDBOX = 'false';
    const res = await webhook(new Request('http://localhost/api/webhooks/payfast-subscriptions', { method: 'POST', body: itn(baseFields()) }));
    expect(res.status).toBe(404);
    expect(fdb._tables.billingEvent ?? []).toHaveLength(0);
  });

  it('returns 400 for an unverifiable notification', async () => {
    const res = await webhook(new Request('http://localhost/api/webhooks/payfast-subscriptions', { method: 'POST', body: 'payment_status=COMPLETE&m_payment_id=HP_test123' }));
    expect(res.status).toBe(400);
    expect(fdb._tables.partnerSubscription[0].status).toBe('PENDING');
  });
});
