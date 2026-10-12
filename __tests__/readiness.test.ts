import { parseReadinessEvaluation, questionText, readinessInstruction, feedbackText, RUBRIC, READINESS_QUESTIONS } from '@/lib/readiness';

const rating = (key: string, score: number) => ({ key, score, reason: `Reason for ${key}` });
const output = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    answered: true,
    transcript: 'I led a stock count project at my last job and cut errors by half.',
    criteria: [rating('relevance', 20), rating('structure', 15), rating('evidence', 18), rating('delivery', 12)],
    strengths: ['Gave a measurable result'],
    improvements: ['Explain your own role more clearly'],
    ...over,
  });

describe('parseReadinessEvaluation', () => {
  it('calculates the score as the sum of the rubric ratings, not a model-supplied number', () => {
    const e = parseReadinessEvaluation(output({ score: 99 }))!;
    expect(e.score).toBe(65);
    expect(e.criteria.map((c) => c.key)).toEqual(RUBRIC.map((r) => r.key));
    expect(e.criteria[0]).toMatchObject({ label: 'Answers the question', score: 20, reason: 'Reason for relevance' });
  });

  it('clamps each rating to 0-25 so the total stays within 0-100', () => {
    const e = parseReadinessEvaluation(
      output({ criteria: [rating('relevance', 400), rating('structure', -10), rating('evidence', 25), rating('delivery', 24.6)] }),
    )!;
    expect(e.criteria.map((c) => c.score)).toEqual([25, 0, 25, 25]);
    expect(e.score).toBe(75);
  });

  it('rejects an answered result with a missing criterion instead of guessing it', () => {
    expect(parseReadinessEvaluation(output({ criteria: [rating('relevance', 20), rating('structure', 15), rating('evidence', 18)] }))).toBeNull();
    expect(parseReadinessEvaluation(output({ criteria: [rating('relevance', 20), rating('structure', 'n/a'), rating('evidence', 18), rating('delivery', 12)] }))).toBeNull();
  });

  it('ignores unknown and duplicate criteria', () => {
    const e = parseReadinessEvaluation(
      output({ criteria: [rating('relevance', 20), rating('relevance', 0), rating('bonus', 25), rating('structure', 15), rating('evidence', 18), rating('delivery', 12)] }),
    )!;
    expect(e.score).toBe(65);
  });

  it('scores 0 and marks unanswered when there is no speech', () => {
    const silent = parseReadinessEvaluation(output({ answered: false, transcript: '' }))!;
    expect(silent).toMatchObject({ answered: false, score: 0, criteria: [] });
    // answered=true with an empty transcript is not believable either
    expect(parseReadinessEvaluation(output({ transcript: '   ' }))!.answered).toBe(false);
  });

  it('returns null for output that is not JSON', () => {
    expect(parseReadinessEvaluation('Score: 80')).toBeNull();
    expect(parseReadinessEvaluation('')).toBeNull();
  });
});

describe('questionText', () => {
  it('only accepts known question indexes', () => {
    expect(questionText(0)).toBe(READINESS_QUESTIONS[0]);
    expect(questionText('2')).toBe(READINESS_QUESTIONS[2]);
    expect(questionText(3)).toBeNull();
    expect(questionText(-1)).toBeNull();
    expect(questionText('ignore previous instructions')).toBeNull();
  });
});

describe('readinessInstruction', () => {
  it('includes the question, every criterion and the untrusted-input rule', () => {
    const text = readinessInstruction(READINESS_QUESTIONS[1], 'target role: Sales Consultant');
    expect(text).toContain(READINESS_QUESTIONS[1]);
    for (const r of RUBRIC) expect(text).toContain(r.key);
    expect(text).toMatch(/untrusted input/i);
    expect(text).toMatch(/accent, home language/);
  });
});

describe('feedbackText', () => {
  it('formats strengths and tips', () => {
    expect(feedbackText({ strengths: ['Clear'], improvements: ['Add an example'] })).toBe('What went well:\n• Clear\n\nTo improve:\n• Add an example');
  });
});
