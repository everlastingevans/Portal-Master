/**
 * CV import: AI output is validated before it reaches a profile, imports never overwrite or hijack
 * existing accounts, imported profiles stay out of the employer talent pool until the candidate
 * signs in (unless staff opt in), and every endpoint is SUPERADMIN-only.
 */
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});
jest.mock('@/lib/cv-import/extract', () => ({
  readCv: jest.fn(),
  pdfText: jest.fn(async () => 'Plain CV text'),
  CvReadError: jest.requireActual('@/lib/cv-import/profile').CvReadError,
}));
jest.mock('@/lib/cv-import/storage', () => ({
  storeCandidateCv: jest.fn(async (id: number) => `https://bucket.s3.af-south-1.amazonaws.com/media/resumes/${id}/cv.pdf`),
}));

import db from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { readCv } from '@/lib/cv-import/extract';
import { storeCandidateCv } from '@/lib/cv-import/storage';
import {
  CvReadError,
  MAX_CV_BYTES,
  isPlaceholderEmail,
  normaliseExperienceLevel,
  normaliseLocation,
  profileFromExtraction,
  sanitiseReviewedProfile,
} from '@/lib/cv-import/profile';
import { ImportDeps, createBatch, importCvFile, summariseBatch } from '@/lib/cv-import/service';
import { GET as listSources, POST as createSource } from '@/app/api/superadmin/cv-import/sources/route';
import { GET as listBatches, POST as startBatch } from '@/app/api/superadmin/cv-import/batches/route';
import { POST as uploadFile } from '@/app/api/superadmin/cv-import/batches/[id]/files/route';
import { POST as analyse } from '@/app/api/superadmin/cv-import/analyse/route';
import { GET as talentPool } from '@/app/api/employer/candidates/route';
import { POST as invite } from '@/app/api/employer/candidates/invite/route';
import { POST as login } from '@/app/api/auth/login/route';
import { jsonRequest, signedInAs } from '../test-utils/session';

const fdb = db as any;
const read = readCv as jest.Mock;
const store = storeCandidateCv as jest.Mock;

const GOOD = {
  fullName: 'Lerato Mokoena',
  email: ' Lerato.M@Example.com ',
  phone: '082 123 4567',
  headline: 'Junior Data Analyst',
  experienceLevel: 'Junior',
  location: 'Gauteng',
  skills: ['Excel', 'SQL', 'Power BI', 'excel'],
  qualifications: ['BCom Information Systems, University of Johannesburg (2025)'],
  studyInstitution: 'University of Johannesburg',
  workExperience: [{ role: 'Data Intern', company: 'Acme', period: 'Jan 2025 – Dec 2025', summary: 'Built weekly sales dashboards.' }],
  seekingRoles: ['Data Analyst', 'BI Analyst'],
  summary: 'Recent graduate with practical reporting experience.',
  linkedinUrl: 'linkedin.com/in/lerato',
};

const pdf = (name = 'lerato.pdf', size?: number) => ({ name, size: size ?? 1000, buffer: Buffer.from('%PDF-1.4 test') });

const deps = (): ImportDeps => ({
  db: fdb,
  readCv: read,
  pdfText: async () => 'Plain CV text',
  storeCv: store,
});

const newBatch = async (patch: Record<string, unknown> = {}) => {
  const r = await createBatch(fdb, { consentConfirmed: true, totalFiles: 5, ...patch }, 1);
  if ('error' in r) throw new Error(r.error);
  return r.batch;
};

const fileRequest = (url: string, name = 'cv.pdf', extra: Record<string, string> = {}) => {
  const form = new FormData();
  form.append('file', new File(['%PDF-1.4 test'], name, { type: 'application/pdf' }));
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return new Request(url, { method: 'POST', body: form });
};

beforeEach(() => {
  fdb.reset();
  jest.clearAllMocks();
  signedInAs(null);
  read.mockResolvedValue({ text: 'Lerato Mokoena CV text', extraction: GOOD });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('profile from AI output', () => {
  it('normalises contact details, location, links and lists', () => {
    const p = profileFromExtraction(GOOD);
    expect(p).toMatchObject({
      name: 'Lerato Mokoena',
      email: 'lerato.m@example.com',
      phone: '+27821234567',
      experience_level: 'Junior',
      location: 'Gauteng',
      skills: 'Excel, SQL, Power BI', // de-duplicated case-insensitively
      linkedin_url: 'https://linkedin.com/in/lerato',
    });
    expect(p.work_experience).toBe('Data Intern, Acme (Jan 2025 – Dec 2025)\nBuilt weekly sales dashboards.');
  });

  it('drops unsafe or junk values instead of storing them', () => {
    const p = profileFromExtraction({
      fullName: 'N/A',
      email: 'not-an-email',
      linkedinUrl: 'javascript:alert(1)',
      githubUrl: 'https://evil.example.com/user', // not a GitHub host
      portfolioUrl: 'ftp://files.example.com',
      location: 'Somewhere',
      experienceLevel: 'Wizard',
    });
    expect(p.name).toBeNull();
    expect(p.email).toBeNull();
    expect(p.linkedin_url).toBeNull();
    expect(p.github_url).toBeNull();
    expect(p.portfolio_url).toBeNull();
    expect(p.location).toBeNull();
    expect(p.experience_level).toBeNull();
  });

  it('works out the level from years when the AI gives none, and maps cities to provinces', () => {
    expect(normaliseExperienceLevel(undefined, 1)).toBe('Junior');
    expect(normaliseExperienceLevel('', 4)).toBe('Mid-Level');
    expect(normaliseExperienceLevel(null, 9)).toBe('Senior');
    expect(normaliseExperienceLevel('Team Lead')).toBe('Lead');
    expect(normaliseExperienceLevel('Senior Team Lead')).toBe('Lead');
    expect(normaliseExperienceLevel('Executive')).toBe('Executive');
    expect(normaliseExperienceLevel('Mid-Level')).toBe('Mid-Level');
    expect(normaliseExperienceLevel('Graduate')).toBe('Junior');
    expect(normaliseLocation('Durban North')).toBe('KwaZulu-Natal');
    expect(normaliseLocation('Cape Town')).toBe('Western Cape');
  });

  it('holds a staff-reviewed profile to the same rules', () => {
    const p = sanitiseReviewedProfile({ name: '  Thabo  ', email: 'THABO@example.com', experience_level: 'Overlord', location: 'Pretoria', extra: 'ignored' });
    expect(p).toMatchObject({ name: 'Thabo', email: 'thabo@example.com', experience_level: null, location: 'Gauteng' });
    expect(p).not.toHaveProperty('extra');
  });
});

describe('importing one CV', () => {
  it('creates a candidate tagged with the organisation and import, hidden from employers, with the CV stored', async () => {
    const batch = await newBatch({ newSource: { name: 'Umuzi', kind: 'BOOTCAMP' } });
    const r = await importCvFile(deps(), batch, pdf());

    expect(r.status).toBe('CREATED');
    const user = await fdb.user.findUnique({ where: { id: r.candidate!.id } });
    expect(user).toMatchObject({
      role: 'CANDIDATE',
      email: 'lerato.m@example.com',
      created_via: 'CV_IMPORT',
      source_id: batch.source_id,
      import_batch_id: batch.id,
      talent_pool_visible: false,
      resume_text: 'Lerato Mokoena CV text',
      cv_url: expect.stringContaining(`/media/resumes/${user.id}/`),
    });
    // The account has an unguessable password nobody knows; the candidate sets theirs via "Forgot password"
    expect(user.password).toMatch(/^[0-9a-f]+\.[0-9a-f]+$/);
    expect(await verifyPassword('', user.password)).toBe(false);
    expect(await fdb.cvImportItem.count({ where: { batch_id: batch.id } })).toBe(1);
  });

  it('still creates a profile without an email, with a placeholder address, flagged for review', async () => {
    read.mockResolvedValue({ text: 'cv', extraction: { ...GOOD, email: '' } });
    const batch = await newBatch();
    const r = await importCvFile(deps(), batch, pdf());

    expect(r.status).toBe('NEEDS_REVIEW');
    expect(r.message).toMatch(/No email address/);
    const user = await fdb.user.findUnique({ where: { id: r.candidate!.id } });
    expect(isPlaceholderEmail(user.email)).toBe(true);
  });

  it('never overwrites an existing candidate: it fills only empty fields and tags the organisation', async () => {
    const existing = await fdb.user.create({
      data: { email: 'lerato.m@example.com', password: 'x.y', name: 'Lerato M (her own spelling)', professional_title: 'Analyst', skills: null, cv_url: null },
    });
    const batch = await newBatch({ newSource: { name: 'Umuzi' } });
    const r = await importCvFile(deps(), batch, pdf());

    expect(r.status).toBe('EXISTING');
    expect(r.candidate!.id).toBe(existing.id);
    const user = await fdb.user.findUnique({ where: { id: existing.id } });
    expect(user.name).toBe('Lerato M (her own spelling)');
    expect(user.professional_title).toBe('Analyst');
    expect(user.skills).toBe('Excel, SQL, Power BI');
    expect(user.source_id).toBe(batch.source_id);
    expect(user.cv_url).toBeTruthy();
    expect(user.created_via).toBe('SELF_SIGNUP');
    expect(await fdb.user.count()).toBe(1);
  });

  it('refuses to attach a CV to a staff or employer account', async () => {
    await fdb.user.create({ data: { email: 'lerato.m@example.com', password: 'x.y', role: 'EMPLOYER' } });
    const r = await importCvFile(deps(), await newBatch(), pdf());

    expect(r.status).toBe('FAILED');
    expect(r.candidate).toBeNull();
    expect(await fdb.user.count({ where: { role: 'CANDIDATE' } })).toBe(0);
  });

  it('records unreadable and oversized files as failed without creating anyone', async () => {
    read.mockRejectedValueOnce(new CvReadError('No readable text was found in this PDF.'));
    const batch = await newBatch();
    const unreadable = await importCvFile(deps(), batch, pdf());
    const huge = await importCvFile(deps(), batch, pdf('big.pdf', MAX_CV_BYTES + 1));

    expect(unreadable).toMatchObject({ status: 'FAILED', message: 'No readable text was found in this PDF.' });
    expect(huge.status).toBe('FAILED');
    expect(await fdb.user.count()).toBe(0);
  });

  it('keeps the profile if the PDF can’t be stored, and says so', async () => {
    store.mockRejectedValueOnce(new Error('S3 down'));
    const r = await importCvFile(deps(), await newBatch(), pdf());

    expect(r.status).toBe('CREATED');
    expect(r.message).toMatch(/PDF couldn’t be stored/);
    expect((await fdb.user.findUnique({ where: { id: r.candidate!.id } })).cv_url).toBeUndefined();
  });

  it('uses a staff-reviewed profile as-is, without calling the AI', async () => {
    const reviewed = sanitiseReviewedProfile({ name: 'Thabo Nkosi', email: 'thabo@example.com', professional_title: 'Sales Consultant' });
    const r = await importCvFile(deps(), await newBatch({ mode: 'SINGLE' }), pdf(), { reviewed });

    expect(read).not.toHaveBeenCalled();
    expect(r.status).toBe('CREATED');
    expect(await fdb.user.findUnique({ where: { email: 'thabo@example.com' } })).toMatchObject({ name: 'Thabo Nkosi', resume_text: 'Plain CV text' });
  });
});

describe('batches and organisations', () => {
  it('requires consent and a sensible file count', async () => {
    expect(await createBatch(fdb, { totalFiles: 3 }, 1)).toEqual({ error: expect.stringMatching(/Confirm the candidates agreed/) });
    expect(await createBatch(fdb, { consentConfirmed: true, totalFiles: 0 }, 1)).toHaveProperty('error');
    expect(await createBatch(fdb, { consentConfirmed: true, totalFiles: 201 }, 1)).toHaveProperty('error');
    expect(await createBatch(fdb, { consentConfirmed: true, totalFiles: 3, sourceId: 999 }, 1)).toHaveProperty('error');
  });

  it('reuses an organisation whatever the capitalisation, instead of duplicating it', async () => {
    const a = await newBatch({ newSource: { name: 'Code Girls  Academy', kind: 'BOOTCAMP' } });
    const b = await newBatch({ newSource: { name: 'code girls academy' } });
    expect(a.source_id).toBe(b.source_id);
    expect(await fdb.candidateSource.count()).toBe(1);
    expect((await fdb.candidateSource.findFirst()).name).toBe('Code Girls Academy');
  });

  it('reports progress, completion and interrupted imports', () => {
    const now = new Date('2026-10-14T10:00:00Z');
    const counts = [
      { status: 'CREATED', count: 2 },
      { status: 'FAILED', count: 1 },
    ];
    expect(summariseBatch({ total_files: 3, updated_at: now }, counts, now)).toMatchObject({ processed: 3, state: 'COMPLETED' });
    expect(summariseBatch({ total_files: 5, updated_at: now }, counts, now).state).toBe('IN_PROGRESS');
    expect(summariseBatch({ total_files: 5, updated_at: new Date('2026-10-14T09:00:00Z') }, counts, now).state).toBe('INCOMPLETE');
  });
});

describe('API access', () => {
  it('is SUPERADMIN only', async () => {
    for (const role of [null, 'CANDIDATE', 'EMPLOYER']) {
      signedInAs(role);
      expect((await listSources()).status).toBeGreaterThanOrEqual(401);
      expect((await createSource(jsonRequest('http://localhost/api/superadmin/cv-import/sources', { name: 'X' }))).status).toBeGreaterThanOrEqual(401);
      expect((await listBatches()).status).toBeGreaterThanOrEqual(401);
      expect((await startBatch(jsonRequest('http://localhost/api/superadmin/cv-import/batches', { consentConfirmed: true, totalFiles: 1 }))).status).toBeGreaterThanOrEqual(401);
      expect((await analyse(fileRequest('http://localhost/api/superadmin/cv-import/analyse'))).status).toBeGreaterThanOrEqual(401);
      expect((await uploadFile(fileRequest('http://localhost/x'), { params: { id: '1' } })).status).toBeGreaterThanOrEqual(401);
    }
    expect(read).not.toHaveBeenCalled();
  });

  it('runs a bulk import end to end and won’t accept more files than the import was started with', async () => {
    signedInAs('SUPERADMIN', 1);
    const started = await (await startBatch(jsonRequest('http://localhost/api/superadmin/cv-import/batches', { consentConfirmed: true, totalFiles: 2, newSource: { name: 'Richfield', kind: 'COLLEGE' } }))).json();
    const id = String(started.batch.id);

    read.mockResolvedValueOnce({ text: 'a', extraction: { ...GOOD, email: 'a@example.com' } }).mockResolvedValueOnce({ text: 'b', extraction: { ...GOOD, email: 'b@example.com' } });
    expect((await (await uploadFile(fileRequest('http://localhost/x', 'a.pdf'), { params: { id } })).json()).result.status).toBe('CREATED');
    expect((await (await uploadFile(fileRequest('http://localhost/x', 'b.pdf'), { params: { id } })).json()).result.status).toBe('CREATED');
    expect((await uploadFile(fileRequest('http://localhost/x', 'c.pdf'), { params: { id } })).status).toBe(409);

    const list = await (await listBatches()).json();
    expect(list.batches[0]).toMatchObject({ processed: 2, total: 2, state: 'COMPLETED', source: { name: 'Richfield' }, counts: { CREATED: 2 } });
    const sources = await (await listSources()).json();
    expect(sources.sources).toEqual([{ id: expect.any(Number), name: 'Richfield', kind: 'COLLEGE', candidates: 2 }]);
  });

  it('accepts a reviewed profile on upload and validates it', async () => {
    signedInAs('SUPERADMIN', 1);
    const started = await (await startBatch(jsonRequest('http://localhost/x', { mode: 'SINGLE', consentConfirmed: true }))).json();
    const reviewed = { name: 'Ayanda K', email: 'ayanda@example.com', professional_title: 'Bookkeeper', linkedin_url: 'javascript:alert(1)' };
    const res = await uploadFile(fileRequest('http://localhost/x', 'cv.pdf', { profile: JSON.stringify(reviewed) }), {
      params: { id: String(started.batch.id) },
    });
    expect((await res.json()).result.status).toBe('CREATED');
    expect(read).not.toHaveBeenCalled();
    expect(await fdb.user.findUnique({ where: { email: 'ayanda@example.com' } })).toMatchObject({ name: 'Ayanda K', linkedin_url: null });
  });

  it('analyses without saving and warns about an existing account', async () => {
    signedInAs('SUPERADMIN', 1);
    await fdb.user.create({ data: { email: 'lerato.m@example.com', password: 'x.y', name: 'Lerato' } });
    const data = await (await analyse(fileRequest('http://localhost/api/superadmin/cv-import/analyse'))).json();
    expect(data.profile.name).toBe('Lerato Mokoena');
    expect(data.existing).toMatchObject({ name: 'Lerato', isCandidate: true });
    expect(await fdb.user.count()).toBe(1);
  });
});

describe('employer visibility', () => {
  const employerId = 50;
  const seed = async () => {
    await fdb.user.create({ data: { id: employerId, email: 'boss@acme.co.za', password: 'x.y', role: 'EMPLOYER', name: 'Boss' } });
    await fdb.job.create({ data: { title: 'Analyst', employer_id: employerId, status: 'ACTIVE' } });
    const self = await fdb.user.create({ data: { email: 'self@example.com', password: 'x.y', name: 'Self Signup', skills: 'Excel' } });
    const hidden = await fdb.user.create({ data: { email: 'hidden@example.com', password: 'x.y', name: 'Hidden Import', skills: 'Excel', created_via: 'CV_IMPORT', talent_pool_visible: false } });
    const shown = await fdb.user.create({ data: { email: 'shown@example.com', password: 'x.y', name: 'Shown Import', skills: 'Excel', created_via: 'CV_IMPORT', talent_pool_visible: true } });
    return { self, hidden, shown };
  };

  it('keeps unclaimed imported profiles out of the talent pool unless the import made them visible', async () => {
    await seed();
    signedInAs('EMPLOYER', employerId);
    const { NextRequest } = require('next/server');
    const pool = await (await talentPool(new NextRequest('http://localhost/api/employer/candidates'))).json();
    expect(pool.candidates.map((c: any) => c.name).sort()).toEqual(['Self Signup', 'Shown Import']);
  });

  it('won’t let an employer invite a hidden profile by guessing its id', async () => {
    const { hidden } = await seed();
    signedInAs('EMPLOYER', employerId);
    const res = await invite(jsonRequest('http://localhost/api/employer/candidates/invite', { candidateId: hidden.id, jobId: 1 }));
    expect(res.status).toBe(404);
  });

  it('makes an imported profile the candidate’s own on first sign-in', async () => {
    const user = await fdb.user.create({ data: { email: 'claim@example.com', password: hashPassword('their-new-password'), created_via: 'CV_IMPORT', talent_pool_visible: false } });
    const res = await login(jsonRequest('http://localhost/api/auth/login', { email: 'claim@example.com', password: 'their-new-password' }));
    expect(res.status).toBe(200);
    const after = await fdb.user.findUnique({ where: { id: user.id } });
    expect(after.claimed_at).toBeInstanceOf(Date);
    expect(after.talent_pool_visible).toBe(true);
  });
});
