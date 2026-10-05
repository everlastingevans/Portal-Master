import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { featureStatus, isFeatureEnabled } from '@/lib/features';
import { getHireTerms } from '@/lib/hire/settings';
import { runAccountAction } from '@/lib/hire/accounts';
import { currentPlanVersion } from '@/lib/hire/partner';

// Companies, memberships and Hiring Partner plans/subscriptions. SUPERADMIN only.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const partner = isFeatureEnabled('HIRING_PARTNER');
    const [companies, admins, plans, subscriptions] = await Promise.all([
      db.company.findMany({
        orderBy: { name: 'asc' },
        include: { members: { orderBy: { created_at: 'asc' } }, _count: { select: { vacancies: true, programmes: true } } },
      }),
      db.user.findMany({ where: { role: 'SUPERADMIN' }, select: { id: true, name: true, email: true } }),
      partner ? db.partnerPlanVersion.findMany({ orderBy: { effective_from: 'desc' } }) : Promise.resolve([]),
      partner
        ? db.partnerSubscription.findMany({
            orderBy: { created_at: 'desc' },
            include: {
              company: { select: { id: true, name: true } },
              billing_events: { orderBy: { received_at: 'desc' }, take: 20 },
              vacancies: { where: { commercial_model: 'PARTNER' }, select: { id: true, role_title: true, status: true } },
            },
          })
        : Promise.resolve([]),
    ]);
    const memberIds = Array.from(new Set(companies.flatMap((c: any) => c.members.map((m: any) => m.user_id))));
    const memberUsers = memberIds.length ? await db.user.findMany({ where: { id: { in: memberIds } }, select: { id: true, name: true, email: true, role: true } }) : [];

    return NextResponse.json({
      features: featureStatus().filter((f) => ['HIRING_PARTNER', 'PARTNER_BILLING_SANDBOX', 'EMPLOYER_DASHBOARD'].includes(f.key)),
      companies,
      memberUsers,
      admins,
      plans,
      currentPlanId: currentPlanVersion(plans as any[])?.id ?? null,
      subscriptions,
      terms: await getHireTerms(),
    });
  } catch (error) {
    console.error('[Partner admin] load failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'An action is required.' }, { status: 400 });
  try {
    const res = await runAccountAction(db, body.action, body.payload && typeof body.payload === 'object' ? body.payload : {}, {
      actorId: auth.session?.userId ?? null,
      terms: await getHireTerms(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin,
    });
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    console.error(`[Partner admin] ${body.action} failed:`, (error as Error).message);
    return NextResponse.json({ error: 'Something went wrong. Nothing was changed.' }, { status: 500 });
  }
}
