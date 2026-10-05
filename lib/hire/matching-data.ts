import { MatchCandidate, MatchVacancy } from './matching';

/**
 * Loads platform candidates for matching, with recruiter-captured data from earlier LaunchPath
 * screenings (salary expectation, assessments). Practice-interview scores are NOT used.
 */
export async function loadMatchPool(db: any, limit = 3000): Promise<MatchCandidate[]> {
  const users = await db.user.findMany({
    where: { role: 'CANDIDATE' },
    take: limit,
    orderBy: { id: 'desc' },
    select: { id: true, skills: true, experience_level: true, location: true, availability: true, professional_title: true, seeking_roles: true },
  });
  const ids = users.map((u: any) => u.id);
  const prior = ids.length
    ? await db.shortlistCandidate.findMany({
        where: { candidate_id: { in: ids } },
        orderBy: { updated_at: 'desc' },
        select: { candidate_id: true, salary_expectation: true, communication_rating: true, interview_readiness: true, assessed_at: true, updated_at: true },
      })
    : [];
  const latest = new Map<number, any>();
  for (const p of prior) if (!latest.has(p.candidate_id)) latest.set(p.candidate_id, p);
  return users.map((u: any) => {
    const p = latest.get(u.id);
    return {
      ...u,
      priorSalaryExpectation: p?.salary_expectation ? { amount: p.salary_expectation, at: p.updated_at } : null,
      priorAssessment: p && (p.communication_rating || p.interview_readiness) ? { communication: p.communication_rating, readiness: p.interview_readiness, at: p.assessed_at ?? p.updated_at } : null,
    };
  });
}

export const toMatchVacancy = (v: any): MatchVacancy => ({
  role_title: v.role_title,
  key_skills: v.key_skills ?? [],
  required_experience: v.required_experience,
  location: v.location,
  work_arrangement: v.work_arrangement,
  salary_min: v.salary_min,
  salary_max: v.salary_max,
  start_date: v.start_date ? new Date(v.start_date) : null,
});

/**
 * Recruiter-reviewed examples for evaluation: platform candidates a recruiter rated Strong/Good, or who
 * got an interview request or a placement, on each vacancy.
 */
export async function loadReviewedExamples(db: any) {
  const entries = await db.shortlistCandidate.findMany({
    where: { candidate_id: { not: null } },
    select: {
      candidate_id: true,
      match_level: true,
      shortlist: { select: { vacancy_id: true } },
      interview_requests: { select: { id: true } },
      placement: { select: { id: true } },
    },
  });
  const byVacancy = new Map<number, Set<number>>();
  for (const e of entries) {
    const positive = ['STRONG', 'GOOD'].includes(e.match_level) || e.interview_requests.length > 0 || Boolean(e.placement);
    if (!positive) continue;
    const set = byVacancy.get(e.shortlist.vacancy_id) || new Set<number>();
    set.add(e.candidate_id);
    byVacancy.set(e.shortlist.vacancy_id, set);
  }
  return byVacancy;
}
