/**
 * Interview ownership. Before this, any signed-in user could change any interview, and an employer
 * could invite (and SMS/WhatsApp) any candidate on any application.
 */
jest.mock('@/lib/notifications', () => ({ dispatchInterviewInvitation: jest.fn(async () => undefined) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { dispatchInterviewInvitation } from '@/lib/notifications';
import { POST as createInterview } from '@/app/api/interviews/route';
import { PATCH as updateInterview } from '@/app/api/interviews/[id]/route';
import { jsonRequest, signedInAs } from '../test-utils/session';

const fdb = db as any;
const mockedDispatch = dispatchInterviewInvitation as jest.Mock;
const when = new Date(Date.now() + 3 * 86_400_000).toISOString();
const patch = (id: number, body: object) =>
  updateInterview(jsonRequest(`http://localhost/api/interviews/${id}`, body, { method: 'PATCH' }), { params: { id: String(id) } });

// Users: 1 owner employer, 2 other employer, 3 candidate, 4 other candidate, 5 owner's teammate
beforeEach(async () => {
  fdb.reset();
  mockedDispatch.mockClear();
  await fdb.tenant.create({ data: { name: 'Acme' } });
  await fdb.user.create({ data: { email: 'owner@acme.co.za', role: 'EMPLOYER', tenant_id: 1 } });
  await fdb.user.create({ data: { email: 'other@rival.co.za', role: 'EMPLOYER' } });
  await fdb.user.create({ data: { email: 'thabo@example.com', role: 'CANDIDATE', name: 'Thabo' } });
  await fdb.user.create({ data: { email: 'lerato@example.com', role: 'CANDIDATE' } });
  await fdb.user.create({ data: { email: 'teammate@acme.co.za', role: 'EMPLOYER', tenant_id: 1 } });
  await fdb.job.create({ data: { title: 'Junior Analyst', employer_id: 1, tenant_id: 1 } });
  await fdb.jobApplication.create({ data: { candidate_id: 3, job_id: 1 } });
  await fdb.interview.create({ data: { application_id: 1, employer_id: 1, candidate_id: 3, proposed_time: new Date(when) } });
});

describe('POST /api/interviews', () => {
  it('lets the job owner invite, taking the candidate from the application', async () => {
    signedInAs('EMPLOYER', 1);
    const res = await createInterview(jsonRequest('http://localhost/api/interviews', { application_id: 1, candidate_id: 4, proposed_time: when }));
    expect(res.status).toBe(200);
    expect((await res.json()).candidate_id).toBe(3);
    expect(fdb._tables.jobApplication[0].status).toBe('Interviewing');
  });

  it("refuses another company's employer and contacts nobody", async () => {
    signedInAs('EMPLOYER', 2);
    const res = await createInterview(jsonRequest('http://localhost/api/interviews', { application_id: 1, proposed_time: when }));
    expect(res.status).toBe(404);
    expect(fdb._tables.interview).toHaveLength(1);
    expect(fdb._tables.jobApplication[0].status).toBe('Pending');
    expect(mockedDispatch).not.toHaveBeenCalled();
  });

  it('refuses candidates and rejects an invalid time', async () => {
    signedInAs('CANDIDATE', 3);
    expect((await createInterview(jsonRequest('http://localhost/api/interviews', { application_id: 1, proposed_time: when }))).status).toBe(403);
    signedInAs('EMPLOYER', 1);
    expect((await createInterview(jsonRequest('http://localhost/api/interviews', { application_id: 1, proposed_time: 'soon' }))).status).toBe(400);
  });
});

describe('PATCH /api/interviews/[id]', () => {
  it('lets the invited candidate confirm, but not move the time', async () => {
    signedInAs('CANDIDATE', 3);
    expect((await patch(1, { status: 'Confirmed' })).status).toBe(200);
    expect(fdb._tables.interview[0].status).toBe('Confirmed');
    expect((await patch(1, { proposed_time: when })).status).toBe(403);
    expect((await patch(1, { status: 'Proposed' })).status).toBe(403);
  });

  it('hides the interview from other candidates and employers', async () => {
    signedInAs('CANDIDATE', 4);
    expect((await patch(1, { status: 'Cancelled' })).status).toBe(404);
    signedInAs('EMPLOYER', 2);
    expect((await patch(1, { status: 'Cancelled' })).status).toBe(404);
    expect(fdb._tables.interview[0].status).toBe('Proposed');
  });

  it('lets the hiring team reschedule', async () => {
    signedInAs('EMPLOYER', 5);
    const later = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect((await patch(1, { status: 'Rescheduled', proposed_time: later })).status).toBe(200);
    expect(fdb._tables.interview[0].proposed_time.toISOString()).toBe(later);
  });

  it('rejects unknown statuses', async () => {
    signedInAs('EMPLOYER', 1);
    expect((await patch(1, { status: 'Hired' })).status).toBe(400);
  });
});
