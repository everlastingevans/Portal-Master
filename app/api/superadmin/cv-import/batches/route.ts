import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { createBatch, summariseBatch } from '@/lib/cv-import/service';

/** GET: recent imports with progress and outcome counts. POST: start an import. SUPERADMIN only. */
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const batches = await db.cvImportBatch.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    include: { source: { select: { id: true, name: true, kind: true } } },
  });
  const ids = batches.map((b) => b.id);
  // Prisma's groupBy generics reject a computed two-field `by`, so the call is typed by its result instead
  const groups: { batch_id: number; status: string; _count: { _all: number } }[] = ids.length
    ? await (db.cvImportItem.groupBy as any)({ by: ['batch_id', 'status'], where: { batch_id: { in: ids } }, _count: { _all: true } })
    : [];
  const now = new Date();
  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      label: b.label,
      mode: b.mode,
      source: b.source,
      talentPoolVisible: b.talent_pool_visible,
      createdAt: b.created_at,
      ...summariseBatch(
        b,
        groups.filter((g) => g.batch_id === b.id).map((g) => ({ status: g.status, count: g._count._all })),
        now,
      ),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized || !auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const result = await createBatch(db, body, auth.session.userId);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ batch: { id: result.batch.id, sourceId: result.batch.source_id, totalFiles: result.batch.total_files } });
}
