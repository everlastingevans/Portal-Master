import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { employerRequestInterview, employerSubmitFeedback, loadEmployerDashboard } from '@/lib/hire/employer-access';
import { findEntryForEmployer } from '@/lib/hire/employer-access';
import { presignCvUrl } from '@/lib/hire/cv';

// Employer hiring dashboard (feature-flagged). Every query is scoped to the signed-in user's
// explicitly granted company memberships.
async function employer() {
  if (!isFeatureEnabled('EMPLOYER_DASHBOARD')) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!['CLIENT', 'EMPLOYER'].includes(session.role)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { userId: session.userId };
}

const noStore = (res: NextResponse) => {
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
};

export async function GET() {
  const e = await employer();
  if ('error' in e) return e.error;
  try {
    return noStore(NextResponse.json(await loadEmployerDashboard(db, e.userId)));
  } catch (error) {
    console.error('[Employer dashboard] load failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load your vacancies.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const e = await employer();
  if ('error' in e) return e.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'An action is required.' }, { status: 400 });
  try {
    if (body.action === 'REQUEST_INTERVIEW') {
      const r = await employerRequestInterview(db, e.userId, body);
      return noStore(NextResponse.json(r.body, { status: r.status }));
    }
    if (body.action === 'FEEDBACK') {
      const r = await employerSubmitFeedback(db, e.userId, body);
      return noStore(NextResponse.json(r.body, { status: r.status }));
    }
    if (body.action === 'CV') {
      const entry = await findEntryForEmployer(db, e.userId, body.shortlistCandidateId);
      if (!entry || (!entry.cv_s3_key && !entry.cv_external_url)) return NextResponse.json({ error: 'No CV is available for this candidate.' }, { status: 404 });
      const url = entry.cv_s3_key ? await presignCvUrl(entry.cv_s3_key, entry.display_name) : entry.cv_external_url;
      return noStore(NextResponse.json({ url }));
    }
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error(`[Employer dashboard] ${body.action} failed:`, (error as Error).message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
