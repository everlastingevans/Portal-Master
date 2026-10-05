import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { evaluateMatching } from '@/lib/hire/matching';
import { loadMatchPool, loadReviewedExamples, toMatchVacancy } from '@/lib/hire/matching-data';

// Evaluates the explainable matcher against recruiter-reviewed outcomes, with a skills-only baseline.
// Reports "insufficient data" rather than claiming improvement on a small sample. SUPERADMIN only.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const reviewed = await loadReviewedExamples(db);
    const vacancyIds = Array.from(reviewed.keys());
    const [vacancies, pool] = await Promise.all([db.vacancy.findMany({ where: { id: { in: vacancyIds } } }), vacancyIds.length ? loadMatchPool(db) : Promise.resolve([])]);
    const result = evaluateMatching(
      vacancies.map((v: any) => ({ vacancy: toMatchVacancy(v), pool, positives: Array.from(reviewed.get(v.id) || []) })),
    );
    return NextResponse.json({
      ...result,
      method:
        'For each vacancy with recruiter-reviewed positives (Strong/Good match, interview requested or hired), rank every platform candidate and measure how many positives appear in the top K. Compared with ranking by skills overlap only. Positives were chosen by recruiters who may have seen earlier suggestions, so results are indicative only.',
    });
  } catch (error) {
    console.error('[Matching evaluation] failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not run the evaluation.' }, { status: 500 });
  }
}
