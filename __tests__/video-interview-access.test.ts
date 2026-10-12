/**
 * Video interview reads. Before this, any employer could fetch any interview by id (with the
 * candidate's email, CV link and transcript) or list every interview for any job id.
 */
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { GET as listInterviews } from '@/app/api/video-interview/list/route';

const fdb = db as any;
// Identity headers as set by middleware from the verified JWT
const get = async (query: string, userId: number, role: string) => {
  const res = await listInterviews(new NextRequest(`http://localhost/api/video-interview/list${query}`, { headers: { 'x-user-id': String(userId), 'x-user-role': role } }));
  return { status: res.status, body: await res.json() };
};

// Users: 1 owner employer, 2 other employer, 3 candidate, 4 other candidate
beforeEach(async () => {
  fdb.reset();
  await fdb.user.create({ data: { email: 'owner@acme.co.za', role: 'EMPLOYER' } });
  await fdb.user.create({ data: { email: 'other@rival.co.za', role: 'EMPLOYER' } });
  await fdb.user.create({ data: { email: 'thabo@example.com', role: 'CANDIDATE' } });
  await fdb.user.create({ data: { email: 'lerato@example.com', role: 'CANDIDATE' } });
  await fdb.job.create({ data: { title: 'Junior Analyst', employer_id: 1 } });
  await fdb.videoInterview.create({ data: { candidate_id: 3, job_id: 1, questions: '[]', transcript: 'answer' } }); // id 1, for job 1
  await fdb.videoInterview.create({ data: { candidate_id: 3, job_id: null, questions: '[]' } }); // id 2, practice
});

describe('GET /api/video-interview/list?id=', () => {
  it('shows the job owner interviews for their job, without leaking the owner field', async () => {
    const res = await get('?id=1', 1, 'EMPLOYER');
    expect(res.status).toBe(200);
    expect(res.body.interview.job).toEqual({ id: 1, title: 'Junior Analyst', company: 'Acme' });
  });

  it("hides other companies' and practice interviews from employers", async () => {
    expect((await get('?id=1', 2, 'EMPLOYER')).status).toBe(404);
    expect((await get('?id=2', 1, 'EMPLOYER')).status).toBe(404);
  });

  it('lets candidates see only their own', async () => {
    expect((await get('?id=2', 3, 'CANDIDATE')).status).toBe(200);
    expect((await get('?id=2', 4, 'CANDIDATE')).status).toBe(404);
  });
});

describe('GET /api/video-interview/list?jobId=', () => {
  it("returns nothing for another employer's job", async () => {
    expect((await get('?jobId=1', 2, 'EMPLOYER')).body.interviews).toEqual([]);
    expect((await get('?jobId=1', 1, 'EMPLOYER')).body.interviews).toHaveLength(1);
  });
});
