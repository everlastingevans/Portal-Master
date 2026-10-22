import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { summariseBatch } from '@/lib/cv-import/service';

/** GET: one import with every file's outcome. SUPERADMIN only. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = Number(params.id);
  const batch = Number.isInteger(id)
    ? await db.cvImportBatch.findUnique({ where: { id }, include: { source: { select: { id: true, name: true, kind: true } } } })
    : null;
  if (!batch) return NextResponse.json({ error: 'Import not found.' }, { status: 404 });

  const items = await db.cvImportItem.findMany({ where: { batch_id: id }, orderBy: { id: 'asc' } });
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.status, (counts.get(i.status) ?? 0) + 1);

  return NextResponse.json({
    batch: {
      id: batch.id,
      label: batch.label,
      mode: batch.mode,
      source: batch.source,
      talentPoolVisible: batch.talent_pool_visible,
      createdAt: batch.created_at,
      ...summariseBatch(batch, Array.from(counts, ([status, count]) => ({ status, count }))),
    },
    items: items.map((i) => ({ id: i.id, fileName: i.file_name, status: i.status, message: i.message, candidateId: i.candidate_id })),
  });
}
