import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { readCv } from '@/lib/cv-import/extract';
import { CvReadError, MAX_CV_BYTES, profileFromExtraction } from '@/lib/cv-import/profile';

export const maxDuration = 60;

/**
 * POST /api/superadmin/cv-import/analyse (multipart: file)
 * Reads one CV with AI and returns a draft profile for staff to review. Saves nothing.
 */
export async function POST(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a CV to analyse.' }, { status: 400 });
  if (file.size > MAX_CV_BYTES) return NextResponse.json({ error: `This file is over ${MAX_CV_BYTES / 1024 / 1024} MB.` }, { status: 413 });

  try {
    const reading = await readCv(Buffer.from(await file.arrayBuffer()));
    const profile = profileFromExtraction(reading.extraction);
    const existing = profile.email
      ? await db.user.findUnique({ where: { email: profile.email }, select: { id: true, name: true, role: true } })
      : null;
    return NextResponse.json({
      profile,
      hasText: reading.text.length > 0,
      existing: existing ? { id: existing.id, name: existing.name, isCandidate: existing.role === 'CANDIDATE' } : null,
    });
  } catch (error) {
    if (error instanceof CvReadError) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error('[CV import] analyse failed:', (error as Error).message);
    return NextResponse.json({ error: 'This CV couldn’t be analysed. Try again.' }, { status: 500 });
  }
}
