/**
 * Operations workflow for LaunchPath Hire: shortlists, candidate cards, interview requests, offers,
 * placements and follow-ups. Every child record is looked up scoped to its vacancy, so an action on
 * vacancy A can never touch records of vacancy B. All fees and dates that matter are derived here.
 */
import { guaranteeEndDate, HireTerms } from './terms';
import { checkPartnerLink, computeFee, hasEntitlement, resolvePlacementTerms } from './partner';
import { isFeatureEnabled } from '@/lib/features';
import {
  DEPARTED_OUTCOMES,
  EMAIL_RE,
  FOLLOW_UP_DAYS,
  INTERVIEW_OUTCOMES,
  INTERVIEW_REQUEST_STATUSES,
  INVOICE_STATUSES,
  MATCH_LEVELS,
  OFFER_STATUSES,
  RETENTION_OUTCOMES,
  VACANCY_STATUSES,
  VacancyStatus,
  advanceStatus,
} from './vacancy';
import { recordHireEvent } from './events';
import { DEFAULT_LINK_DAYS, MAX_LINK_DAYS, generateShortlistToken, shortlistUrl } from './shortlist-access';
import { renderEmployerShortlistReady } from './emails';
import { EmailOutcome, retryEmailLog, sendInterviewRequestEmail, sendOnceSafely } from './email-ledger';

type Errors = Record<string, string>;
export type ActionResult = { status: number; body: any };

const fail = (status: number, error: string, errors?: Errors): ActionResult => ({ status, body: { error, ...(errors ? { errors } : {}) } });
const ok = (body: any = {}): ActionResult => ({ status: 200, body: { success: true, ...body } });
const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const inList = (list: readonly { value: string }[], v: unknown) => list.some((o) => o.value === v);

const str = (v: unknown, max: number) => {
  const s = String(v ?? '').trim().slice(0, max);
  return s || null;
};

function intOrNull(v: unknown): number | null | undefined {
  if (v === null || v === '' || v === undefined) return null;
  const n = Number(String(v).replace(/[\sR,]/gi, ''));
  return Number.isInteger(n) ? n : undefined; // undefined = invalid
}

export function parseDateOnly(v: unknown): Date | null | undefined {
  if (v === null || v === '' || v === undefined) return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/* ------------------------------------------------------------------------- */
/*  Candidate card                                                           */
/* ------------------------------------------------------------------------- */

const ASSESSMENT_FIELDS = [
  'match_level',
  'communication_rating',
  'communication_note',
  'role_assessment_name',
  'role_assessment_score',
  'role_assessment_max',
  'role_assessment_note',
  'interview_readiness',
];

/** Validates candidate-card fields. With `partial`, only provided keys are validated and returned. */
export function parseCardInput(raw: Record<string, unknown>, partial: boolean) {
  const errors: Errors = {};
  const data: Record<string, unknown> = {};
  const want = (k: string) => !partial || has(raw, k);

  if (want('display_name')) {
    const name = str(raw.display_name, 120);
    if (!name || name.length < 2) errors.display_name = 'Enter the candidate’s name.';
    else data.display_name = name;
  }
  for (const [k, max] of [
    ['target_role', 120],
    ['location', 120],
    ['experience', 200],
    ['availability', 80],
    ['recruiter_note', 600],
    ['communication_note', 300],
    ['role_assessment_name', 80],
    ['role_assessment_note', 300],
    ['employer_feedback', 2000],
  ] as const) {
    if (want(k)) data[k] = str(raw[k], max);
  }

  if (want('salary_expectation')) {
    const n = intOrNull(raw.salary_expectation);
    if (n === undefined || (n !== null && (n < 1000 || n > 500_000))) errors.salary_expectation = 'Monthly salary must be between R1,000 and R500,000.';
    else data.salary_expectation = n;
  }
  if (want('key_skills')) {
    const list = Array.isArray(raw.key_skills) ? raw.key_skills : String(raw.key_skills ?? '').split(/[,\n;]/);
    const skills = Array.from(new Set(list.map((s) => String(s).trim().slice(0, 50)).filter(Boolean)));
    if (skills.length > 15) errors.key_skills = 'List no more than 15 skills.';
    else data.key_skills = skills;
  }
  if (want('cv_external_url')) {
    const url = str(raw.cv_external_url, 500);
    if (url && !/^https:\/\/[^\s]+$/i.test(url)) errors.cv_external_url = 'Use a full https:// link.';
    else data.cv_external_url = url;
  }
  if (want('cv_s3_key')) {
    const key = str(raw.cv_s3_key, 300);
    if (key && !/^media\/(resumes|documents)\/\d+\/[\w.\-]+$/.test(key)) errors.cv_s3_key = 'Invalid CV file reference.';
    else data.cv_s3_key = key;
  }
  if (want('match_level')) {
    const v = raw.match_level || null;
    if (v !== null && !inList(MATCH_LEVELS, v)) errors.match_level = 'Unknown match level.';
    else data.match_level = v;
  }
  for (const k of ['communication_rating', 'interview_readiness'] as const) {
    if (!want(k)) continue;
    const n = intOrNull(raw[k]);
    if (n === undefined || (n !== null && (n < 1 || n > 5))) errors[k] = 'Use a rating from 1 to 5.';
    else data[k] = n;
  }
  for (const k of ['role_assessment_score', 'role_assessment_max'] as const) {
    if (!want(k)) continue;
    const n = intOrNull(raw[k]);
    if (n === undefined || (n !== null && (n < 0 || n > 1000))) errors[k] = 'Use a whole number.';
    else data[k] = n;
  }
  if (want('interview_outcome')) {
    const v = raw.interview_outcome || null;
    if (v !== null && !inList(INTERVIEW_OUTCOMES, v)) errors.interview_outcome = 'Unknown interview outcome.';
    else data.interview_outcome = v;
  }
  if (want('offer_status')) {
    const v = raw.offer_status || null;
    if (v !== null && !inList(OFFER_STATUSES, v)) errors.offer_status = 'Unknown offer status.';
    else data.offer_status = v;
  }

  return { errors, data, touchesAssessment: ASSESSMENT_FIELDS.some((k) => has(data, k)) };
}

/** True if any recruiter assessment value is actually recorded (not just present as an empty field). */
export const hasAssessment = (row: Record<string, unknown>) =>
  ['match_level', 'communication_rating', 'interview_readiness', 'role_assessment_score'].some((k) => row[k] !== null && row[k] !== undefined && row[k] !== '');

/**
 * Who/when for the assessment: stamped only when an assessment value was entered or changed, and
 * cleared if every assessment has been removed, so an unassessed card never shows an assessment date.
 */
function assessmentStamp(merged: Record<string, unknown>, touched: boolean, actorId: number | null, now: Date) {
  if (!hasAssessment(merged)) return { assessed_by_id: null, assessed_at: null };
  return touched ? { assessed_by_id: actorId, assessed_at: now } : {};
}

/** A role-specific result needs a name, a score and a maximum together (or none of them). */
function checkRoleAssessment(merged: Record<string, any>): string | null {
  const parts = [merged.role_assessment_name, merged.role_assessment_score, merged.role_assessment_max];
  const filled = parts.filter((p) => p !== null && p !== undefined && p !== '').length;
  if (filled === 0) return null;
  if (filled < 3) return 'A role-specific assessment needs a name, a score and a maximum score.';
  if (merged.role_assessment_max < 1 || merged.role_assessment_score > merged.role_assessment_max) return 'The score can’t be higher than the maximum.';
  return null;
}

/** Maps a candidate's stored cv_url to a private S3 key (our bucket) or an external https link. */
export function cvSourceFromUrl(url?: string | null): { cv_s3_key: string | null; cv_external_url: string | null } {
  if (!url) return { cv_s3_key: null, cv_external_url: null };
  try {
    const u = new URL(url);
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    if (bucket && u.hostname.startsWith(`${bucket}.s3.`) && u.hostname.endsWith('.amazonaws.com')) {
      return { cv_s3_key: decodeURIComponent(u.pathname.replace(/^\//, '')), cv_external_url: null };
    }
    return u.protocol === 'https:' ? { cv_s3_key: null, cv_external_url: url } : { cv_s3_key: null, cv_external_url: null };
  } catch {
    return { cv_s3_key: null, cv_external_url: null };
  }
}

/* ------------------------------------------------------------------------- */
/*  Placement                                                                */
/* ------------------------------------------------------------------------- */

export type PlacementState = {
  start_date: Date;
  annual_ctc: number;
  fee_basis?: string | null;
  fee_rate_bps: number | null;
  fee_min: number | null;
  fee_max: number | null;
  fee_flat?: number | null;
  guarantee_days: number;
  placement_fee: number;
  invoice_status: string;
  invoiced_at: Date | null;
  paid_at: Date | null;
  check_30_outcome: string | null;
  check_60_outcome: string | null;
  check_90_outcome: string | null;
};

/** Builds the update for an existing placement. Fee always uses the placement's own snapshotted terms. */
export function buildPlacementUpdate(existing: PlacementState, raw: Record<string, unknown>, now = new Date()) {
  const errors: Errors = {};
  const data: Record<string, any> = {};
  const events: ('FEE_INVOICED' | 'FEE_PAID')[] = [];

  if (has(raw, 'annual_ctc')) {
    const n = intOrNull(raw.annual_ctc);
    if (n === undefined || n === null || n < 12_000 || n > 10_000_000) errors.annual_ctc = 'Annual CTC must be a whole rand amount between R12,000 and R10,000,000.';
    else data.annual_ctc = n;
  }
  if (has(raw, 'start_date')) {
    const d = parseDateOnly(raw.start_date);
    if (!d) errors.start_date = 'Enter the start date.';
    else data.start_date = d;
  }
  if (has(raw, 'employer_feedback')) data.employer_feedback = str(raw.employer_feedback, 2000);

  if (has(raw, 'invoice_status')) {
    const s = String(raw.invoice_status);
    if (!inList(INVOICE_STATUSES, s)) errors.invoice_status = 'Unknown invoice status.';
    else if (s !== existing.invoice_status) {
      data.invoice_status = s;
      if (s === 'INVOICED' || s === 'PAID') {
        if (!existing.invoiced_at) data.invoiced_at = now;
        events.push('FEE_INVOICED');
      }
      if (s === 'PAID') {
        data.paid_at = existing.paid_at ?? now;
        events.push('FEE_PAID');
      }
      if (s === 'NOT_INVOICED') {
        data.invoiced_at = null;
        data.paid_at = null;
      }
    }
  }

  const start = (data.start_date ?? existing.start_date) as Date;
  for (const days of FOLLOW_UP_DAYS) {
    const k = `check_${days}_outcome`;
    if (has(raw, `check_${days}_note`)) data[`check_${days}_note`] = str(raw[`check_${days}_note`], 1000);
    if (!has(raw, k)) continue;
    const v = raw[k] || null;
    if (v !== null && !inList(RETENTION_OUTCOMES, v)) {
      errors[k] = 'Unknown outcome.';
      continue;
    }
    // "Still employed at day N" can only be confirmed once day N has arrived; departures can be recorded any time
    const due = new Date(start.getTime() + days * 86_400_000);
    if (v === 'RETAINED' && startOfDayUTC(now) < startOfDayUTC(due)) {
      errors[k] = `The ${days}-day check is due on ${due.toISOString().slice(0, 10)}.`;
      continue;
    }
    data[k] = v;
    data[`check_${days}_at`] = v ? now : null;
  }

  if (Object.keys(errors).length) return { ok: false as const, errors };

  const ctc = (data.annual_ctc ?? existing.annual_ctc) as number;
  // The placement's own snapshotted terms; a flat programme fee doesn't change with CTC
  const fee = computeFee(ctc, {
    fee_basis: existing.fee_basis === 'FLAT' ? 'FLAT' : 'PERCENT',
    fee_rate_bps: existing.fee_rate_bps,
    fee_min: existing.fee_min,
    fee_max: existing.fee_max,
    fee_flat: existing.fee_flat ?? null,
  });
  if (fee !== existing.placement_fee) data.placement_fee = fee;
  if (data.start_date) data.guarantee_end_date = guaranteeEndDate(start, existing.guarantee_days);

  return { ok: true as const, data, events };
}

/** Furthest follow-up recorded (for pipeline status), e.g. 60 if the 60-day check has an outcome. */
function furthestCheck(p: Record<string, any>) {
  return [...FOLLOW_UP_DAYS].reverse().find((d) => p[`check_${d}_outcome`]) ?? null;
}

/* ------------------------------------------------------------------------- */
/*  Interview requests (shared by the shortlist link and staff)              */
/* ------------------------------------------------------------------------- */

const OPEN_REQUEST = ['NEW', 'SCHEDULED'];

/**
 * Creates an interview request unless one is already open for this shortlisted candidate.
 * Caller must have verified that the shortlist candidate belongs to `vacancyId`.
 */
export async function createInterviewRequest(
  db: any,
  input: {
    vacancyId: number;
    shortlistId: number;
    shortlistCandidateId: number;
    source: 'EMPLOYER_LINK' | 'STAFF' | 'EMPLOYER_DASHBOARD';
    requestedByUserId?: number | null;
    requesterName?: string | null;
    message?: string | null;
    preferredTimes?: string | null;
    actorId?: number | null;
  },
) {
  const existing = await db.interviewRequest.findFirst({
    where: { shortlist_candidate_id: input.shortlistCandidateId, status: { in: OPEN_REQUEST } },
    select: { id: true },
  });
  if (existing) return { request: existing, created: false };

  const request = await db.$transaction(async (tx: any) => {
    const r = await tx.interviewRequest.create({
      data: {
        vacancy_id: input.vacancyId,
        shortlist_candidate_id: input.shortlistCandidateId,
        source: input.source,
        requester_name: str(input.requesterName, 120),
        message: str(input.message, 1000),
        preferred_times: str(input.preferredTimes, 200),
        created_by_id: input.actorId ?? null,
        requested_by_user_id: input.requestedByUserId ?? null,
      },
    });
    await recordHireEvent(tx, 'INTERVIEW_REQUESTED', { vacancyId: input.vacancyId, shortlistId: input.shortlistId, shortlistCandidateId: input.shortlistCandidateId, actorId: input.actorId }, r.id);
    await advanceVacancy(tx, input.vacancyId, 'INTERVIEWING', input.actorId ?? null);
    return r;
  });

  if (input.source !== 'STAFF') await sendInterviewRequestEmail(db, request.id);
  return { request, created: true };
}

/** Moves the vacancy forward in the pipeline (never backwards, never out of a closed status). */
async function advanceVacancy(tx: any, vacancyId: number, target: VacancyStatus, actorId: number | null) {
  const v = await tx.vacancy.findUnique({ where: { id: vacancyId }, select: { status: true } });
  const next = v && advanceStatus(v.status, target);
  if (!next) return;
  await tx.vacancy.update({ where: { id: vacancyId }, data: { status: next, status_changed_at: new Date() } });
  await tx.vacancyStatusEvent.create({ data: { vacancy_id: vacancyId, from_status: v.status, to_status: next, actor_id: actorId } });
  if (next === 'ROLE_CALIBRATION') await recordHireEvent(tx, 'ROLE_CALIBRATION', { vacancyId, actorId }, vacancyId);
}

/* ------------------------------------------------------------------------- */
/*  Action dispatcher                                                        */
/* ------------------------------------------------------------------------- */

export async function runVacancyAction(
  db: any,
  vacancyId: number,
  action: string,
  payload: Record<string, unknown>,
  ctx: { actorId: number | null; terms: HireTerms; now?: Date },
): Promise<ActionResult> {
  const now = ctx.now ?? new Date();
  const actorId = ctx.actorId;
  const vacancy = await db.vacancy.findUnique({ where: { id: vacancyId } });
  if (!vacancy) return fail(404, 'Vacancy not found.');

  // Scoped lookups: a child record is only found if it belongs to this vacancy
  const findShortlist = (id: unknown) => db.shortlist.findFirst({ where: { id: Number(id) || -1, vacancy_id: vacancyId } });
  const findEntry = (id: unknown) =>
    db.shortlistCandidate.findFirst({ where: { id: Number(id) || -1, shortlist: { vacancy_id: vacancyId } }, include: { placement: { select: { id: true } } } });

  switch (action) {
    case 'UPDATE_VACANCY': {
      const data: Record<string, any> = {};
      if (has(payload, 'status')) {
        const s = String(payload.status);
        if (!inList(VACANCY_STATUSES, s)) return fail(400, 'Unknown status.');
        if (s !== vacancy.status) Object.assign(data, { status: s, status_changed_at: now });
      }
      if (has(payload, 'owner_id')) {
        const o = payload.owner_id;
        if (o === null || o === '') data.owner_id = null;
        else {
          const owner = await db.user.findFirst({ where: { id: Number(o) || -1, role: 'SUPERADMIN' }, select: { id: true } });
          if (!owner) return fail(400, 'Owner must be a LaunchPath admin.');
          data.owner_id = owner.id;
        }
      }
      if (has(payload, 'internal_notes')) data.internal_notes = str(payload.internal_notes, 5000);
      if (has(payload, 'salary_benchmark_note')) {
        // Hiring Partner entitlement, checked against the vacancy's active subscription
        const sub = vacancy.partner_subscription_id ? await db.partnerSubscription.findUnique({ where: { id: vacancy.partner_subscription_id } }) : null;
        if (vacancy.commercial_model !== 'PARTNER' || !hasEntitlement(sub, 'SALARY_BENCHMARKING')) {
          return fail(403, 'Salary benchmarking is only available on an active Hiring Partner subscription that includes it.');
        }
        data.salary_benchmark_note = str(payload.salary_benchmark_note, 3000);
      }
      await db.$transaction(async (tx: any) => {
        await tx.vacancy.update({ where: { id: vacancyId }, data });
        if (data.status) {
          await tx.vacancyStatusEvent.create({ data: { vacancy_id: vacancyId, from_status: vacancy.status, to_status: data.status, actor_id: actorId } });
          if (data.status === 'ROLE_CALIBRATION') await recordHireEvent(tx, 'ROLE_CALIBRATION', { vacancyId, actorId }, vacancyId, now);
        }
      });
      return ok();
    }

    case 'LINK_COMPANY': {
      // Explicit staff decision: which verified company this vacancy belongs to (never inferred from email)
      const companyId = payload.companyId === null || payload.companyId === '' ? null : Number(payload.companyId);
      if (companyId !== null) {
        const company = await db.company.findUnique({ where: { id: companyId || -1 } });
        if (!company) return fail(404, 'Company not found.');
      }
      if (vacancy.commercial_model !== 'STANDARD' && companyId !== vacancy.company_id) {
        return fail(400, 'Set the vacancy back to standard terms before changing its company.');
      }
      await db.vacancy.update({ where: { id: vacancyId }, data: { company_id: companyId } });
      return ok();
    }

    case 'SET_COMMERCIAL_MODEL': {
      const model = String(payload.model);
      const existingPlacements = await db.placement.count({ where: { vacancy_id: vacancyId } });
      if (existingPlacements > 0) return fail(400, 'This vacancy already has placements priced on its current terms; its commercial model can’t change.');

      if (model === 'STANDARD') {
        await db.vacancy.update({ where: { id: vacancyId }, data: { commercial_model: 'STANDARD', partner_subscription_id: null, programme_id: null } });
        return ok();
      }
      if (model === 'PARTNER') {
        const check = await checkPartnerLink(db, vacancy, Number(payload.subscriptionId) || -1);
        if (!check.ok) return fail(400, check.error);
        const sub = check.subscription;
        const data: Record<string, unknown> = { commercial_model: 'PARTNER', partner_subscription_id: sub.id, programme_id: null };
        // Dedicated talent partner entitlement: they own the vacancy unless staff already assigned someone
        if (hasEntitlement(sub, 'DEDICATED_TALENT_PARTNER') && sub.talent_partner_id && !vacancy.owner_id) data.owner_id = sub.talent_partner_id;
        await db.vacancy.update({ where: { id: vacancyId }, data });
        return ok();
      }
      if (model === 'PROGRAMME') {
        if (!isFeatureEnabled('BULK_PROGRAMMES')) return fail(400, 'Bulk programmes are not enabled.');
        const programme = await db.bulkProgramme.findUnique({ where: { id: Number(payload.programmeId) || -1 } });
        if (!programme) return fail(404, 'Programme not found.');
        if (['COMPLETED', 'CANCELLED'].includes(programme.status)) return fail(400, 'That programme is closed.');
        if (programme.company_id && vacancy.company_id && programme.company_id !== vacancy.company_id) return fail(400, 'The programme belongs to a different company.');
        await db.vacancy.update({ where: { id: vacancyId }, data: { commercial_model: 'PROGRAMME', programme_id: programme.id, partner_subscription_id: null } });
        return ok();
      }
      return fail(400, 'Unknown commercial model.');
    }

    case 'CREATE_SHORTLIST': {
      const count = await db.shortlist.count({ where: { vacancy_id: vacancyId } });
      const shortlist = await db.shortlist.create({ data: { vacancy_id: vacancyId, title: str(payload.title, 80) || `Shortlist ${count + 1}`, created_by_id: actorId } });
      return ok({ shortlist });
    }

    case 'DELETE_SHORTLIST': {
      const s = await findShortlist(payload.shortlistId);
      if (!s) return fail(404, 'Shortlist not found.');
      if (s.status !== 'DRAFT') return fail(400, 'A shortlist that has been sent can’t be deleted. Revoke its links instead.');
      await db.shortlist.delete({ where: { id: s.id } });
      return ok();
    }

    case 'ADD_CANDIDATE': {
      const s = await findShortlist(payload.shortlistId);
      if (!s) return fail(404, 'Shortlist not found.');
      const input: Record<string, unknown> = { ...payload };

      // Prefill from a platform candidate's profile where staff left a field blank (never assessments)
      let candidateId: number | null = null;
      if (payload.candidateId) {
        const u = await db.user.findFirst({
          where: { id: Number(payload.candidateId) || -1, role: 'CANDIDATE' },
          select: { id: true, name: true, professional_title: true, seeking_roles: true, location: true, experience_level: true, availability: true, skills: true, cv_url: true },
        });
        if (!u) return fail(400, 'Candidate not found.');
        candidateId = u.id;
        const fill = (k: string, v: unknown) => {
          if (input[k] === undefined || input[k] === '' || input[k] === null) input[k] = v;
        };
        fill('display_name', u.name);
        fill('target_role', u.professional_title || u.seeking_roles);
        fill('location', u.location);
        fill('experience', u.experience_level);
        fill('key_skills', u.skills || '');
        const cv = cvSourceFromUrl(u.cv_url);
        fill('cv_s3_key', cv.cv_s3_key);
        fill('cv_external_url', cv.cv_external_url);
      }

      const parsed = parseCardInput(input, false);
      const roleError = checkRoleAssessment(parsed.data);
      if (roleError) parsed.errors.role_assessment_score = roleError;
      if (Object.keys(parsed.errors).length) return fail(400, Object.values(parsed.errors)[0], parsed.errors);

      const position = await db.shortlistCandidate.count({ where: { shortlist_id: s.id } });
      const entry = await db.shortlistCandidate.create({
        data: {
          ...parsed.data,
          shortlist_id: s.id,
          candidate_id: candidateId,
          position,
          ...assessmentStamp(parsed.data, parsed.touchesAssessment, actorId, now),
        },
      });
      return ok({ entry });
    }

    case 'UPDATE_CANDIDATE': {
      const entry = await findEntry(payload.shortlistCandidateId);
      if (!entry) return fail(404, 'Candidate not found on this vacancy.');
      const parsed = parseCardInput(payload, true);
      const roleError = checkRoleAssessment({ ...entry, ...parsed.data });
      if (roleError) parsed.errors.role_assessment_score = roleError;
      if (Object.keys(parsed.errors).length) return fail(400, Object.values(parsed.errors)[0], parsed.errors);

      const data: Record<string, any> = { ...parsed.data };
      if (parsed.touchesAssessment) Object.assign(data, assessmentStamp({ ...entry, ...parsed.data }, true, actorId, now));

      const events: ('OFFER_MADE' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED')[] = [];
      if (has(data, 'offer_status') && data.offer_status !== entry.offer_status) {
        const s = data.offer_status;
        if (s === null) Object.assign(data, { offer_made_at: null, offer_responded_at: null });
        else {
          if (!entry.offer_made_at) data.offer_made_at = now;
          events.push('OFFER_MADE');
          if (s === 'OFFERED') data.offer_responded_at = null;
          else data.offer_responded_at = now;
          if (s === 'ACCEPTED') events.push('OFFER_ACCEPTED');
          if (s === 'DECLINED') events.push('OFFER_DECLINED');
        }
      }

      await db.$transaction(async (tx: any) => {
        await tx.shortlistCandidate.update({ where: { id: entry.id }, data });
        for (const type of events) {
          await recordHireEvent(tx, type, { vacancyId, shortlistCandidateId: entry.id, actorId }, entry.id, now);
        }
        if (events.includes('OFFER_MADE')) await advanceVacancy(tx, vacancyId, 'OFFER', actorId);
      });
      return ok();
    }

    case 'REMOVE_CANDIDATE': {
      const entry = await findEntry(payload.shortlistCandidateId);
      if (!entry) return fail(404, 'Candidate not found on this vacancy.');
      if (entry.placement) return fail(400, 'This candidate has a placement and can’t be removed.');
      const requests = await db.interviewRequest.count({ where: { shortlist_candidate_id: entry.id } });
      if (requests > 0) return fail(400, 'This candidate has interview requests. Record the outcome instead of removing them.');
      await db.shortlistCandidate.delete({ where: { id: entry.id } });
      return ok();
    }

    case 'SEND_SHORTLIST': {
      const s = await findShortlist(payload.shortlistId);
      if (!s) return fail(404, 'Shortlist not found.');
      const count = await db.shortlistCandidate.count({ where: { shortlist_id: s.id } });
      if (count === 0) return fail(400, 'Add at least one candidate before sending.');

      const days = payload.expiresInDays === undefined ? DEFAULT_LINK_DAYS : Number(payload.expiresInDays);
      if (!Number.isInteger(days) || days < 1 || days > MAX_LINK_DAYS) return fail(400, `Link expiry must be between 1 and ${MAX_LINK_DAYS} days.`);
      const to = payload.sendEmail === false ? null : String(payload.to || vacancy.contact_email).trim().toLowerCase();
      if (to !== null && !EMAIL_RE.test(to)) return fail(400, 'Enter a valid email address.');

      const { token, hash } = generateShortlistToken();
      const expiresAt = new Date(now.getTime() + days * 86_400_000);
      const link = await db.$transaction(async (tx: any) => {
        const l = await tx.shortlistLink.create({ data: { shortlist_id: s.id, token_hash: hash, expires_at: expiresAt, created_by_id: actorId } });
        if (s.status !== 'SENT') await tx.shortlist.update({ where: { id: s.id }, data: { status: 'SENT', sent_at: now } });
        await recordHireEvent(tx, 'SHORTLIST_SENT', { vacancyId, shortlistId: s.id, actorId }, s.id, now);
        await advanceVacancy(tx, vacancyId, 'SHORTLIST_SENT', actorId);
        return l;
      });

      const url = shortlistUrl(token);
      let email: EmailOutcome | 'NOT_REQUESTED' = 'NOT_REQUESTED';
      if (to) {
        email = await sendOnceSafely(db, {
          dedupeKey: `shortlist_ready:${link.id}`,
          template: 'shortlist_ready',
          to,
          vacancyId,
          email: renderEmployerShortlistReady({
            vacancyId,
            contactName: vacancy.contact_name,
            roleTitle: vacancy.role_title,
            companyName: vacancy.company_name,
            url,
            expiresAt,
            candidateCount: count,
          }),
        });
      }
      // The raw link is returned once so staff can copy it; it is never stored.
      return ok({ url, expiresAt, linkId: link.id, email, outsideTarget: count < 3 || count > 5 });
    }

    case 'REVOKE_LINK': {
      const link = await db.shortlistLink.findFirst({ where: { id: Number(payload.linkId) || -1, shortlist: { vacancy_id: vacancyId } } });
      if (!link) return fail(404, 'Link not found.');
      if (!link.revoked_at) await db.shortlistLink.update({ where: { id: link.id }, data: { revoked_at: now } });
      return ok();
    }

    case 'RECORD_INTERVIEW_REQUEST': {
      const entry = await findEntry(payload.shortlistCandidateId);
      if (!entry) return fail(404, 'Candidate not found on this vacancy.');
      const res = await createInterviewRequest(db, {
        vacancyId,
        shortlistId: entry.shortlist_id,
        shortlistCandidateId: entry.id,
        source: 'STAFF',
        message: str(payload.message, 1000),
        preferredTimes: str(payload.preferredTimes, 200),
        actorId,
      });
      return ok({ created: res.created, requestId: res.request.id });
    }

    case 'UPDATE_INTERVIEW_REQUEST': {
      const r = await db.interviewRequest.findFirst({ where: { id: Number(payload.requestId) || -1, vacancy_id: vacancyId } });
      if (!r) return fail(404, 'Interview request not found.');
      const data: Record<string, any> = {};
      if (has(payload, 'status')) {
        if (!inList(INTERVIEW_REQUEST_STATUSES, payload.status)) return fail(400, 'Unknown status.');
        data.status = payload.status;
      }
      if (has(payload, 'scheduled_for')) {
        const d = payload.scheduled_for ? new Date(String(payload.scheduled_for)) : null;
        if (d && Number.isNaN(d.getTime())) return fail(400, 'Enter a valid date and time.');
        data.scheduled_for = d;
      }
      await db.interviewRequest.update({ where: { id: r.id }, data });
      return ok();
    }

    case 'CREATE_PLACEMENT': {
      let entry: any = null;
      if (payload.shortlistCandidateId) {
        entry = await findEntry(payload.shortlistCandidateId);
        if (!entry) return fail(404, 'Candidate not found on this vacancy.');
        if (entry.placement) return fail(400, 'This candidate already has a placement.');
      }
      const errors: Errors = {};
      const name = str(payload.candidate_name, 160) || entry?.display_name || null;
      if (!name) errors.candidate_name = 'Enter the candidate’s name.';
      const start = parseDateOnly(payload.start_date);
      if (!start) errors.start_date = 'Enter the start date.';
      const ctc = intOrNull(payload.annual_ctc);
      if (ctc === undefined || ctc === null || ctc < 12_000 || ctc > 10_000_000) errors.annual_ctc = 'Annual CTC must be a whole rand amount between R12,000 and R10,000,000.';
      if (Object.keys(errors).length) return fail(400, Object.values(errors)[0], errors);

      // Price with the agreed terms for this vacancy's commercial model (standard, partner or programme),
      // snapshotted onto the placement. Refused when an agreement decision is outstanding.
      const resolved = await resolvePlacementTerms(db, vacancy, ctx.terms, now);
      if (!resolved.ok) return fail(409, resolved.error);
      const t = resolved.terms;
      const placement = await db.$transaction(async (tx: any) => {
        const p = await tx.placement.create({
          data: {
            vacancy_id: vacancyId,
            shortlist_candidate_id: entry?.id ?? null,
            candidate_id: entry?.candidate_id ?? null,
            candidate_name: name,
            start_date: start,
            annual_ctc: ctc,
            ...t,
            placement_fee: computeFee(ctc as number, t),
            guarantee_end_date: guaranteeEndDate(start as Date, t.guarantee_days),
            created_by_id: actorId,
          },
        });
        if (entry && entry.offer_status !== 'ACCEPTED') {
          await tx.shortlistCandidate.update({
            where: { id: entry.id },
            data: { offer_status: 'ACCEPTED', offer_made_at: entry.offer_made_at ?? now, offer_responded_at: now },
          });
          await recordHireEvent(tx, 'OFFER_MADE', { vacancyId, shortlistCandidateId: entry.id, actorId }, entry.id, now);
          await recordHireEvent(tx, 'OFFER_ACCEPTED', { vacancyId, shortlistCandidateId: entry.id, actorId }, entry.id, now);
        }
        await recordHireEvent(tx, 'HIRE_COMPLETED', { vacancyId, placementId: p.id, shortlistCandidateId: entry?.id, actorId }, p.id, now);
        await advanceVacancy(tx, vacancyId, 'HIRED', actorId);
        return p;
      });
      return ok({ placement });
    }

    case 'UPDATE_PLACEMENT': {
      const p = await db.placement.findFirst({ where: { id: Number(payload.placementId) || -1, vacancy_id: vacancyId } });
      if (!p) return fail(404, 'Placement not found.');
      const res = buildPlacementUpdate(p, payload, now);
      if (!res.ok) return fail(400, Object.values(res.errors)[0], res.errors);
      await db.$transaction(async (tx: any) => {
        const updated = await tx.placement.update({ where: { id: p.id }, data: res.data });
        for (const type of res.events) await recordHireEvent(tx, type, { vacancyId, placementId: p.id, actorId }, p.id, now);
        const furthest = furthestCheck(updated);
        if (furthest) await advanceVacancy(tx, vacancyId, `CHECK_${furthest}` as VacancyStatus, actorId);
      });
      return ok();
    }

    case 'RETRY_EMAIL': {
      const res = await retryEmailLog(db, Number(payload.emailLogId), vacancyId);
      return res.ok || res.outcome ? ok({ outcome: res.outcome }) : fail(400, res.error || 'Could not retry this email.');
    }

    default:
      return fail(400, 'Unknown action.');
  }
}

/** Departed at an earlier check means departed at every later check. */
export function effectiveOutcome(p: Record<string, any>, days: 30 | 60 | 90): string | null {
  for (const d of FOLLOW_UP_DAYS) {
    if (d > days) break;
    const o = p[`check_${d}_outcome`];
    if (o && DEPARTED_OUTCOMES.includes(o)) return o;
  }
  return p[`check_${days}_outcome`] ?? null;
}

