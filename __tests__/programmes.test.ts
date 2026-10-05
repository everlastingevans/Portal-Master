/**
 * Bulk programmes: configurable tiers with overlap detection, explicit append-only terms, flat
 * per-hire fees that are never applied retroactively, tracking and the public enquiry.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => true), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { sendEmail } from '@/lib/notifications';
import { DEFAULT_PROGRAMME_TIERS, findTierOverlaps, suggestTiers, summariseProgramme, validateTiers } from '@/lib/hire/programmes';
import { runProgrammeAction } from '@/lib/hire/programme-admin';
import { runVacancyAction } from '@/lib/hire/ops';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { POST as enquiry } from '@/app/api/programmes/enquiry/route';
import { jsonRequest, signedInAs, uuid, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const send = sendEmail as jest.Mock;
const prog = (action: string, p: Record<string, unknown> = {}, now?: Date) => runProgrammeAction(fdb, action, p, { actorId: 1, now });
const vac = (id: number, action: string, p: Record<string, unknown> = {}, now?: Date) => runVacancyAction(fdb, id, action, p, { actorId: 1, terms: DEFAULT_HIRE_TERMS, now });
const newVacancy = async (title: string) => (await (await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle: title })))).json()).reference as number;

beforeEach(async () => {
  fdb.reset();
  jest.clearAllMocks();
  signedInAs(null);
  process.env.FEATURE_BULK_PROGRAMMES = 'true';
  process.env.FEATURE_BULK_ENQUIRY_PUBLIC = 'true';
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  delete process.env.FEATURE_BULK_PROGRAMMES;
  delete process.env.FEATURE_BULK_ENQUIRY_PUBLIC;
});

describe('tiers', () => {
  it('detect the proposed overlap at exactly 25 hires instead of choosing a rule', () => {
    expect(findTierOverlaps(DEFAULT_PROGRAMME_TIERS)).toEqual([{ a: '11–25 hires', b: '25+ hires', from: 25, to: 25 }]);
    expect(suggestTiers(25, DEFAULT_PROGRAMME_TIERS)).toMatchObject({ ambiguous: true });
    expect(suggestTiers(25, DEFAULT_PROGRAMME_TIERS).matches.map((t) => t.label)).toEqual(['11–25 hires', '25+ hires']);
    expect(suggestTiers(12, DEFAULT_PROGRAMME_TIERS).matches.map((t) => t.label)).toEqual(['11–25 hires']);
    expect(suggestTiers(4, DEFAULT_PROGRAMME_TIERS)).toMatchObject({ none: true });
    expect(suggestTiers(10, DEFAULT_PROGRAMME_TIERS).matches.map((t) => t.label)).toEqual(['5–10 hires']);
  });

  it('are configurable and validated', async () => {
    expect(validateTiers([{ label: 'x', minHires: 10, maxHires: 5, perHireFee: 1 }]).ok).toBe(false);
    expect(validateTiers([]).ok).toBe(false);
    const fixed = [
      { label: '5–10', minHires: 5, maxHires: 10, perHireFee: 6000 },
      { label: '11–24', minHires: 11, maxHires: 24, perHireFee: 4500 },
      { label: '25+', minHires: 25, maxHires: null, perHireFee: null },
    ];
    expect((await prog('SAVE_TIERS', { tiers: fixed })).status).toBe(200);
    expect(findTierOverlaps(fixed)).toEqual([]);
  });
});

describe('agreed terms and placements', () => {
  async function programmeWithVacancy() {
    const p = (await prog('CREATE_PROGRAMME', { name: 'Contact centre intake', company_name: 'Acme', contact_name: 'Naledi', contact_email: 'naledi@acme.co.za', target_hires: 12 })).body.programme;
    const v = await newVacancy('Customer Service Agent');
    expect((await vac(v, 'SET_COMMERCIAL_MODEL', { model: 'PROGRAMME', programmeId: p.id })).status).toBe(200);
    return { p, v };
  }
  const placeAt = (v: number, n: number, now: Date) =>
    vac(v, 'CREATE_PLACEMENT', { candidate_name: `Agent ${n}`, start_date: '2026-11-02', annual_ctc: '120000' }, now);

  it('refuses programme placements until accepted terms are recorded', async () => {
    const { p, v } = await programmeWithVacancy();
    expect((await placeAt(v, 1, new Date())).status).toBe(409);
    expect((await prog('UPDATE_PROGRAMME', { programmeId: p.id, status: 'ACTIVE' })).status).toBe(400);
  });

  it('requires an explicit tier choice and rejects using a custom-quote tier as a priced tier', async () => {
    const { p } = await programmeWithVacancy();
    expect((await prog('AGREE_TERMS', { programmeId: p.id, pricing_model: 'TIER', tier_label: '25+ hires', per_hire_fee: '4000', guarantee_days: 60, agreed_on: '2026-10-01' })).status).toBe(400);
    expect((await prog('AGREE_TERMS', { programmeId: p.id, pricing_model: 'TIER', per_hire_fee: '4500', guarantee_days: 60, agreed_on: '2026-10-01' })).status).toBe(400);
    const ok = await prog('AGREE_TERMS', { programmeId: p.id, pricing_model: 'TIER', tier_label: '11–25 hires', per_hire_fee: '4500', guarantee_days: 60, agreed_on: '2026-10-01' });
    expect(ok.status).toBe(200);
    expect(ok.body.differsFromTier).toBe(false);
    expect(fdb._tables.bulkProgramme[0].status).toBe('AGREED');
  });

  it('prices each placement with the terms in force and never re-prices earlier placements', async () => {
    const { p, v } = await programmeWithVacancy();
    await prog('AGREE_TERMS', { programmeId: p.id, pricing_model: 'TIER', tier_label: '11–25 hires', per_hire_fee: '4500', guarantee_days: 60, agreed_on: '2026-10-01' });
    await placeAt(v, 1, new Date('2026-10-10'));
    expect(fdb._tables.placement[0]).toMatchObject({ commercial_model: 'PROGRAMME', fee_basis: 'FLAT', fee_flat: 4500, placement_fee: 4500, guarantee_days: 60 });

    // Later renegotiation (custom quote) applies to new placements only
    await prog('AGREE_TERMS', { programmeId: p.id, pricing_model: 'CUSTOM_QUOTE', per_hire_fee: '4000', guarantee_days: 30, agreed_on: '2026-11-01' });
    await placeAt(v, 2, new Date('2026-10-20')); // before the new terms take effect
    await placeAt(v, 3, new Date('2026-11-05'));
    expect(fdb._tables.placement.map((x: any) => x.placement_fee)).toEqual([4500, 4500, 4000]);
    expect(fdb._tables.programmeTerms).toHaveLength(2); // history kept

    // A flat fee doesn't change with CTC edits
    await vac(v, 'UPDATE_PLACEMENT', { placementId: fdb._tables.placement[0].id, annual_ctc: '200000' });
    expect(fdb._tables.placement[0].placement_fee).toBe(4500);
  });

  it('summarises progress, candidates and invoice status', () => {
    const s = summariseProgramme({
      target_hires: 12,
      vacancies: [
        { shortlists: [{ candidates: [{}, {}, {}] }], placements: [{ placement_fee: 4500, invoice_status: 'PAID' }, { placement_fee: 4500, invoice_status: 'INVOICED' }] },
        { shortlists: [], placements: [{ placement_fee: 4500, invoice_status: 'NOT_INVOICED' }] },
      ],
    });
    expect(s).toEqual({ linkedVacancies: 2, shortlistedCandidates: 3, placements: 3, remainingToTarget: 9, fees: { total: 13500, notInvoiced: 4500, invoiced: 9000, paid: 4500 } });
  });

  it('are disabled with the feature flag off', async () => {
    process.env.FEATURE_BULK_PROGRAMMES = 'false';
    expect((await prog('CREATE_PROGRAMME', {})).status).toBe(404);
  });
});

describe('public enquiry', () => {
  const body = (over: object = {}) => ({
    companyName: 'Acme Contact Centre',
    contactName: 'Naledi',
    workEmail: 'naledi@acme.co.za',
    targetHires: 25,
    roleCategories: ['SALES', 'NOT_A_CATEGORY'],
    requirements: 'An intake of 25 junior agents for inbound customer service in February.',
    submissionKey: uuid(),
    website: '',
    formStartedAt: Date.now() - 60_000,
    ...over,
  });

  it('creates an enquiry and alerts operations once, with no pricing applied', async () => {
    const b = body();
    const res = await enquiry(jsonRequest('http://localhost/api/programmes/enquiry', b));
    expect(res.status).toBe(201);
    const [p] = fdb._tables.bulkProgramme;
    expect(p).toMatchObject({ source: 'ENQUIRY_FORM', status: 'ENQUIRY', target_hires: 25, role_categories: ['SALES'] });
    expect(fdb._tables.programmeTerms ?? []).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(1);
    const again = await enquiry(jsonRequest('http://localhost/api/programmes/enquiry', b));
    expect((await again.json()).duplicate).toBe(true);
    expect(fdb._tables.bulkProgramme).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('validates input, rejects bots and is off unless enabled', async () => {
    expect((await enquiry(jsonRequest('http://localhost/x', body({ workEmail: 'nope' })))).status).toBe(400);
    expect((await enquiry(jsonRequest('http://localhost/x', body({ website: 'spam' })))).status).toBe(400);
    process.env.FEATURE_BULK_ENQUIRY_PUBLIC = 'false';
    expect((await enquiry(jsonRequest('http://localhost/x', body()))).status).toBe(404);
    expect(fdb._tables.bulkProgramme ?? []).toHaveLength(0);
  });
});
