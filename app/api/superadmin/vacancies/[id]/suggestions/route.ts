import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { matchCandidate, rankMatches } from '@/lib/hire/matching';
import { loadMatchPool, toMatchVacancy } from '@/lib/hire/matching-data';

// Explainable candidate suggestions for a vacancy, for recruiter review only. SUPERADMIN only.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isFeatureEnabled('MATCH_SUGGESTIONS')) return NextResponse.json({ error: 'Match suggestions are disabled.' }, { status: 404 });

  const vacancy = await db.vacancy.findUnique({
    where: { id: Number(params.id) || -1 },
    include: { shortlists: { select: { candidates: { select: { candidate_id: true } } } } },
  });
  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found.' }, { status: 404 });

  try {
    const pool = await loadMatchPool(db);
    const onShortlist = new Set(vacancy.shortlists.flatMap((s: any) => s.candidates.map((c: any) => c.candidate_id)).filter(Boolean));
    const v = toMatchVacancy(vacancy);
    const ranked = rankMatches(pool.map((c) => matchCandidate(v, c)));
    const top = ranked.slice(0, 25);
    const people = await db.user.findMany({ where: { id: { in: top.map((r) => r.candidateId) } }, select: { id: true, name: true, professional_title: true, location: true, cv_url: true } });
    const byId = new Map(people.map((p: any) => [p.id, p]));
    return NextResponse.json({
      poolSize: pool.length,
      note: 'Suggestions are ranked by how many known criteria match. Unknown is not a fail. Review every candidate before adding them to a shortlist.',
      suggestions: top.map((r) => ({ ...r, candidate: byId.get(r.candidateId) ?? null, alreadyShortlisted: onShortlist.has(r.candidateId) })),
    });
  } catch (error) {
    console.error('[Suggestions] failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load suggestions.' }, { status: 500 });
  }
}
