import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { pdfText, readCv } from '@/lib/cv-import/extract';
import { storeCandidateCv } from '@/lib/cv-import/storage';
import { importCvFile } from '@/lib/cv-import/service';
import { sanitiseReviewedProfile } from '@/lib/cv-import/profile';

// One AI read per request; the browser sends a bulk upload a few files at a time
export const maxDuration = 60;

/**
 * POST /api/superadmin/cv-import/batches/:id/files (multipart: file, optional profile JSON)
 * Imports one CV into the batch. With `profile` (a staff-reviewed draft) the AI step is skipped.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = Number(params.id);
  const batch = Number.isInteger(id) ? await db.cvImportBatch.findUnique({ where: { id } }) : null;
  if (!batch) return NextResponse.json({ error: 'Import not found.' }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No CV was sent.' }, { status: 400 });

  // Never accept more files than the batch was started with
  const processed = await db.cvImportItem.count({ where: { batch_id: id } });
  if (processed >= batch.total_files) return NextResponse.json({ error: 'This import has already received all its files.' }, { status: 409 });

  let reviewed;
  const rawProfile = form?.get('profile');
  if (typeof rawProfile === 'string' && rawProfile) {
    try {
      reviewed = sanitiseReviewedProfile(JSON.parse(rawProfile));
    } catch {
      return NextResponse.json({ error: 'The reviewed profile couldn’t be read.' }, { status: 400 });
    }
  }

  const result = await importCvFile(
    { db, readCv, pdfText, storeCv: storeCandidateCv },
    batch,
    { name: file.name || 'cv.pdf', size: file.size, buffer: Buffer.from(await file.arrayBuffer()) },
    { reviewed },
  );
  return NextResponse.json({ result });
}
