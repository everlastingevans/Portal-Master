/**
 * Hiring Partner: feature flags, plan versions and per-customer snapshots, vacancy limits,
 * entitlements and the success-fee rules (including the undecided minimum/maximum).
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => false), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { runAccountAction } from '@/lib/hire/accounts';
import { runVacancyAction } from '@/lib/hire/ops';
import { computeFee, currentPlanVersion, parsePlanInput } from '@/lib/hire/partner';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const ctx = { actorId: 1, terms: DEFAULT_HIRE_TERMS };
const account = (action: string, p: Record<string, unknown> = {}, terms = DEFAULT_HIRE_TERMS) => runAccountAction(fdb, action, p, { ...ctx, terms });
const vacancyAct = (id: number, action: string, p: Record<string, unknown> = {}) => runVacancyAction(fdb, id, action, p, ctx);

async function newVacancy(title = 'Role') {
  const res = await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle: title })));
  return (await res.json()).reference as number;
}

/** Company + active plan + active manual subscription. */
async function partnerSetup(overrides: Record<string, unknown> = {}) {
  const company = (await account('CREATE_COMPANY', { name: 'Acme Trading' })).body.company;
  const plan = (await account('CREATE_PLAN_FROM_INDICATIVE', overrides)).body.plan;
  await account('ACTIVATE_PLAN', { planId: plan.id });
  const sub = (await account('CREATE_SUBSCRIPTION', { companyId: company.id, planVersionId: plan.id, billing_mode: 'MANUAL', talent_partner_id: 1 })).body.subscription;
  await account('MANUAL_ACTIVATE', { subscriptionId: sub.id });
  return { company, plan, sub };
}

async function partnerVacancy(companyId: number, subId: number, title = 'Role') {
  const id = await newVacancy(title);
  await vacancyAct(id, 'LINK_COMPANY', { companyId });
  return { id, res: await vacancyAct(id, 'SET_COMMERCIAL_MODEL', { model: 'PARTNER', subscriptionId: subId }) };
}

beforeEach(async () => {
  fdb.reset();
  jest.clearAllMocks();
  signedInAs(null);
  process.env.FEATURE_HIRING_PARTNER = 'true';
  await fdb.user.create({ data: { email: 'ops@launchpath.co.za', role: 'SUPERADMIN', name: 'Ops' } }); // id 1
});
afterAll(() => {
  delete process.env.FEATURE_HIRING_PARTNER;
});

describe('fee calculation', () => {
  it('applies the rate with optional minimum and maximum, or a flat fee', () => {
    const pct = { fee_basis: 'PERCENT' as const, fee_rate_bps: 350, fee_flat: null };
    expect(computeFee(180_000, { ...pct, fee_min: 7500, fee_max: 18000 })).toBe(7500); // 3.5% = 6,300 → min
    expect(computeFee(400_000, { ...pct, fee_min: 7500, fee_max: 18000 })).toBe(14_000);
    expect(computeFee(180_000, { ...pct, fee_min: null, fee_max: null })).toBe(6300);
    expect(computeFee(180_000, { fee_basis: 'FLAT', fee_rate_bps: null, fee_min: null, fee_max: null, fee_flat: 6000 })).toBe(6000);
    expect(() => computeFee(0, { ...pct, fee_min: null, fee_max: null })).toThrow();
  });
});

describe('plan versions', () => {
  it('validate input and pick the version in force', () => {
    expect(parsePlanInput({ name: 'x', monthly_price: 0 }).ok).toBe(false);
    const ok = parsePlanInput({ name: 'Hiring Partner', monthly_price: 4999, vacancy_limit: 3, success_fee_bps: 350, guarantee_days: 60, effective_from: '2026-11-01', entitlements: ['PRIORITY_SOURCING'] });
    expect(ok.ok).toBe(true);
    expect(parsePlanInput({ name: 'Hiring Partner', monthly_price: 4999, vacancy_limit: 3, success_fee_bps: 350, guarantee_days: 60, effective_from: '2026-11-01', fee_rule: 'CUSTOM' }).ok).toBe(false);
    const v = (id: number, status: string, from: string, to: string | null = null) => ({ id, status, effective_from: new Date(from), effective_to: to ? new Date(to) : null });
    const versions = [v(1, 'ACTIVE', '2026-01-01', '2026-12-01'), v(2, 'ACTIVE', '2026-12-01'), v(3, 'DRAFT', '2026-06-01')];
    expect(currentPlanVersion(versions, new Date('2026-10-05'))?.id).toBe(1);
    expect(currentPlanVersion(versions, new Date('2027-01-05'))?.id).toBe(2);
  });

  it('keep agreed terms per customer when the plan or standard terms change later', async () => {
    const { plan, sub } = await partnerSetup();
    expect(sub).toMatchObject({ monthly_price: 4999, vacancy_limit: 3, success_fee_bps: 350, fee_rule: 'UNDECIDED', vat_treatment: 'UNDECIDED', guarantee_days: 60 });
    expect((await account('UPDATE_PLAN', { planId: plan.id, monthly_price: 5999 })).status).toBe(400); // activated → immutable
    const v2 = (await account('CREATE_PLAN_FROM_INDICATIVE', { name: 'Hiring Partner 2027', monthly_price: 5999 })).body.plan;
    await account('ACTIVATE_PLAN', { planId: v2.id });
    expect(fdb._tables.partnerSubscription[0].monthly_price).toBe(4999);

    // Standard min/max copied at agreement time; later standard changes don't touch it
    await account('SET_SUBSCRIPTION_FEE_RULE', { subscriptionId: sub.id, fee_rule: 'STANDARD_MIN_MAX' }, DEFAULT_HIRE_TERMS);
    expect(fdb._tables.partnerSubscription[0]).toMatchObject({ fee_rule: 'STANDARD_MIN_MAX', fee_min: 7500, fee_max: 18000 });
    expect((await account('SET_SUBSCRIPTION_FEE_RULE', { subscriptionId: sub.id, fee_rule: 'NO_MIN_MAX' })).status).toBe(400); // can't silently change
  });
});

describe('feature flag', () => {
  it('blocks partner actions and partner vacancies when disabled', async () => {
    const { company, sub } = await partnerSetup();
    process.env.FEATURE_HIRING_PARTNER = 'false';
    expect((await account('CREATE_PLAN_FROM_INDICATIVE')).status).toBe(404);
    const { res } = await partnerVacancy(company.id, sub.id);
    expect(res.status).toBe(400);
    expect((await account('CREATE_COMPANY', { name: 'Still allowed' })).status).toBe(200); // companies are not commercial
  });
});

describe('vacancy limit and eligibility (server-side)', () => {
  it('allows up to the agreed number of active partner vacancies', async () => {
    const { company, sub } = await partnerSetup();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await partnerVacancy(company.id, sub.id, `Role ${i}`));
    expect(results.map((r) => r.res.status)).toEqual([200, 200, 200, 400]);
    expect(results[3].res.body.error).toMatch(/3 of 3/);

    // A closed or hired vacancy no longer counts (pending decision: implemented definition)
    fdb._tables.vacancy.find((v: any) => v.id === results[0].id).status = 'CLOSED_EMPLOYER';
    expect((await vacancyAct(results[3].id, 'SET_COMMERCIAL_MODEL', { model: 'PARTNER', subscriptionId: sub.id })).status).toBe(200);
  });

  it('requires the same verified company and an active subscription', async () => {
    const { sub } = await partnerSetup();
    const other = (await account('CREATE_COMPANY', { name: 'Other Co' })).body.company;
    expect((await partnerVacancy(other.id, sub.id)).res.status).toBe(400);

    const noCompany = await newVacancy('No company');
    expect((await vacancyAct(noCompany, 'SET_COMMERCIAL_MODEL', { model: 'PARTNER', subscriptionId: sub.id })).status).toBe(400);

    for (const status of ['PENDING', 'PAST_DUE', 'CANCELLED']) {
      fdb._tables.partnerSubscription[0].status = status;
      expect((await partnerVacancy(sub.company_id, sub.id, `Role ${status}`)).res.status).toBe(400);
    }
  });

  it('assigns the dedicated talent partner and gates salary benchmarking', async () => {
    const { company, sub } = await partnerSetup();
    const { id } = await partnerVacancy(company.id, sub.id);
    expect(fdb._tables.vacancy.find((v: any) => v.id === id).owner_id).toBe(1);
    expect((await vacancyAct(id, 'UPDATE_VACANCY', { salary_benchmark_note: 'R12k–R15k from recent screenings' })).status).toBe(200);

    const standard = await newVacancy('Standard');
    expect((await vacancyAct(standard, 'UPDATE_VACANCY', { salary_benchmark_note: 'x' })).status).toBe(403);

    fdb._tables.partnerSubscription[0].entitlements = ['PRIORITY_SOURCING'];
    expect((await vacancyAct(id, 'UPDATE_VACANCY', { salary_benchmark_note: 'y' })).status).toBe(403);
  });
});

describe('partner placement fees', () => {
  const place = (id: number, ctc = '180000') => vacancyAct(id, 'CREATE_PLACEMENT', { candidate_name: 'Lerato M', start_date: '2026-11-02', annual_ctc: ctc });

  it('refuses while the min/max rule is undecided, then prices with the agreed rule', async () => {
    const { company, sub } = await partnerSetup();
    const { id } = await partnerVacancy(company.id, sub.id);
    const refused = await place(id);
    expect(refused.status).toBe(409);
    expect(refused.body.error).toMatch(/undecided/);
    expect(fdb._tables.placement ?? []).toHaveLength(0);

    await account('SET_SUBSCRIPTION_FEE_RULE', { subscriptionId: sub.id, fee_rule: 'NO_MIN_MAX' });
    expect((await place(id)).status).toBe(200);
    expect(fdb._tables.placement[0]).toMatchObject({ commercial_model: 'PARTNER', fee_rate_bps: 350, fee_min: null, fee_max: null, placement_fee: 6300, partner_subscription_id: sub.id });
  });

  it('applies the standard minimum when that was agreed', async () => {
    const { company, sub } = await partnerSetup();
    await account('SET_SUBSCRIPTION_FEE_RULE', { subscriptionId: sub.id, fee_rule: 'STANDARD_MIN_MAX' });
    const { id } = await partnerVacancy(company.id, sub.id);
    await place(id);
    expect(fdb._tables.placement[0].placement_fee).toBe(7500);
  });

  it('refuses partner fees after cancellation until staff explicitly re-classify the vacancy', async () => {
    const { company, sub } = await partnerSetup();
    await account('SET_SUBSCRIPTION_FEE_RULE', { subscriptionId: sub.id, fee_rule: 'NO_MIN_MAX' });
    const { id } = await partnerVacancy(company.id, sub.id);
    await account('CANCEL_SUBSCRIPTION', { subscriptionId: sub.id });
    expect((await place(id)).status).toBe(409);
    expect((await vacancyAct(id, 'SET_COMMERCIAL_MODEL', { model: 'STANDARD' })).status).toBe(200);
    expect((await place(id)).status).toBe(200);
    expect(fdb._tables.placement[0]).toMatchObject({ commercial_model: 'STANDARD', placement_fee: 13_500 });
    // Once priced, the model is locked
    expect((await vacancyAct(id, 'SET_COMMERCIAL_MODEL', { model: 'PARTNER', subscriptionId: sub.id })).status).toBe(400);
  });
});

describe('manual billing', () => {
  it('records payments once per reference and keeps cancelled subscriptions cancelled', async () => {
    const { sub } = await partnerSetup();
    expect((await account('RECORD_MANUAL_PAYMENT', { subscriptionId: sub.id, amount: '4999', period_end: '2026-12-01', reference: 'EFT-1' })).status).toBe(200);
    expect((await account('RECORD_MANUAL_PAYMENT', { subscriptionId: sub.id, amount: '4999', period_end: '2026-12-01', reference: 'EFT-1' })).status).toBe(400);
    expect(fdb._tables.billingEvent).toHaveLength(1);
    await account('CANCEL_SUBSCRIPTION', { subscriptionId: sub.id });
    await account('RECORD_MANUAL_PAYMENT', { subscriptionId: sub.id, amount: '4999', period_end: '2027-01-01', reference: 'EFT-2' });
    expect(fdb._tables.partnerSubscription[0].status).toBe('CANCELLED');
    expect((await account('MANUAL_ACTIVATE', { subscriptionId: sub.id })).status).toBe(400);
  });

  it('only lets staff add employer accounts to a company, explicitly', async () => {
    const company = (await account('CREATE_COMPANY', { name: 'Acme' })).body.company;
    const candidate = await fdb.user.create({ data: { email: 'c@acme.co.za', role: 'CANDIDATE' } });
    const employer = await fdb.user.create({ data: { email: 'e@acme.co.za', role: 'CLIENT' } });
    expect((await account('ADD_MEMBER', { companyId: company.id, userId: candidate.id })).status).toBe(400);
    expect((await account('ADD_MEMBER', { companyId: company.id, userId: employer.id })).status).toBe(200);
    expect((await account('ADD_MEMBER', { companyId: company.id, userId: employer.id })).status).toBe(400);
    expect(fdb._tables.companyMember).toHaveLength(1);
  });
});
