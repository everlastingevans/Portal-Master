/**
 * Shortlist share links and the employer actions behind them: unguessable, hashed, revocable,
 * time-limited tokens; card-only data; scoped CV access; interview requests; no indexing or caching.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => true), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/hire/cv', () => ({ presignCvUrl: jest.fn(async (key: string) => `https://signed.example/${key}?X-Amz-Expires=300`) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { sendEmail } from '@/lib/notifications';
import { runVacancyAction } from '@/lib/hire/ops';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { generateShortlistToken, hashShortlistToken, isWellFormedToken, linkState, LINK_UNAVAILABLE } from '@/lib/hire/shortlist-access';
import { POST as viewShortlist } from '@/app/api/shortlists/view/route';
import { POST as getCv } from '@/app/api/shortlists/cv/route';
import { POST as requestInterview } from '@/app/api/shortlists/interview-request/route';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { middleware } from '@/middleware';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const mockedSend = sendEmail as jest.Mock;
const ctx = (now?: Date) => ({ actorId: 7, terms: DEFAULT_HIRE_TERMS, now });
const call = (route: (r: Request) => Promise<Response>, body: unknown) => route(jsonRequest('http://localhost/api/shortlists/x', body));

/** Vacancy with a sent shortlist of two candidates; returns the raw token from the send action. */
async function setup(roleTitle = 'Junior Sales Consultant') {
  const res = await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle })));
  const vacancyId = (await res.json()).reference;
  await runVacancyAction(fdb, vacancyId, 'CREATE_SHORTLIST', {}, ctx());
  const shortlistId = fdb._tables.shortlist.at(-1).id;
  const add = (p: object) => runVacancyAction(fdb, vacancyId, 'ADD_CANDIDATE', { shortlistId, ...p }, ctx());
  await add({ display_name: 'Lerato M', target_role: 'SDR', cv_s3_key: 'media/resumes/7/1-lerato.pdf', match_level: 'STRONG', communication_rating: 4, recruiter_note: 'Confident on calls.' });
  await add({ display_name: 'Sipho D' });
  const entries = fdb._tables.shortlistCandidate.filter((c: any) => c.shortlist_id === shortlistId);
  const sent = await runVacancyAction(fdb, vacancyId, 'SEND_SHORTLIST', { shortlistId, expiresInDays: 14 }, ctx());
  const token = new URL(sent.body.url).hash.replace('#t=', '');
  return { vacancyId, shortlistId, entries, token, sent };
}

beforeEach(() => {
  fdb.reset();
  jest.clearAllMocks();
  signedInAs(null);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('tokens', () => {
  it('are 256-bit, URL-safe, unique and stored only as a hash', async () => {
    const a = generateShortlistToken();
    const b = generateShortlistToken();
    expect(isWellFormedToken(a.token)).toBe(true);
    expect(a.token).not.toEqual(b.token);
    expect(a.hash).toBe(hashShortlistToken(a.token));
    expect(a.hash).not.toContain(a.token);

    const { token, sent } = await setup();
    expect(sent.body.url).toMatch(/\/shortlist#t=[A-Za-z0-9_-]{43}$/); // fragment: never sent to servers or analytics
    expect(JSON.stringify(fdb._tables.shortlistLink)).not.toContain(token);
    expect(fdb._tables.shortlistLink[0].token_hash).toBe(hashShortlistToken(token));
  });

  it('link state covers expiry and revocation', () => {
    const now = new Date('2026-10-05T10:00:00Z');
    expect(linkState(null, now)).toBe('not_found');
    expect(linkState({ revoked_at: null, expires_at: new Date('2026-10-06') }, now)).toBe('ok');
    expect(linkState({ revoked_at: null, expires_at: now }, now)).toBe('expired');
    expect(linkState({ revoked_at: new Date(), expires_at: new Date('2027-01-01') }, now)).toBe('revoked');
  });
});

describe('shortlist view', () => {
  it('returns only Candidate Card fields for a valid link', async () => {
    const { token } = await setup();
    const res = await call(viewShortlist, { token });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
    expect(json.candidates).toHaveLength(2);
    expect(json.candidates[0]).toMatchObject({ name: 'Lerato M', match: 'STRONG', communication: { rating: 4, note: null }, hasCv: true, interviewRequested: false });
    expect(json.candidates[1]).toMatchObject({ name: 'Sipho D', match: null, communication: null, roleAssessment: null, interviewReadiness: null, hasCv: false });
    const raw = JSON.stringify(json);
    for (const secret of ['naledi@acme.co.za', '0821234567', 'media/resumes', 'candidate_id', 'internal_notes', 'contact_email']) expect(raw).not.toContain(secret);
    expect(fdb._tables.shortlistLink[0].view_count).toBe(1);
  });

  it('gives the same unavailable response for wrong, malformed, expired and revoked tokens', async () => {
    const { token, vacancyId } = await setup();
    const bad = async (t: unknown) => {
      const res = await call(viewShortlist, { token: t });
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe(LINK_UNAVAILABLE);
    };
    await bad(generateShortlistToken().token);
    await bad('short');
    await bad(undefined);
    await bad(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'));

    fdb._tables.shortlistLink[0].expires_at = new Date(Date.now() - 1000);
    await bad(token);
    fdb._tables.shortlistLink[0].expires_at = new Date(Date.now() + 86_400_000);
    expect((await call(viewShortlist, { token })).status).toBe(200);

    await runVacancyAction(fdb, vacancyId, 'REVOKE_LINK', { linkId: fdb._tables.shortlistLink[0].id }, ctx());
    await bad(token);
  });

  it('rejects link expiry outside 1–60 days', async () => {
    const { vacancyId, shortlistId } = await setup();
    expect((await runVacancyAction(fdb, vacancyId, 'SEND_SHORTLIST', { shortlistId, expiresInDays: 0 }, ctx())).status).toBe(400);
    expect((await runVacancyAction(fdb, vacancyId, 'SEND_SHORTLIST', { shortlistId, expiresInDays: 365 }, ctx())).status).toBe(400);
  });
});

describe('CV access', () => {
  it('returns a short-lived URL only for a candidate on the token’s shortlist', async () => {
    const a = await setup();
    const b = await setup('Another role');
    const ok = await call(getCv, { token: a.token, candidateId: a.entries[0].id });
    expect(ok.status).toBe(200);
    expect((await ok.json()).url).toContain('X-Amz-Expires=300');

    // Candidate from another vacancy's shortlist, using vacancy A's token
    expect((await call(getCv, { token: a.token, candidateId: b.entries[0].id })).status).toBe(404);
    // Candidate without a CV
    expect((await call(getCv, { token: a.token, candidateId: a.entries[1].id })).status).toBe(404);
    // No token
    expect((await call(getCv, { candidateId: a.entries[0].id })).status).toBe(404);
  });
});

describe('interview requests from the shortlist link', () => {
  it('records the request against the right vacancy and candidate, once', async () => {
    const { token, entries, vacancyId } = await setup();
    mockedSend.mockClear();
    const res = await call(requestInterview, { token, candidateId: entries[0].id, requesterName: 'Naledi', preferredTimes: 'Tue am' });
    expect(res.status).toBe(201);
    expect((await res.json()).alreadyRequested).toBe(false);

    const [r] = fdb._tables.interviewRequest;
    expect(r).toMatchObject({ vacancy_id: vacancyId, shortlist_candidate_id: entries[0].id, source: 'EMPLOYER_LINK', requester_name: 'Naledi', preferred_times: 'Tue am', status: 'NEW' });
    expect(fdb._tables.hireEvent.filter((e: any) => e.type === 'INTERVIEW_REQUESTED')).toHaveLength(1);
    expect(fdb._tables.vacancy.find((v: any) => v.id === vacancyId).status).toBe('INTERVIEWING');
    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0][0].to).toBe('hello@launchpath.co.za');

    // Double click / repeat request: no duplicate request, event or email
    const again = await call(requestInterview, { token, candidateId: entries[0].id });
    expect(again.status).toBe(200);
    expect((await again.json()).alreadyRequested).toBe(true);
    expect(fdb._tables.interviewRequest).toHaveLength(1);
    expect(mockedSend).toHaveBeenCalledTimes(1);

    // The card now shows as requested
    const view = await (await call(viewShortlist, { token })).json();
    expect(view.candidates[0].interviewRequested).toBe(true);
  });

  it('refuses candidates outside the token’s shortlist and invalid tokens', async () => {
    const a = await setup();
    const b = await setup('Another role');
    expect((await call(requestInterview, { token: a.token, candidateId: b.entries[0].id })).status).toBe(404);
    expect((await call(requestInterview, { token: 'x'.repeat(43), candidateId: a.entries[0].id })).status).toBe(404);
    expect(fdb._tables.interviewRequest ?? []).toHaveLength(0);
  });

  it('still records the request when the ops email fails', async () => {
    const { token, entries } = await setup();
    mockedSend.mockResolvedValue(false);
    const res = await call(requestInterview, { token, candidateId: entries[1].id });
    expect(res.status).toBe(201);
    expect(fdb._tables.interviewRequest).toHaveLength(1);
    expect(fdb._tables.emailLog.find((e: any) => e.template === 'ops_interview_request').status).toBe('FAILED');
  });
});

describe('middleware', () => {
  it('serves the shortlist page and APIs without login, with noindex, no-referrer and no-store', async () => {
    for (const path of ['/shortlist', '/api/shortlists/view']) {
      const res = await middleware(new NextRequest(`http://localhost${path}`));
      expect(res.status).toBe(200);
      expect(res.headers.get('x-robots-tag')).toContain('noindex');
      expect(res.headers.get('referrer-policy')).toBe('no-referrer');
      expect(res.headers.get('cache-control')).toContain('no-store');
    }
  });

  it('still requires login for admin APIs', async () => {
    const res = await middleware(new NextRequest('http://localhost/api/superadmin/vacancies'));
    expect(res.status).toBe(401);
  });
});
