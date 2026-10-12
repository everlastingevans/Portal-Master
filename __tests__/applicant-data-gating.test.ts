/**
 * Applicant contact details are what employers pay for, so the API (not just the UI) withholds them
 * until the job is live. Candidates can only see and apply to live jobs.
 */
jest.mock('@/lib/notifications', () => ({ sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/gemini', () => ({ scoreMatch: jest.fn(async () => ({ matchScore: 70, missingSkills: [], matchedSkills: [], recommendation: 'Potential', fitSummary: 'ok' })) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { GET as employerDashboard } from '@/app/api/employer/dashboard/route';
import { POST as apply } from '@/app/api/candidate/apply/route';
import { jsonRequest, signedInAs } from '../test-utils/session';

const fdb = db as any;

// Users: 1 employer, 2 candidate. Jobs: 1 ACTIVE, 2 PENDING (unpaid), 3 CLOSED
beforeEach(async () => {
  fdb.reset();
  await fdb.user.create({ data: { email: 'boss@acme.co.za', role: 'EMPLOYER' } });
  await fdb.user.create({ data: { email: 'thabo@example.com', role: 'CANDIDATE', name: 'Thabo', phone: '0821234567', resume_text: 'CV', linkedin_url: 'https://linkedin.com/in/thabo', github_url: null } });
  await fdb.job.create({ data: { title: 'Live role', employer_id: 1, status: 'ACTIVE' } });
  await fdb.job.create({ data: { title: 'Unpaid role', employer_id: 1, status: 'PENDING' } });
  await fdb.job.create({ data: { title: 'Closed role', employer_id: 1, status: 'CLOSED' } });
  await fdb.jobApplication.create({ data: { candidate_id: 2, job_id: 1 } });
  await fdb.jobApplication.create({ data: { candidate_id: 2, job_id: 2 } });
});

describe('GET /api/employer/dashboard', () => {
  it('returns contact details only for applications to live jobs', async () => {
    signedInAs('EMPLOYER', 1);
    const body = await (await employerDashboard())!.json();
    const byJob = (id: number) => body.applications.find((a: any) => a.job_id === id).candidate;

    expect(byJob(1)).toMatchObject({ email: 'thabo@example.com', phone: '0821234567', resume_text: 'CV' });
    expect(byJob(2)).toMatchObject({ name: 'Thabo', email: null, phone: null, resume_text: null, linkedin_url: null, video_interviews: [] });
  });
});

describe('POST /api/candidate/apply', () => {
  it('accepts applications to live jobs only', async () => {
    signedInAs('CANDIDATE', 2);
    fdb._tables.jobApplication = [];
    expect((await apply(jsonRequest('http://localhost/api/candidate/apply', { jobId: 2 }), {})).status).toBe(404);
    expect((await apply(jsonRequest('http://localhost/api/candidate/apply', { jobId: 3 }), {})).status).toBe(404);
    expect((await apply(jsonRequest('http://localhost/api/candidate/apply', { jobId: 1 }), {})).status).toBe(200);
    expect(fdb._tables.jobApplication.map((a: any) => a.job_id)).toEqual([1]);
  });
});
