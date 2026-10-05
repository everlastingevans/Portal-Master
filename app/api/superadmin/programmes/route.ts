import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { findTierOverlaps } from '@/lib/hire/programmes';
import { getProgrammeTiers, runProgrammeAction } from '@/lib/hire/programme-admin';

// Bulk hiring programmes list, tiers and actions. SUPERADMIN only; disabled unless FEATURE_BULK_PROGRAMMES.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isFeatureEnabled('BULK_PROGRAMMES')) return NextResponse.json({ enabled: false, programmes: [] });

  try {
    const [programmes, tiers] = await Promise.all([
      db.bulkProgramme.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          terms: { orderBy: [{ agreed_on: 'desc' }, { id: 'desc' }], take: 1 },
          vacancies: { select: { id: true, placements: { select: { id: true } } } },
        },
      }),
      getProgrammeTiers(),
    ]);
    return NextResponse.json({
      enabled: true,
      tiers,
      overlaps: findTierOverlaps(tiers),
      programmes: programmes.map((p: any) => ({
        id: p.id,
        name: p.name,
        company_name: p.company_name,
        status: p.status,
        source: p.source,
        target_hires: p.target_hires,
        created_at: p.created_at,
        currentTerms: p.terms[0] ?? null,
        linkedVacancies: p.vacancies.length,
        placements: p.vacancies.reduce((a: number, v: any) => a + v.placements.length, 0),
      })),
    });
  } catch (error) {
    console.error('[Programmes] list failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load programmes.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'An action is required.' }, { status: 400 });
  try {
    const res = await runProgrammeAction(db, body.action, body.payload && typeof body.payload === 'object' ? body.payload : {}, { actorId: auth.session?.userId ?? null });
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    console.error(`[Programmes] ${body.action} failed:`, (error as Error).message);
    return NextResponse.json({ error: 'Something went wrong. Nothing was changed.' }, { status: 500 });
  }
}
