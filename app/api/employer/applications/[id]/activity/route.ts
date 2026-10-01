import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkRole } from '@/lib/auth';

/** GET /api/employer/applications/:id/activity → the application's history, newest first. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['EMPLOYER', 'CLIENT']);
  if (!auth.authorized || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const application = await db.jobApplication.findUnique({
    where: { id: Number(params.id) },
    select: { job: { select: { employer_id: true } } },
  });
  if (!application || (auth.session.realRole !== 'SUPERADMIN' && application.job.employer_id !== auth.session.userId)) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  const activities = await db.applicationActivity.findMany({
    where: { application_id: Number(params.id) },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: { id: true, type: true, channel: true, summary: true, created_at: true, actor: { select: { name: true } } },
  });
  return NextResponse.json({ activities });
}
