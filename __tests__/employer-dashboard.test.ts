/**
 * Employer dashboard: company-level isolation on every query and action, sent shortlists only,
 * employer-safe fields only, no access from email/domain matches, scorecards only when entitled.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => false), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/hire/cv', () => ({ presignCvUrl: jest.fn(async (k: string) => `https://signed.example/${k}?X-Amz-Expires=300`) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { runVacancyAction } from '@/lib/hire/ops';
import { runAccountAction } from '@/lib/hire/accounts';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { GET as dashboardGet, POST as dashboardPost } from '@/app/api/employer/hire/route';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const ctx = { actorId: 1, terms: DEFAULT_HIRE_TERMS };
const account = (a: string, p: Record<string, unknown>) => runAccountAction(fdb, a, p, ctx);
const get = async () => {
  const r = await dashboardGet();
  return { status: r.status, body: await r.json() };
};
const post = async (body: object) => {
  const r = await dashboardPost(jsonRequest('http://localhost/api/employer/hire', body));
  return { status: r.status, body: await r.json() };
};

let A: { companyId: number; userId: number; entryId: number; draftEntryId: number; vacancyId: number };
let B: { companyId: number; userId: number; entryId: number };

async function companyWithShortlist(name: string, email: string, title: string) {
  signedInAs(null);
  const vacancyId = (await (await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle: title, workEmail: email })))).json()).reference;
  const company = (await account('CREATE_COMPANY', { name })).body.company;
  const user = await fdb.user.create({ data: { email, role: 'CLIENT', name: `${name} HR` } });
  await account('ADD_MEMBER', { companyId: company.id, userId: user.id });
  await runVacancyAction(fdb, vacancyId, 'LINK_COMPANY', { companyId: company.id }, ctx);
  await runVacancyAction(fdb, vacancyId, 'UPDATE_VACANCY', { internal_notes: `SECRET-NOTE-${name}` }, ctx);
  await runVacancyAction(fdb, vacancyId, 'CREATE_SHORTLIST', {}, ctx);
  await runVacancyAction(fdb, vacancyId, 'CREATE_SHORTLIST', { title: 'Draft' }, ctx);
  const [sent, draft] = fdb._tables.shortlist.filter((s: any) => s.vacancy_id === vacancyId);
  await runVacancyAction(fdb, vacancyId, 'ADD_CANDIDATE', { shortlistId: sent.id, display_name: `${name} Candidate`, cv_s3_key: 'media/resumes/1/a.pdf', recruiter_note: 'Shared note' }, ctx);
  await runVacancyAction(fdb, vacancyId, 'ADD_CANDIDATE', { shortlistId: draft.id, display_name: `${name} Draft Candidate` }, ctx);
  await runVacancyAction(fdb, vacancyId, 'SEND_SHORTLIST', { shortlistId: sent.id, sendEmail: false }, ctx);
  const entries = fdb._tables.shortlistCandidate.filter((c: any) => [sent.id, draft.id].includes(c.shortlist_id));
  return { companyId: company.id, userId: user.id, vacancyId, entryId: entries.find((e: any) => e.shortlist_id === sent.id).id, draftEntryId: entries.find((e: any) => e.shortlist_id === draft.id).id };
}

beforeEach(async () => {
  fdb.reset();
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  process.env.FEATURE_EMPLOYER_DASHBOARD = 'true';
  process.env.FEATURE_HIRING_PARTNER = 'true';
  await fdb.user.create({ data: { email: 'ops@launchpath.co.za', role: 'SUPERADMIN' } });
  A = await companyWithShortlist('Acme', 'hr@acme.co.za', 'Role A');
  B = await companyWithShortlist('Beta', 'hr@beta.co.za', 'Role B');
});
afterAll(() => {
  delete process.env.FEATURE_EMPLOYER_DASHBOARD;
  delete process.env.FEATURE_HIRING_PARTNER;
});

it('is off unless enabled and only for employer accounts', async () => {
  process.env.FEATURE_EMPLOYER_DASHBOARD = 'false';
  signedInAs('CLIENT', A.userId);
  expect((await get()).status).toBe(404);
  process.env.FEATURE_EMPLOYER_DASHBOARD = 'true';
  signedInAs(null);
  expect((await get()).status).toBe(401);
  signedInAs('CANDIDATE', 999);
  expect((await get()).status).toBe(403);
});

it('shows only the user’s own company, sent shortlists and employer-safe fields', async () => {
  signedInAs('CLIENT', A.userId);
  const { status, body } = await get();
  expect(status).toBe(200);
  expect(body.companies.map((c: any) => c.name)).toEqual(['Acme']);
  expect(body.vacancies.map((v: any) => v.id)).toEqual([A.vacancyId]);
  const names = body.vacancies.flatMap((v: any) => v.shortlists.flatMap((s: any) => s.candidates.map((c: any) => c.name)));
  expect(names).toEqual(['Acme Candidate']); // draft shortlist hidden
  const raw = JSON.stringify(body);
  for (const secret of ['SECRET-NOTE', 'Beta', 'hr@acme.co.za', 'contact_email', 'candidate_id', 'media/resumes', 'internal_notes', 'contact_phone']) expect(raw).not.toContain(secret);
  expect(raw).toContain('Shared note'); // recruiter note intended for the employer
});

it('never grants access from an email or domain match', async () => {
  const sameDomain = await fdb.user.create({ data: { email: 'ceo@acme.co.za', role: 'CLIENT' } });
  signedInAs('CLIENT', sameDomain.id);
  const { body } = await get();
  expect(body).toEqual({ companies: [], vacancies: [] });
  expect((await post({ action: 'REQUEST_INTERVIEW', shortlistCandidateId: A.entryId })).status).toBe(404);
});

it('scopes interview requests, feedback and CV access to the user’s company and sent shortlists', async () => {
  signedInAs('CLIENT', A.userId);
  for (const action of ['REQUEST_INTERVIEW', 'FEEDBACK', 'CV']) {
    expect((await post({ action, shortlistCandidateId: B.entryId, decision: 'INTERESTED' })).status).toBe(404); // other company
    expect((await post({ action, shortlistCandidateId: A.draftEntryId, decision: 'INTERESTED' })).status).toBe(404); // unsent shortlist
  }
  expect(fdb._tables.interviewRequest ?? []).toHaveLength(0);
  expect(fdb._tables.employerFeedback ?? []).toHaveLength(0);

  const first = await post({ action: 'REQUEST_INTERVIEW', shortlistCandidateId: A.entryId, preferredTimes: 'Thursday' });
  expect(first.status).toBe(201);
  expect(fdb._tables.interviewRequest[0]).toMatchObject({ vacancy_id: A.vacancyId, shortlist_candidate_id: A.entryId, source: 'EMPLOYER_DASHBOARD', requested_by_user_id: A.userId });
  expect((await post({ action: 'REQUEST_INTERVIEW', shortlistCandidateId: A.entryId })).body.alreadyRequested).toBe(true);
  expect(fdb._tables.interviewRequest).toHaveLength(1);

  const cv = await post({ action: 'CV', shortlistCandidateId: A.entryId });
  expect(cv.body.url).toContain('X-Amz-Expires=300');
});

it('accepts feedback, and scorecards only for companies entitled to them', async () => {
  signedInAs('CLIENT', A.userId);
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: A.entryId, decision: 'WOW' })).status).toBe(400);
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: A.entryId, decision: 'INTERESTED', comment: 'Strong call' })).status).toBe(200);
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: A.entryId, decision: 'MAYBE', score_overall: 4 })).status).toBe(403);
  expect(fdb._tables.employerFeedback).toHaveLength(1);
  expect(fdb._tables.employerFeedback[0]).toMatchObject({ decision: 'INTERESTED', company_id: A.companyId, user_id: A.userId });

  // Entitle company A through an active Hiring Partner subscription with scorecards
  const plan = (await account('CREATE_PLAN_FROM_INDICATIVE', {})).body.plan;
  await account('ACTIVATE_PLAN', { planId: plan.id });
  const sub = (await account('CREATE_SUBSCRIPTION', { companyId: A.companyId, planVersionId: plan.id })).body.subscription;
  await account('MANUAL_ACTIVATE', { subscriptionId: sub.id });
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: A.entryId, decision: 'INTERESTED', score_overall: 4, score_skills: 5 })).status).toBe(200);
  expect(fdb._tables.employerFeedback).toHaveLength(1); // updated, not duplicated
  expect(fdb._tables.employerFeedback[0]).toMatchObject({ score_overall: 4, score_skills: 5 });
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: A.entryId, decision: 'INTERESTED', score_overall: 9 })).status).toBe(400);

  // Company B is not entitled, even while A is
  signedInAs('CLIENT', B.userId);
  expect((await post({ action: 'FEEDBACK', shortlistCandidateId: B.entryId, decision: 'INTERESTED', score_overall: 4 })).status).toBe(403);
});
