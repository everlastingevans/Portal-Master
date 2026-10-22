/**
 * CV import: batches, sources and the per-file import. Dependencies (database, AI reader, storage)
 * are passed in so the rules are tested without real services.
 *
 * Rules:
 * - A CV whose email matches an existing candidate never overwrites their profile; it only fills
 *   fields they left empty, and tags them with the batch's source if they have none.
 * - A CV whose email matches a staff or employer account is rejected.
 * - A CV without an email still creates a profile (with an undeliverable placeholder address) but is
 *   flagged for review, as is one missing a name or any headline/skills.
 * - Failing to store the PDF never loses the profile; the item says so instead.
 */
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/auth';
import {
  CvReadError,
  ImportedProfile,
  MAX_BULK_FILES,
  MAX_CV_BYTES,
  PROFILE_FIELDS,
  SOURCE_KINDS,
  cleanSourceName,
  placeholderEmail,
  profileFromExtraction,
  reviewReasons,
} from './profile';
import type { CvReading } from './extract';

type Db = any;

export interface ImportDeps {
  db: Db;
  readCv: (buffer: Buffer) => Promise<CvReading>;
  pdfText: (buffer: Buffer) => Promise<string>;
  storeCv: (candidateId: number, fileName: string, buffer: Buffer) => Promise<string>;
}

export interface BatchRow {
  id: number;
  source_id: number | null;
  talent_pool_visible: boolean;
}

export type ImportStatus = 'CREATED' | 'EXISTING' | 'NEEDS_REVIEW' | 'FAILED';

export interface ImportResult {
  itemId: number;
  status: ImportStatus;
  message: string | null;
  candidate: { id: number; name: string | null; email: string | null } | null;
}

/* ------------------------------------------------------------------------- */
/* Sources and batches                                                        */
/* ------------------------------------------------------------------------- */

/** Finds an organisation by name (case-insensitive) or creates it. */
export async function findOrCreateSource(db: Db, rawName: unknown, rawKind: unknown, actorId: number | null) {
  const name = cleanSourceName(rawName);
  if (!name) return { error: 'Enter the organisation’s name.' } as const;
  const kind = SOURCE_KINDS.some((k) => k.value === rawKind) ? String(rawKind) : 'OTHER';
  const existing = await db.candidateSource.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  if (existing) return { source: existing } as const;
  try {
    return { source: await db.candidateSource.create({ data: { name, kind, created_by_id: actorId } }) } as const;
  } catch (error: any) {
    // Created by someone else at the same moment
    if (error?.code === 'P2002') return { source: await db.candidateSource.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }) } as const;
    throw error;
  }
}

export interface BatchInput {
  mode?: unknown;
  sourceId?: unknown;
  newSource?: { name?: unknown; kind?: unknown } | null;
  label?: unknown;
  totalFiles?: unknown;
  talentPoolVisible?: unknown;
  consentConfirmed?: unknown;
}

export async function createBatch(db: Db, input: BatchInput, actorId: number | null, now = new Date()) {
  if (input.consentConfirmed !== true) {
    return { error: 'Confirm the candidates agreed to LaunchPath processing their CVs before importing.' } as const;
  }
  const mode = input.mode === 'SINGLE' ? 'SINGLE' : 'BULK';
  const total = mode === 'SINGLE' ? 1 : Math.floor(Number(input.totalFiles));
  if (!Number.isFinite(total) || total < 1 || total > MAX_BULK_FILES) {
    return { error: `Upload between 1 and ${MAX_BULK_FILES} CVs at a time.` } as const;
  }

  let sourceId: number | null = null;
  if (input.newSource && cleanSourceName(input.newSource.name)) {
    const created = await findOrCreateSource(db, input.newSource.name, input.newSource.kind, actorId);
    if ('error' in created) return { error: created.error } as const;
    sourceId = created.source.id;
  } else if (input.sourceId !== undefined && input.sourceId !== null && input.sourceId !== '') {
    const id = Number(input.sourceId);
    const source = Number.isInteger(id) ? await db.candidateSource.findUnique({ where: { id } }) : null;
    if (!source) return { error: 'That organisation no longer exists. Choose another.' } as const;
    sourceId = source.id;
  }

  const label = typeof input.label === 'string' ? input.label.replace(/\s+/g, ' ').trim().slice(0, 120) || null : null;
  const batch = await db.cvImportBatch.create({
    data: {
      mode,
      source_id: sourceId,
      label,
      total_files: total,
      talent_pool_visible: input.talentPoolVisible === true,
      consent_confirmed_at: now,
      created_by_id: actorId,
    },
  });
  return { batch } as const;
}

/** Progress and outcome counts for a batch. A batch with files outstanding for 15 minutes was interrupted. */
export function summariseBatch(batch: { total_files: number; updated_at: Date | string }, statusCounts: { status: string; count: number }[], now = new Date()) {
  const counts = { CREATED: 0, EXISTING: 0, NEEDS_REVIEW: 0, FAILED: 0 } as Record<ImportStatus, number>;
  for (const s of statusCounts) if (s.status in counts) counts[s.status as ImportStatus] += s.count;
  const processed = Object.values(counts).reduce((a, b) => a + b, 0);
  const idleMs = now.getTime() - new Date(batch.updated_at).getTime();
  const state = processed >= batch.total_files ? 'COMPLETED' : idleMs > 15 * 60 * 1000 ? 'INCOMPLETE' : 'IN_PROGRESS';
  return { processed, total: batch.total_files, counts, state } as const;
}

/* ------------------------------------------------------------------------- */
/* One file                                                                   */
/* ------------------------------------------------------------------------- */

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

async function record(db: Db, batch: BatchRow, file: { name: string; size: number }, status: ImportStatus, message: string | null, candidate: ImportResult['candidate']): Promise<ImportResult> {
  const item = await db.cvImportItem.create({
    data: { batch_id: batch.id, file_name: file.name.slice(0, 200), file_size: file.size, status, message: message?.slice(0, 500) ?? null, candidate_id: candidate?.id ?? null },
  });
  // Touch the batch so an active import isn't reported as interrupted
  await db.cvImportBatch.update({ where: { id: batch.id }, data: { updated_at: new Date() } });
  return { itemId: item.id, status, message, candidate };
}

async function tryStoreCv(deps: ImportDeps, candidateId: number, fileName: string, buffer: Buffer): Promise<{ url: string | null; note: string | null }> {
  try {
    return { url: await deps.storeCv(candidateId, fileName, buffer), note: null };
  } catch (error) {
    console.error('[CV import] storing CV failed:', (error as Error).message);
    return { url: null, note: 'The profile was saved but the PDF couldn’t be stored. Upload the CV again from their profile.' };
  }
}

/** Adds what the CV knows to an existing candidate without replacing anything they entered. */
async function enrichExisting(deps: ImportDeps, batch: BatchRow, existing: any, profile: ImportedProfile, text: string, file: { name: string; buffer: Buffer }) {
  const data: Record<string, unknown> = {};
  for (const f of PROFILE_FIELDS) if (f !== 'email' && isEmpty(existing[f]) && !isEmpty(profile[f])) data[f] = profile[f];
  if (isEmpty(existing.resume_text) && text) data.resume_text = text;
  if (existing.source_id == null && batch.source_id != null) data.source_id = batch.source_id;
  let note: string | null = null;
  if (isEmpty(existing.cv_url)) {
    const stored = await tryStoreCv(deps, existing.id, file.name, file.buffer);
    if (stored.url) data.cv_url = stored.url;
    note = stored.note;
  }
  if (Object.keys(data).length) await deps.db.user.update({ where: { id: existing.id }, data });
  const filled = Object.keys(data).filter((k) => !['source_id', 'cv_url', 'resume_text'].includes(k)).length;
  const message = [
    'Already on LaunchPath, so their profile wasn’t replaced.',
    filled ? `Filled ${filled} empty field${filled === 1 ? '' : 's'} from the CV.` : null,
    data.cv_url ? 'Added the CV to their profile.' : null,
    note,
  ]
    .filter(Boolean)
    .join(' ');
  return message;
}

export async function importCvFile(
  deps: ImportDeps,
  batch: BatchRow,
  file: { name: string; size: number; buffer: Buffer },
  options: { reviewed?: ImportedProfile } = {},
): Promise<ImportResult> {
  const { db } = deps;
  if (file.size > MAX_CV_BYTES) return record(db, batch, file, 'FAILED', `This file is over ${MAX_CV_BYTES / 1024 / 1024} MB.`, null);

  // 1. Profile: reviewed by staff (single upload) or read by AI (bulk)
  let profile: ImportedProfile;
  let text: string;
  try {
    if (options.reviewed) {
      profile = options.reviewed;
      text = await deps.pdfText(file.buffer);
    } else {
      const reading = await deps.readCv(file.buffer);
      profile = profileFromExtraction(reading.extraction);
      text = reading.text;
    }
  } catch (error) {
    if (error instanceof CvReadError) return record(db, batch, file, 'FAILED', error.message, null);
    console.error('[CV import] read failed:', (error as Error).message);
    return record(db, batch, file, 'FAILED', 'This CV couldn’t be processed. Try it again.', null);
  }

  // 2. Existing account with this email
  const existingFor = (email: string) => db.user.findUnique({ where: { email } });
  if (profile.email) {
    const existing = await existingFor(profile.email);
    if (existing && existing.role !== 'CANDIDATE') {
      return record(db, batch, file, 'FAILED', 'This email belongs to a staff or employer account, so no candidate profile was created.', null);
    }
    if (existing) {
      const message = await enrichExisting(deps, batch, existing, profile, text, file);
      return record(db, batch, file, 'EXISTING', message, { id: existing.id, name: existing.name, email: existing.email });
    }
  }

  // 3. New candidate. The random password is never shared: the candidate sets their own through
  //    "Forgot password" with the email on their CV.
  let user: any;
  try {
    user = await db.user.create({
      data: {
        ...profile,
        email: profile.email ?? placeholderEmail(`${batch.id}-${randomBytes(6).toString('hex')}`),
        password: hashPassword(randomBytes(32).toString('hex')),
        role: 'CANDIDATE',
        resume_text: text || null,
        created_via: 'CV_IMPORT',
        source_id: batch.source_id,
        import_batch_id: batch.id,
        talent_pool_visible: batch.talent_pool_visible,
      },
    });
  } catch (error: any) {
    // The same email arrived in another file of this batch at the same moment
    if (error?.code === 'P2002' && profile.email) {
      const existing = await existingFor(profile.email);
      if (existing?.role === 'CANDIDATE') {
        const message = await enrichExisting(deps, batch, existing, profile, text, file);
        return record(db, batch, file, 'EXISTING', message, { id: existing.id, name: existing.name, email: existing.email });
      }
    }
    console.error('[CV import] creating candidate failed:', error?.message);
    return record(db, batch, file, 'FAILED', 'The profile couldn’t be saved. Try this CV again.', null);
  }

  // 4. Keep the PDF with the profile
  const stored = await tryStoreCv(deps, user.id, file.name, file.buffer);
  if (stored.url) await db.user.update({ where: { id: user.id }, data: { cv_url: stored.url } });

  const reasons = reviewReasons(profile);
  const status: ImportStatus = reasons.length ? 'NEEDS_REVIEW' : 'CREATED';
  const message = [reasons.length ? `${reasons.join('. ')}.` : null, stored.note].filter(Boolean).join(' ') || null;
  return record(db, batch, file, status, message, { id: user.id, name: user.name, email: profile.email });
}
