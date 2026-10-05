/**
 * End-to-end operations journey on the in-memory database:
 * vacancy -> calibration -> shortlist -> employer link -> interview request -> offer -> hire ->
 * invoice/payment -> 30/60/90-day follow-up -> report. Plus cross-vacancy tampering checks.
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
import { runVacancyAction } from '@/lib/hire/ops';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { POST as vacancyAction } from '@/app/api/superadmin/vacancies/[id]/route';
import { POST as viewShortlist } from '@/app/api/shortlists/view/route';
import { POST as requestInterview } from '@/app/api/shortlists/interview-request/route';
import { GET as getMetrics } from '@/app/api/superadmin/hire-metrics/route';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const send = sendEmail as jest.Mock;
const DAY = 86_400_000;

beforeEach(() => {
  fdb.reset();
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

it('takes a vacancy from submission to hire and retention follow-up', async () => {
  // 1. Employer submits a vacancy anonymously
  signedInAs(null);
  const sub = await (await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody()))).json();
  const vacancyId = sub.reference;
  expect(sub.confirmationEmailSent).toBe(true);

  // 2. Operations (SUPERADMIN, via the real route) assigns themselves and starts calibration
  const admin = await fdb.user.create({ data: { email: 'ops@launchpath.co.za', role: 'SUPERADMIN', name: 'Ops' } });
  signedInAs('SUPERADMIN', admin.id);
  const act = async (action: string, payload: object = {}) => {
    const res = await vacancyAction(jsonRequest(`http://localhost/api/superadmin/vacancies/${vacancyId}`, { action, payload }), { params: { id: String(vacancyId) } });
    return { status: res.status, body: await res.json() };
  };
  expect((await act('UPDATE_VACANCY', { owner_id: admin.id, status: 'ROLE_CALIBRATION', internal_notes: 'Must be comfortable with outbound calls.' })).status).toBe(200);

  // 3. Build a shortlist: one platform candidate (prefilled from profile) and two sourced manually
  const platform = await fdb.user.create({
    data: { email: 'thabo@example.com', role: 'CANDIDATE', name: 'Thabo N', professional_title: 'Sales intern', location: 'Gauteng', skills: 'CRM, Excel', cv_url: 'https://drive.example/cv.pdf' },
  });
  await fdb.videoInterview.create({ data: { candidate_id: platform.id, score: 91, status: 'COMPLETED' } }); // practice score: must NOT be copied
  await act('CREATE_SHORTLIST');
  const shortlistId = fdb._tables.shortlist[0].id;
  expect((await act('ADD_CANDIDATE', { shortlistId, candidateId: platform.id })).status).toBe(200);
  await act('ADD_CANDIDATE', { shortlistId, display_name: 'Lerato M', match_level: 'STRONG', communication_rating: 5, interview_readiness: 4, role_assessment_name: 'Cold-call role play', role_assessment_score: 8, role_assessment_max: 10 });
  await act('ADD_CANDIDATE', { shortlistId, display_name: 'Ayanda K', salary_expectation: '14000' });
  const [thabo, lerato, ayanda] = fdb._tables.shortlistCandidate;
  expect(thabo).toMatchObject({ display_name: 'Thabo N', target_role: 'Sales intern', location: 'Gauteng', key_skills: ['CRM', 'Excel'], cv_external_url: 'https://drive.example/cv.pdf', candidate_id: platform.id });
  expect(thabo.communication_rating ?? null).toBeNull();
  expect(thabo.assessed_at ?? null).toBeNull(); // nothing assessed, nothing dated
  expect(lerato.assessed_by_id).toBe(admin.id);

  // An incomplete role assessment is rejected rather than shown half-filled
  expect((await act('UPDATE_CANDIDATE', { shortlistCandidateId: ayanda.id, role_assessment_name: 'Excel task' })).status).toBe(400);

  // 4. Send the shortlist
  const sent = await act('SEND_SHORTLIST', { shortlistId, expiresInDays: 14 });
  expect(sent.status).toBe(200);
  expect(sent.body).toMatchObject({ email: 'SENT', outsideTarget: false });
  const token = new URL(sent.body.url).hash.replace('#t=', '');
  expect(fdb._tables.vacancy[0].status).toBe('SHORTLIST_SENT');
  expect(send.mock.calls.at(-1)[0]).toMatchObject({ to: 'naledi@acme.co.za' });
  expect(send.mock.calls.at(-1)[0].text).toContain(sent.body.url);

  // 5. Employer opens the link and requests an interview with Lerato
  signedInAs(null);
  const view = await (await viewShortlist(jsonRequest('http://localhost/api/shortlists/view', { token }))).json();
  expect(view.candidates.map((c: any) => c.name)).toEqual(['Thabo N', 'Lerato M', 'Ayanda K']);
  expect(view.candidates[0].communication).toBeNull(); // practice score 91 never surfaces
  expect(view.candidates[1].roleAssessment).toEqual({ name: 'Cold-call role play', score: 8, max: 10, note: null });
  const req = await requestInterview(jsonRequest('http://localhost/api/shortlists/interview-request', { token, candidateId: lerato.id, preferredTimes: 'Thursday' }));
  expect(req.status).toBe(201);
  expect(fdb._tables.vacancy[0].status).toBe('INTERVIEWING');

  // 6. Feedback, offer made, offer accepted
  signedInAs('SUPERADMIN', admin.id);
  const requestId = fdb._tables.interviewRequest[0].id;
  await act('UPDATE_INTERVIEW_REQUEST', { requestId, status: 'COMPLETED' });
  await act('UPDATE_CANDIDATE', { shortlistCandidateId: lerato.id, interview_outcome: 'ADVANCED', employer_feedback: 'Great energy.' });
  await act('UPDATE_CANDIDATE', { shortlistCandidateId: lerato.id, offer_status: 'OFFERED' });
  expect(fdb._tables.vacancy[0].status).toBe('OFFER');
  await act('UPDATE_CANDIDATE', { shortlistCandidateId: lerato.id, offer_status: 'ACCEPTED' });
  expect(fdb._tables.shortlistCandidate[1]).toMatchObject({ offer_status: 'ACCEPTED', employer_feedback: 'Great energy.' });

  // 7. Record the placement; fee is server-calculated from current terms (client fee ignored)
  const start = new Date(Date.now() - 95 * DAY).toISOString().slice(0, 10);
  const placed = await act('CREATE_PLACEMENT', { shortlistCandidateId: lerato.id, start_date: start, annual_ctc: '180000', placement_fee: 1 });
  expect(placed.status).toBe(200);
  const p = fdb._tables.placement[0];
  expect(p).toMatchObject({ candidate_name: 'Lerato M', placement_fee: 13_500, fee_rate_bps: 750, guarantee_days: 60 });
  expect(fdb._tables.vacancy[0].status).toBe('HIRED');
  expect((await act('CREATE_PLACEMENT', { shortlistCandidateId: lerato.id, start_date: start, annual_ctc: '180000' })).status).toBe(400);

  // Changing settings later does not alter the agreed fee
  await act('UPDATE_PLACEMENT', { placementId: p.id, annual_ctc: '200000' });
  expect(fdb._tables.placement[0].placement_fee).toBe(15_000);

  // 8. Invoice and payment
  await act('UPDATE_PLACEMENT', { placementId: p.id, invoice_status: 'INVOICED' });
  await act('UPDATE_PLACEMENT', { placementId: p.id, invoice_status: 'PAID' });
  expect(fdb._tables.placement[0].invoiced_at).toBeInstanceOf(Date);
  expect(fdb._tables.placement[0].paid_at).toBeInstanceOf(Date);

  // 9. Follow-ups: 30 and 60 confirmed; 90 not yet due so "still employed" is refused
  await act('UPDATE_PLACEMENT', { placementId: p.id, check_30_outcome: 'RETAINED' });
  await act('UPDATE_PLACEMENT', { placementId: p.id, check_60_outcome: 'RETAINED', check_60_note: 'Manager happy.' });
  expect(fdb._tables.vacancy[0].status).toBe('CHECK_60');
  fdb._tables.placement[0].start_date = new Date(Date.now() - 80 * DAY); // only 80 days in
  expect((await act('UPDATE_PLACEMENT', { placementId: p.id, check_90_outcome: 'RETAINED' })).status).toBe(400);
  fdb._tables.placement[0].start_date = new Date(start + 'T00:00:00Z');

  // Each milestone was recorded exactly once
  const types = fdb._tables.hireEvent.map((e: any) => e.type).sort();
  expect(types).toEqual(['FEE_INVOICED', 'FEE_PAID', 'HIRE_COMPLETED', 'INTERVIEW_REQUESTED', 'OFFER_ACCEPTED', 'OFFER_MADE', 'ROLE_CALIBRATION', 'SHORTLIST_SENT'].sort());
  expect(fdb._tables.vacancyStatusEvent.map((e: any) => e.to_status)).toEqual(['NEW_VACANCY', 'ROLE_CALIBRATION', 'SHORTLIST_SENT', 'INTERVIEWING', 'OFFER', 'HIRED', 'CHECK_30', 'CHECK_60']);

  // 10. The report reflects real records
  const metrics = (await (await getMetrics(new Request('http://localhost/api/superadmin/hire-metrics?days=365'))).json()).metrics;
  expect(metrics.vacanciesInWindow).toBe(1);
  expect(metrics.liveVacancies.value).toBe(0);
  expect(metrics.timeToShortlist.count).toBe(1);
  expect(metrics.shortlistToInterview).toMatchObject({ numerator: 1, denominator: 1 });
  expect(metrics.interviewToOffer).toMatchObject({ numerator: 1, denominator: 1 });
  expect(metrics.vacancyToHire).toMatchObject({ numerator: 1, denominator: 1 });
  expect(metrics.offerAcceptance).toMatchObject({ numerator: 1, denominator: 1 });
  expect(metrics.averagePlacementFee.value).toBe(15_000);
  expect(metrics.retention60).toMatchObject({ retained: 1, departed: 0, eligible: 1 });
  expect(metrics.retention90).toMatchObject({ retained: 0, unknownOrNotChecked: 1, eligible: 1, value: null }); // due but not yet checked
});

it('never lets an action on one vacancy touch another vacancy’s records', async () => {
  signedInAs(null);
  const a = (await (await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody()))).json()).reference;
  const b = (await (await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle: 'Other role' })))).json()).reference;
  const ctx = { actorId: 1, terms: DEFAULT_HIRE_TERMS };
  await runVacancyAction(fdb, a, 'CREATE_SHORTLIST', {}, ctx);
  await runVacancyAction(fdb, a, 'ADD_CANDIDATE', { shortlistId: 1, display_name: 'Lerato M' }, ctx);
  await runVacancyAction(fdb, a, 'SEND_SHORTLIST', { shortlistId: 1, sendEmail: false }, ctx);
  await runVacancyAction(fdb, a, 'CREATE_PLACEMENT', { shortlistCandidateId: 1, start_date: '2026-09-01', annual_ctc: '180000' }, ctx);

  const attempts: [string, Record<string, unknown>][] = [
    ['ADD_CANDIDATE', { shortlistId: 1, display_name: 'Intruder' }],
    ['UPDATE_CANDIDATE', { shortlistCandidateId: 1, recruiter_note: 'changed' }],
    ['REMOVE_CANDIDATE', { shortlistCandidateId: 1 }],
    ['SEND_SHORTLIST', { shortlistId: 1 }],
    ['REVOKE_LINK', { linkId: 1 }],
    ['RECORD_INTERVIEW_REQUEST', { shortlistCandidateId: 1 }],
    ['CREATE_PLACEMENT', { shortlistCandidateId: 1, start_date: '2026-09-01', annual_ctc: '180000' }],
    ['UPDATE_PLACEMENT', { placementId: 1, invoice_status: 'PAID' }],
    ['DELETE_SHORTLIST', { shortlistId: 1 }],
  ];
  for (const [action, payload] of attempts) {
    const res = await runVacancyAction(fdb, b, action, payload, ctx);
    expect([action, res.status]).toEqual([action, 404]);
  }
  expect(fdb._tables.shortlistCandidate).toHaveLength(1);
  expect(fdb._tables.shortlistCandidate[0].recruiter_note ?? null).toBeNull();
  expect(fdb._tables.shortlistLink[0].revoked_at).toBeNull();
  expect(fdb._tables.placement[0].invoice_status).toBe('NOT_INVOICED');
  expect((await runVacancyAction(fdb, b, 'NOT_AN_ACTION', {}, ctx)).status).toBe(400);
  expect((await runVacancyAction(fdb, 999, 'CREATE_SHORTLIST', {}, ctx)).status).toBe(404);
});
