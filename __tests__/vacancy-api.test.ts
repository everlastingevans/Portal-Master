/**
 * Public vacancy submission and SUPERADMIN-only operations APIs, against an in-memory database.
 * Auth runs through the real getSession/checkRole with the cookie + jose mocks from jest.setup.js.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => false), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { isEmailConfigured, sendEmail } from '@/lib/notifications';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { GET as listVacancies } from '@/app/api/superadmin/vacancies/route';
import { GET as getVacancy, POST as vacancyAction } from '@/app/api/superadmin/vacancies/[id]/route';
import { PUT as putTerms } from '@/app/api/superadmin/hire-terms/route';
import { GET as getMetrics } from '@/app/api/superadmin/hire-metrics/route';
import { GET as previewEmail } from '@/app/api/superadmin/email-preview/route';
import { GET as searchCandidates } from '@/app/api/superadmin/candidates/search/route';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const mockedConfigured = isEmailConfigured as jest.Mock;
const mockedSend = sendEmail as jest.Mock;
const post = (body: unknown, ip?: string) => submitVacancy(jsonRequest('http://localhost/api/vacancies', body, ip ? { headers: { 'x-forwarded-for': ip } } : {}));

beforeEach(() => {
  fdb.reset();
  jest.clearAllMocks();
  mockedConfigured.mockReturnValue(false);
  mockedSend.mockResolvedValue(true);
  signedInAs(null);
});

describe('POST /api/vacancies (public submission)', () => {
  it('creates a New Vacancy anonymously, without payment or an account', async () => {
    const res = await post(vacancyBody());
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json).toMatchObject({ success: true, duplicate: false, confirmationEmailSent: false });
    const [v] = fdb._tables.vacancy;
    expect(v).toMatchObject({ status: 'NEW_VACANCY', submitted_by_user_id: null, contact_phone: '+27821234567' });
    expect(fdb._tables.vacancyStatusEvent).toHaveLength(1);
  });

  it('never links an account or overwrites a lead from an unverified email', async () => {
    await fdb.user.create({ data: { email: 'naledi@acme.co.za', role: 'CLIENT', password: 'x' } });
    await post(vacancyBody());
    await post(vacancyBody({ companyName: 'Someone Else Ltd', roleTitle: 'Another role' }));
    expect(fdb._tables.vacancy.every((v: any) => v.submitted_by_user_id === null)).toBe(true);
    expect(fdb._tables.employerLead).toHaveLength(1);
    expect(fdb._tables.employerLead[0].company_name).toBe('Acme Trading');
  });

  it('links the submitter only through a verified employer session', async () => {
    signedInAs('CLIENT', 42);
    await post(vacancyBody());
    signedInAs('CANDIDATE', 43);
    await post(vacancyBody({ roleTitle: 'Second role' }));
    expect(fdb._tables.vacancy.map((v: any) => v.submitted_by_user_id)).toEqual([42, null]);
  });

  it('records but does not send emails when no provider is configured, and never claims a confirmation', async () => {
    const json = await (await post(vacancyBody())).json();
    expect(json.confirmationEmailSent).toBe(false);
    expect(mockedSend).not.toHaveBeenCalled();
    expect(fdb._tables.emailLog.map((e: any) => e.status)).toEqual(['NOT_CONFIGURED', 'NOT_CONFIGURED']);
  });

  it('sends one operations alert and one employer confirmation when email is configured', async () => {
    mockedConfigured.mockReturnValue(true);
    const json = await (await post(vacancyBody())).json();
    expect(json.confirmationEmailSent).toBe(true);
    expect(mockedSend.mock.calls.map((c) => c[0].to).sort()).toEqual(['hello@launchpath.co.za', 'naledi@acme.co.za']);
  });

  it('still saves the vacancy and reports no confirmation if the provider fails', async () => {
    mockedConfigured.mockReturnValue(true);
    mockedSend.mockResolvedValue(false);
    const res = await post(vacancyBody());
    expect(res.status).toBe(201);
    expect((await res.json()).confirmationEmailSent).toBe(false);
    expect(fdb._tables.emailLog.every((e: any) => e.status === 'FAILED' && e.last_error)).toBe(true);
  });

  it('returns field errors and creates nothing for an invalid submission', async () => {
    const res = await post(vacancyBody({ workEmail: 'nope', salaryMin: '' }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBeUndefined();
    expect(Object.keys(json.errors)).toEqual(expect.arrayContaining(['workEmail', 'salaryMin']));
    expect(fdb._tables.vacancy ?? []).toHaveLength(0);
  });

  it('rejects malformed JSON, honeypot and too-fast submissions', async () => {
    expect((await post('{not json')).status).toBe(400);
    expect((await post(vacancyBody({ website: 'http://spam.example' }))).status).toBe(400);
    expect((await post(vacancyBody({ formStartedAt: Date.now() }))).status).toBe(400);
    expect(fdb._tables.vacancy ?? []).toHaveLength(0);
  });

  it('treats a retried submission as a duplicate without creating or emailing again', async () => {
    mockedConfigured.mockReturnValue(true);
    const body = vacancyBody();
    const first = await (await post(body)).json();
    const again = await post(body);
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ success: true, duplicate: true, reference: first.reference });
    expect(fdb._tables.vacancy).toHaveLength(1);
    expect(mockedSend).toHaveBeenCalledTimes(2);
  });

  it('treats the same role from the same email within 24h as a duplicate without revealing its reference', async () => {
    await post(vacancyBody());
    const json = await (await post(vacancyBody())).json();
    expect(json).toEqual({ success: true, duplicate: true, reference: null });
    expect(fdb._tables.vacancy).toHaveLength(1);
  });

  it('returns an error, not a success, when the database fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const spy = jest.spyOn(fdb.vacancy, 'findFirst').mockRejectedValueOnce(new Error('db down'));
    const res = await post(vacancyBody());
    expect(res.status).toBe(500);
    expect((await res.json()).success).toBeUndefined();
    spy.mockRestore();
  });

  it('rate limits repeated submissions from one IP', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await post(vacancyBody({ roleTitle: `Role ${i}` }), '10.9.9.9')).status);
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});

describe('Operations APIs are SUPERADMIN-only', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  const ctx = { params: { id: '1' } };
  const action = (action: string, payload = {}) => vacancyAction(jsonRequest('http://localhost/api/superadmin/vacancies/1', { action, payload }), ctx);

  it.each([
    [null, 401],
    ['CANDIDATE', 403],
    ['CLIENT', 403],
    ['EMPLOYER', 403],
  ])('blocks %s from every operations endpoint', async (role, status) => {
    signedInAs('SUPERADMIN');
    await post(vacancyBody());
    signedInAs(role);
    const req = (u: string) => new Request(u);
    expect((await listVacancies()).status).toBe(status);
    expect((await getVacancy(req('http://localhost/x'), ctx)).status).toBe(status);
    expect((await action('UPDATE_VACANCY', { status: 'SOURCING' })).status).toBe(status);
    expect((await action('CREATE_SHORTLIST')).status).toBe(status);
    expect((await putTerms(jsonRequest('http://localhost/x', { feeRateBps: 100, feeMin: 1, feeMax: 2, guaranteeDays: 1 }, { method: 'PUT' }))).status).toBe(status);
    expect((await getMetrics(req('http://localhost/api/superadmin/hire-metrics'))).status).toBe(status);
    expect((await previewEmail(req('http://localhost/api/superadmin/email-preview?template=vacancy_confirmation'))).status).toBe(status);
    expect((await searchCandidates(req('http://localhost/api/superadmin/candidates/search?q=na'))).status).toBe(status);
    expect(fdb._tables.vacancy[0].status).toBe('NEW_VACANCY');
    expect(fdb._tables.shortlist ?? []).toHaveLength(0);
    expect(fdb._tables.appSetting ?? []).toHaveLength(0);
  });

  it('lets a SUPERADMIN list and open vacancies without exposing shortlist token hashes', async () => {
    await post(vacancyBody());
    signedInAs('SUPERADMIN');
    expect((await listVacancies()).status).toBe(200);
    await action('CREATE_SHORTLIST');
    await action('ADD_CANDIDATE', { shortlistId: 1, display_name: 'Lerato M' });
    await action('SEND_SHORTLIST', { shortlistId: 1, sendEmail: false });
    const res = await getVacancy(new Request('http://localhost/x'), ctx);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(json)).not.toContain('token_hash');
    expect(json.vacancy.shortlists[0].links).toHaveLength(1);
  });

  it('only allows admins as owners and validates hire terms', async () => {
    await post(vacancyBody());
    signedInAs('SUPERADMIN');
    await fdb.user.create({ data: { email: 'c@x.co', role: 'CANDIDATE' } });
    expect((await action('UPDATE_VACANCY', { owner_id: 1 })).status).toBe(400);
    const bad = await putTerms(jsonRequest('http://localhost/x', { feeRateBps: 750, feeMin: 20000, feeMax: 18000, guaranteeDays: 60 }, { method: 'PUT' }));
    expect(bad.status).toBe(400);
    const good = await putTerms(jsonRequest('http://localhost/x', { feeRateBps: 800, feeMin: 8000, feeMax: 20000, guaranteeDays: 60 }, { method: 'PUT' }));
    expect(good.status).toBe(200);
  });

  it('renders email previews with fictional data and sends nothing', async () => {
    signedInAs('SUPERADMIN');
    const res = await previewEmail(new Request('http://localhost/api/superadmin/email-preview?template=shortlist_ready'));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('View your shortlist');
    expect(html).toContain('Preview only');
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
