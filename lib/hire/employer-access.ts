/**
 * Employer dashboard data access. EVERY query is scoped to the companies the signed-in user was
 * explicitly added to (CompanyMember). Email addresses and domains never grant access.
 * Only SENT shortlists are visible, and only employer-safe card fields are returned: no recruiter
 * internal notes, contact details, platform candidate ids, CV storage keys or other companies' data.
 */
import { toCandidateCard } from './card';
import { createInterviewRequest } from './ops';
import { hasEntitlement } from './partner';

export const FEEDBACK_DECISIONS = [
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'NOT_A_FIT', label: 'Not a fit' },
] as const;
const SCORE_FIELDS = ['score_skills', 'score_communication', 'score_culture', 'score_overall'] as const;

export async function companyIdsFor(db: any, userId: number): Promise<number[]> {
  const rows = await db.companyMember.findMany({ where: { user_id: userId }, select: { company_id: true } });
  return rows.map((r: any) => r.company_id);
}

async function scorecardsEnabled(db: any, companyId: number) {
  const sub = await db.partnerSubscription.findFirst({ where: { company_id: companyId, status: 'ACTIVE' } });
  return hasEntitlement(sub, 'INTERVIEW_SCORECARDS');
}

export async function loadEmployerDashboard(db: any, userId: number) {
  const companyIds = await companyIdsFor(db, userId);
  if (!companyIds.length) return { companies: [], vacancies: [] };

  const [companies, vacancies] = await Promise.all([
    db.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }),
    db.vacancy.findMany({
      where: { company_id: { in: companyIds } },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        company_id: true,
        role_title: true,
        location: true,
        status: true,
        created_at: true,
        commercial_model: true,
        salary_benchmark_note: true,
        partner_subscription_id: true,
        shortlists: {
          where: { status: 'SENT' },
          orderBy: { sent_at: 'asc' },
          select: {
            id: true,
            title: true,
            sent_at: true,
            candidates: {
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
              include: {
                interview_requests: { where: { status: { not: 'CANCELLED' } }, select: { id: true, status: true } },
                employer_feedback_entries: { where: { user_id: userId } },
              },
            },
          },
        },
      },
    }),
  ]);

  const entitled = new Map<number, boolean>();
  for (const id of companyIds) entitled.set(id, await scorecardsEnabled(db, id));

  return {
    companies: companies.map((c: any) => ({ ...c, scorecards: entitled.get(c.id) ?? false })),
    vacancies: vacancies.map((v: any) => {
      const subActive = v.commercial_model === 'PARTNER';
      return {
        id: v.id,
        companyId: v.company_id,
        roleTitle: v.role_title,
        location: v.location,
        status: v.status,
        receivedAt: v.created_at,
        // Shown only on partner vacancies (salary benchmarking entitlement)
        salaryBenchmark: subActive ? v.salary_benchmark_note : null,
        scorecards: entitled.get(v.company_id) ?? false,
        shortlists: v.shortlists.map((s: any) => ({
          id: s.id,
          title: s.title,
          sentAt: s.sent_at,
          candidates: s.candidates.map((e: any) => {
            const fb = e.employer_feedback_entries[0] ?? null;
            return {
              ...toCandidateCard(e, e.interview_requests.length > 0),
              myFeedback: fb
                ? { decision: fb.decision, comment: fb.comment, scores: Object.fromEntries(SCORE_FIELDS.map((k) => [k, fb[k] ?? null])) }
                : null,
            };
          }),
        })),
      };
    }),
  };
}

/** A shortlisted candidate the user may act on: on a SENT shortlist of one of their companies' vacancies. */
export async function findEntryForEmployer(db: any, userId: number, shortlistCandidateId: unknown) {
  const companyIds = await companyIdsFor(db, userId);
  if (!companyIds.length) return null;
  return db.shortlistCandidate.findFirst({
    where: {
      id: Number(shortlistCandidateId) || -1,
      shortlist: { status: 'SENT', vacancy: { company_id: { in: companyIds } } },
    },
    include: { shortlist: { select: { id: true, vacancy_id: true, vacancy: { select: { company_id: true } } } } },
  });
}

export async function employerRequestInterview(db: any, userId: number, body: Record<string, unknown>) {
  const entry = await findEntryForEmployer(db, userId, body.shortlistCandidateId);
  if (!entry) return { status: 404, body: { error: 'Candidate not found.' } };
  const res = await createInterviewRequest(db, {
    vacancyId: entry.shortlist.vacancy_id,
    shortlistId: entry.shortlist.id,
    shortlistCandidateId: entry.id,
    source: 'EMPLOYER_DASHBOARD',
    requestedByUserId: userId,
    preferredTimes: body.preferredTimes as string,
    message: body.message as string,
  });
  return { status: res.created ? 201 : 200, body: { success: true, alreadyRequested: !res.created } };
}

export async function employerSubmitFeedback(db: any, userId: number, body: Record<string, unknown>) {
  const entry = await findEntryForEmployer(db, userId, body.shortlistCandidateId);
  if (!entry) return { status: 404, body: { error: 'Candidate not found.' } };
  const decision = String(body.decision ?? '');
  if (!FEEDBACK_DECISIONS.some((d) => d.value === decision)) return { status: 400, body: { error: 'Choose interested, maybe or not a fit.' } };
  const comment = String(body.comment ?? '').trim().slice(0, 1000) || null;

  const companyId = entry.shortlist.vacancy.company_id;
  const scores: Record<string, number | null> = {};
  const scoreProvided = SCORE_FIELDS.some((k) => body[k] !== undefined && body[k] !== null && body[k] !== '');
  if (scoreProvided) {
    // Interview scorecards are a Hiring Partner entitlement, enforced here on the server
    if (!(await scorecardsEnabled(db, companyId))) return { status: 403, body: { error: 'Interview scorecards are not included in your plan.' } };
    for (const k of SCORE_FIELDS) {
      const v = body[k];
      if (v === undefined || v === null || v === '') scores[k] = null;
      else {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 5) return { status: 400, body: { error: 'Scores must be from 1 to 5.' } };
        scores[k] = n;
      }
    }
  }

  const existing = await db.employerFeedback.findFirst({ where: { shortlist_candidate_id: entry.id, user_id: userId } });
  const data = { decision, comment, ...(scoreProvided ? scores : {}) };
  if (existing) await db.employerFeedback.update({ where: { id: existing.id }, data });
  else await db.employerFeedback.create({ data: { ...data, shortlist_candidate_id: entry.id, company_id: companyId, user_id: userId } });
  return { status: 200, body: { success: true } };
}
