/**
 * Explainable candidate matching for recruiters. Each criterion is judged separately as match /
 * partial / mismatch / unknown, with a plain-language reason. There is no confidence score and no
 * automatic rejection: missing data (including no LaunchPath assessment) is "unknown", never a fail.
 * Suggestions are for recruiter review only; nothing is sent to employers automatically.
 */

export type CriterionStatus = 'match' | 'partial' | 'mismatch' | 'unknown';
export interface Criterion {
  key: 'skills' | 'experience' | 'location' | 'salary' | 'availability' | 'role' | 'assessment';
  label: string;
  status: CriterionStatus | 'info';
  detail: string;
}

export interface MatchVacancy {
  role_title: string;
  key_skills: string[];
  required_experience: string;
  location: string;
  work_arrangement: string;
  salary_min: number;
  salary_max: number;
  start_date: Date | null;
}

export interface MatchCandidate {
  id: number;
  skills: string | null;
  experience_level: string | null;
  location: string | null;
  availability: string | null;
  professional_title: string | null;
  seeking_roles: string | null;
  /** From a previous LaunchPath screening, if any (recruiter-captured, not self-reported on the profile) */
  priorSalaryExpectation?: { amount: number; at: Date } | null;
  priorAssessment?: { communication: number | null; readiness: number | null; at: Date } | null;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim();
export const splitSkills = (raw?: string | null) => (raw ? raw.split(/[,;|\n•·]+/).map((s) => norm(s)).filter(Boolean) : []);

function skillHit(wanted: string, have: string[]) {
  const w = norm(wanted);
  return have.some((h) => h === w || (w.length >= 3 && h.includes(w)) || (h.length >= 3 && w.includes(h)));
}

const PROVINCE_HINTS: [string, string[]][] = [
  ['Gauteng', ['gauteng', 'johannesburg', 'joburg', 'jhb', 'sandton', 'pretoria', 'tshwane', 'midrand', 'centurion', 'soweto', 'randburg', 'roodepoort', 'kempton', 'boksburg', 'germiston', 'rosebank', 'fourways', 'ekurhuleni']],
  ['Western Cape', ['western cape', 'cape town', 'stellenbosch', 'paarl', 'bellville', 'george']],
  ['KwaZulu-Natal', ['kwazulu', 'kzn', 'durban', 'umhlanga', 'pietermaritzburg', 'ballito', 'richards bay']],
  ['Eastern Cape', ['eastern cape', 'gqeberha', 'port elizabeth', 'east london', 'mthatha']],
  ['Free State', ['free state', 'bloemfontein']],
  ['Limpopo', ['limpopo', 'polokwane']],
  ['Mpumalanga', ['mpumalanga', 'mbombela', 'nelspruit', 'witbank', 'emalahleni']],
  ['North West', ['north west', 'rustenburg', 'mahikeng', 'potchefstroom']],
  ['Northern Cape', ['northern cape', 'kimberley', 'upington']],
];

export function provinceOf(text?: string | null): string | null {
  if (!text) return null;
  const t = norm(text);
  for (const [province, hints] of PROVINCE_HINTS) if (hints.some((h) => t.includes(h))) return province;
  return null;
}

const AVAILABILITY_DAYS: Record<string, number> = { IMMEDIATE: 0, TWO_WEEKS: 14, ONE_MONTH: 30 };
const AVAILABILITY_TEXT: Record<string, string> = { IMMEDIATE: 'immediately', TWO_WEEKS: 'in 2 weeks', ONE_MONTH: 'in 1 month' };
const STOP = new Set(['junior', 'senior', 'graduate', 'intern', 'trainee', 'assistant', 'entry', 'level', 'the', 'and', 'of', 'a', 'to', 'in', 'for', 'officer', 'specialist']);
const roleWords = (s?: string | null) => new Set(norm(s || '').split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
const rand = (n: number) => `R${n.toLocaleString('en-ZA').replace(/\s/g, ',')}`;

export function matchCandidate(v: MatchVacancy, c: MatchCandidate, now = new Date()) {
  const criteria: Criterion[] = [];

  // Skills
  const have = splitSkills(c.skills);
  if (!v.key_skills.length) criteria.push({ key: 'skills', label: 'Key skills', status: 'unknown', detail: 'The vacancy lists no key skills.' });
  else if (!have.length) criteria.push({ key: 'skills', label: 'Key skills', status: 'unknown', detail: 'No skills on the candidate’s profile.' });
  else {
    const hit = v.key_skills.filter((s) => skillHit(s, have));
    const miss = v.key_skills.filter((s) => !skillHit(s, have));
    const status: CriterionStatus = hit.length === 0 ? 'mismatch' : hit.length >= Math.ceil(v.key_skills.length / 2) ? 'match' : 'partial';
    criteria.push({
      key: 'skills',
      label: 'Key skills',
      status,
      detail: `${hit.length} of ${v.key_skills.length} on profile${hit.length ? `: ${hit.join(', ')}` : ''}.${miss.length ? ` Not listed: ${miss.join(', ')}.` : ''}`,
    });
  }

  // Experience (profile levels: Junior 0–2, Mid-Level 3–5, Senior 5+)
  const level = c.experience_level;
  const req = v.required_experience;
  if (!level) criteria.push({ key: 'experience', label: 'Experience', status: 'unknown', detail: 'No experience level on profile.' });
  else {
    const juniorOk = ['NONE', 'UP_TO_1', '1_TO_2'].includes(req);
    let status: CriterionStatus;
    let detail: string;
    if (level === 'Junior') {
      status = juniorOk ? 'match' : req === '2_TO_3' ? 'partial' : 'mismatch';
      detail = juniorOk ? 'Junior profile fits the requirement.' : req === '2_TO_3' ? 'Junior (0–2 years) for a 2–3 year role; check experience.' : 'Junior profile for a role needing 3+ years.';
    } else if (level === 'Mid-Level' || level === 'Senior') {
      status = req === 'OVER_3' || (req === '2_TO_3' && level === 'Mid-Level') ? 'match' : 'partial';
      detail = status === 'match' ? `${level} profile fits.` : `${level} profile is more experienced than this role asks for; check salary and fit.`;
    } else {
      status = 'unknown';
      detail = `Profile level “${level}” not recognised.`;
    }
    criteria.push({ key: 'experience', label: 'Experience', status, detail });
  }

  // Location
  if (v.work_arrangement === 'REMOTE') criteria.push({ key: 'location', label: 'Location', status: 'match', detail: 'Remote role.' });
  else {
    const vp = provinceOf(v.location);
    if (!c.location) criteria.push({ key: 'location', label: 'Location', status: 'unknown', detail: 'No location on profile.' });
    else if (c.location === 'Remote') criteria.push({ key: 'location', label: 'Location', status: 'partial', detail: `Candidate prefers remote; role is ${v.work_arrangement === 'HYBRID' ? 'hybrid' : 'on-site'} in ${v.location}.` });
    else if (!vp) criteria.push({ key: 'location', label: 'Location', status: 'unknown', detail: `Couldn’t place “${v.location}” in a province; check manually (candidate: ${c.location}).` });
    else if (vp === c.location) criteria.push({ key: 'location', label: 'Location', status: 'match', detail: `Both in ${vp}.` });
    else criteria.push({ key: 'location', label: 'Location', status: 'mismatch', detail: `Candidate in ${c.location}; role in ${vp}. Would need to relocate or commute.` });
  }

  // Salary (only from a previous LaunchPath screening; profiles don't hold salary expectations)
  const sal = c.priorSalaryExpectation;
  if (!sal) criteria.push({ key: 'salary', label: 'Salary', status: 'unknown', detail: 'No salary expectation on record. Ask during screening.' });
  else if (sal.amount <= v.salary_max) criteria.push({ key: 'salary', label: 'Salary', status: 'match', detail: `Expected ${rand(sal.amount)}/m at a previous screening; role pays ${rand(v.salary_min)}–${rand(v.salary_max)}.` });
  else if (sal.amount <= v.salary_max * 1.1) criteria.push({ key: 'salary', label: 'Salary', status: 'partial', detail: `Expected ${rand(sal.amount)}/m, slightly above the ${rand(v.salary_max)} maximum.` });
  else criteria.push({ key: 'salary', label: 'Salary', status: 'mismatch', detail: `Expected ${rand(sal.amount)}/m, above the ${rand(v.salary_max)} maximum.` });

  // Availability
  if (!c.availability || AVAILABILITY_DAYS[c.availability] === undefined) {
    criteria.push({ key: 'availability', label: 'Availability', status: 'unknown', detail: 'No availability on profile.' });
  } else if (!v.start_date) {
    criteria.push({ key: 'availability', label: 'Availability', status: 'match', detail: `Available ${AVAILABILITY_TEXT[c.availability]}; start date is flexible.` });
  } else {
    const daysToStart = Math.ceil((v.start_date.getTime() - now.getTime()) / 86_400_000);
    const ready = AVAILABILITY_DAYS[c.availability] <= Math.max(0, daysToStart);
    criteria.push({
      key: 'availability',
      label: 'Availability',
      status: ready ? 'match' : 'partial',
      detail: ready ? `Available ${AVAILABILITY_TEXT[c.availability]}, before the desired start.` : `Available ${AVAILABILITY_TEXT[c.availability]}, after the desired start date.`,
    });
  }

  // Role relevance (stated title / target roles)
  const want = roleWords(v.role_title);
  const stated = roleWords(`${c.professional_title || ''} ${c.seeking_roles || ''}`);
  if (!stated.size) criteria.push({ key: 'role', label: 'Target role', status: 'unknown', detail: 'No title or target roles on profile.' });
  else {
    const overlap = Array.from(want).filter((w) => stated.has(w));
    criteria.push({
      key: 'role',
      label: 'Target role',
      status: overlap.length ? 'match' : 'partial',
      detail: overlap.length ? `Profile mentions ${overlap.join(', ')}.` : `Profile title/target roles don’t mention “${v.role_title}”.`,
    });
  }

  // Assessment: information only. Missing assessment is unknown, never a fail.
  const a = c.priorAssessment;
  criteria.push(
    a && (a.communication || a.readiness)
      ? {
          key: 'assessment',
          label: 'LaunchPath assessment',
          status: 'info',
          detail: `Previously assessed${a.communication ? `: communication ${a.communication}/5` : ''}${a.readiness ? `, interview readiness ${a.readiness}/5` : ''}. Reassess for this role.`,
        }
      : { key: 'assessment', label: 'LaunchPath assessment', status: 'unknown', detail: 'Not yet assessed by LaunchPath (unknown, not a fail).' },
  );

  const counts = { match: 0, partial: 0, mismatch: 0, unknown: 0 };
  for (const cr of criteria) if (cr.status !== 'info') counts[cr.status]++;
  const skillsHit = v.key_skills.filter((s) => skillHit(s, have)).length;
  return { candidateId: c.id, criteria, counts, skillsHit };
}

export type MatchResult = ReturnType<typeof matchCandidate>;

/** Ranking: more matches, fewer mismatches, more skills, fewer unknowns. Ties keep input order. */
export function rankMatches(results: MatchResult[]) {
  return [...results].sort(
    (a, b) => b.counts.match - a.counts.match || a.counts.mismatch - b.counts.mismatch || b.skillsHit - a.skillsHit || a.counts.unknown - b.counts.unknown,
  );
}

/** Baseline for evaluation: skills overlap only. */
export const rankBySkillsOnly = (results: MatchResult[]) => [...results].sort((a, b) => b.skillsHit - a.skillsHit);

/**
 * Compares rankings against recruiter-reviewed outcomes: for each vacancy, the share of positively
 * reviewed candidates (Strong/Good match, interview requested, or hired) found in the top K.
 * Reports "insufficient" below a minimum sample instead of claiming any improvement.
 */
export function evaluateMatching(
  cases: { vacancy: MatchVacancy; pool: MatchCandidate[]; positives: number[] }[],
  opts: { k?: number; minVacancies?: number; minPositives?: number; now?: Date } = {},
) {
  const k = opts.k ?? 10;
  const minVacancies = opts.minVacancies ?? 10;
  const minPositives = opts.minPositives ?? 20;
  let positives = 0;
  let hitsNew = 0;
  let hitsBase = 0;
  let evaluated = 0;
  for (const c of cases) {
    if (!c.positives.length || !c.pool.length) continue;
    evaluated++;
    const results = c.pool.map((cand) => matchCandidate(c.vacancy, cand, opts.now));
    const topNew = new Set(rankMatches(results).slice(0, k).map((r) => r.candidateId));
    const topBase = new Set(rankBySkillsOnly(results).slice(0, k).map((r) => r.candidateId));
    for (const p of c.positives) {
      positives++;
      if (topNew.has(p)) hitsNew++;
      if (topBase.has(p)) hitsBase++;
    }
  }
  const sufficient = evaluated >= minVacancies && positives >= minPositives;
  return {
    k,
    vacanciesEvaluated: evaluated,
    positiveExamples: positives,
    sufficient,
    recallAtK: positives ? { explainable: hitsNew / positives, skillsOnlyBaseline: hitsBase / positives } : null,
    conclusion: sufficient
      ? 'Comparison on recruiter-reviewed outcomes (see recall figures). Treat as indicative, not proof.'
      : `Not enough recruiter-reviewed examples to evaluate (need ${minVacancies} vacancies and ${minPositives} positive examples; have ${evaluated} and ${positives}). No improvement is claimed.`,
  };
}
