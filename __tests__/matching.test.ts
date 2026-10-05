import { evaluateMatching, matchCandidate, MatchCandidate, MatchVacancy, provinceOf, rankMatches } from '@/lib/hire/matching';

const NOW = new Date('2026-10-05T10:00:00Z');
const vacancy: MatchVacancy = {
  role_title: 'Junior Sales Consultant',
  key_skills: ['Cold calling', 'CRM', 'Excel', 'Salesforce'],
  required_experience: 'UP_TO_1',
  location: 'Sandton, Johannesburg',
  work_arrangement: 'HYBRID',
  salary_min: 12000,
  salary_max: 16000,
  start_date: new Date('2026-11-01'),
};
const cand = (id: number, over: Partial<MatchCandidate> = {}): MatchCandidate => ({
  id,
  skills: 'CRM, Excel, cold calling',
  experience_level: 'Junior',
  location: 'Gauteng',
  availability: 'IMMEDIATE',
  professional_title: 'Sales intern',
  seeking_roles: 'Sales consultant',
  ...over,
});
const status = (r: ReturnType<typeof matchCandidate>, key: string) => r.criteria.find((c) => c.key === key)!.status;

describe('explainable matching', () => {
  it('explains each criterion and never produces a numeric confidence score', () => {
    const r = matchCandidate(vacancy, cand(1), NOW);
    expect(status(r, 'skills')).toBe('match');
    expect(r.criteria.find((c) => c.key === 'skills')!.detail).toMatch(/3 of 4.*Not listed: Salesforce/);
    expect(status(r, 'experience')).toBe('match');
    expect(status(r, 'location')).toBe('match');
    expect(status(r, 'availability')).toBe('match');
    expect(status(r, 'role')).toBe('match');
    expect(JSON.stringify(r)).not.toMatch(/score"|confidence|probab/i);
  });

  it('treats missing data, including no assessment, as unknown rather than a fail', () => {
    const r = matchCandidate(vacancy, cand(2, { skills: null, experience_level: null, location: null, availability: null, professional_title: null, seeking_roles: null }), NOW);
    for (const k of ['skills', 'experience', 'location', 'salary', 'availability', 'role', 'assessment']) expect(status(r, k)).toBe('unknown');
    expect(r.counts.mismatch).toBe(0);
    expect(r.criteria.find((c) => c.key === 'assessment')!.detail).toMatch(/not a fail/);
  });

  it('uses salary only from an earlier LaunchPath screening', () => {
    expect(status(matchCandidate(vacancy, cand(3), NOW), 'salary')).toBe('unknown');
    expect(status(matchCandidate(vacancy, cand(3, { priorSalaryExpectation: { amount: 15000, at: NOW } }), NOW), 'salary')).toBe('match');
    expect(status(matchCandidate(vacancy, cand(3, { priorSalaryExpectation: { amount: 17000, at: NOW } }), NOW), 'salary')).toBe('partial');
    expect(status(matchCandidate(vacancy, cand(3, { priorSalaryExpectation: { amount: 25000, at: NOW } }), NOW), 'salary')).toBe('mismatch');
  });

  it('handles location, remote work and availability timing', () => {
    expect(provinceOf('Umhlanga Rocks')).toBe('KwaZulu-Natal');
    expect(provinceOf('Somewhere unknown')).toBeNull();
    expect(status(matchCandidate(vacancy, cand(4, { location: 'Western Cape' }), NOW), 'location')).toBe('mismatch');
    expect(status(matchCandidate({ ...vacancy, work_arrangement: 'REMOTE' }, cand(4, { location: 'Western Cape' }), NOW), 'location')).toBe('match');
    expect(status(matchCandidate({ ...vacancy, location: 'Head office' }, cand(4), NOW), 'location')).toBe('unknown');
    expect(status(matchCandidate({ ...vacancy, start_date: new Date('2026-10-10') }, cand(4, { availability: 'ONE_MONTH' }), NOW), 'availability')).toBe('partial');
  });

  it('ranks by known matches but never drops anyone', () => {
    const pool = [cand(10, { skills: 'Python', location: 'Western Cape' }), cand(11), cand(12, { skills: null })];
    const ranked = rankMatches(pool.map((c) => matchCandidate(vacancy, c, NOW)));
    expect(ranked.map((r) => r.candidateId)[0]).toBe(11);
    expect(ranked).toHaveLength(3);
  });
});

describe('evaluation', () => {
  it('claims nothing without enough recruiter-reviewed examples', () => {
    const r = evaluateMatching([{ vacancy, pool: [cand(1), cand(2)], positives: [1] }], { now: NOW });
    expect(r.sufficient).toBe(false);
    expect(r.conclusion).toMatch(/No improvement is claimed/);
  });

  it('computes recall@K against reviewed positives when the sample is large enough (synthetic correctness check only)', () => {
    const pool = Array.from({ length: 30 }, (_, i) => cand(100 + i, i < 3 ? {} : { skills: 'Excel', location: 'Western Cape', availability: 'ONE_MONTH' }));
    const cases = Array.from({ length: 10 }, () => ({ vacancy, pool, positives: [100, 101] }));
    const r = evaluateMatching(cases, { now: NOW, k: 5 });
    expect(r).toMatchObject({ sufficient: true, vacanciesEvaluated: 10, positiveExamples: 20 });
    expect(r.recallAtK!.explainable).toBe(1);
  });
});
