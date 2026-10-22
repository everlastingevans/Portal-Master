import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { findOrCreateSource } from '@/lib/cv-import/service';

// Schools and training organisations candidates are imported from. SUPERADMIN only.

export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [sources, groups] = await Promise.all([
    db.candidateSource.findMany({ orderBy: { name: 'asc' } }),
    db.user.groupBy({ by: ['source_id'], where: { role: 'CANDIDATE', source_id: { not: null } }, _count: { _all: true } }),
  ]);
  const counts = new Map<number | null, number>(groups.map((g: any) => [g.source_id, g._count._all]));
  return NextResponse.json({
    sources: sources.map((s) => ({ id: s.id, name: s.name, kind: s.kind, candidates: counts.get(s.id) ?? 0 })),
  });
}

export async function POST(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const result = await findOrCreateSource(db, body.name, body.kind, auth.session.userId);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ source: { id: result.source.id, name: result.source.name, kind: result.source.kind } });
}
