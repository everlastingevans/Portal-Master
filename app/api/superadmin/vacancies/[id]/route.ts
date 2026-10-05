import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { getHireTerms } from '@/lib/hire/settings';
import { runVacancyAction } from '@/lib/hire/ops';
import { isFeatureEnabled } from '@/lib/features';

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Full operations view of one vacancy. SUPERADMIN only.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid vacancy id.' }, { status: 400 });

  try {
    const vacancy = await db.vacancy.findUnique({
      where: { id },
      include: {
        events: { orderBy: { created_at: 'desc' } },
        hire_events: { orderBy: { occurred_at: 'desc' } },
        shortlists: {
          orderBy: { created_at: 'asc' },
          include: {
            candidates: {
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
              include: { interview_requests: { orderBy: { created_at: 'desc' } }, placement: { select: { id: true } }, employer_feedback_entries: { orderBy: { updated_at: 'desc' } } },
            },
            // Never return token hashes
            links: { orderBy: { created_at: 'desc' }, select: { id: true, created_at: true, expires_at: true, revoked_at: true, view_count: true, last_viewed_at: true } },
          },
        },
        placements: { orderBy: { created_at: 'asc' } },
        company: { select: { id: true, name: true } },
        partner_subscription: { select: { id: true, status: true, vacancy_limit: true, success_fee_bps: true, fee_rule: true, entitlements: true, company_id: true } },
        programme: { select: { id: true, name: true, status: true } },
      },
    });
    if (!vacancy) return NextResponse.json({ error: 'Vacancy not found.' }, { status: 404 });

    const [owners, terms, emails, otherVacancies, account] = await Promise.all([
      db.user.findMany({ where: { role: 'SUPERADMIN' }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
      getHireTerms(),
      db.emailLog.findMany({
        where: { vacancy_id: id },
        orderBy: { created_at: 'desc' },
        select: { id: true, template: true, to_email: true, subject: true, status: true, attempts: true, last_error: true, sent_at: true, created_at: true },
      }),
      db.vacancy.findMany({ where: { lead_id: vacancy.lead_id, id: { not: id } }, select: { id: true, role_title: true, status: true, created_at: true }, orderBy: { created_at: 'desc' } }),
      db.user.findFirst({ where: { email: { equals: vacancy.contact_email, mode: 'insensitive' }, role: { in: ['CLIENT', 'EMPLOYER'] } }, select: { id: true } }),
    ]);

    // Commercial context for staff selectors (Phase 3, feature-flagged)
    const [companies, subscriptions, programmes] = await Promise.all([
      db.company.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      isFeatureEnabled('HIRING_PARTNER') && vacancy.company_id
        ? db.partnerSubscription.findMany({ where: { company_id: vacancy.company_id }, select: { id: true, status: true, vacancy_limit: true } })
        : Promise.resolve([]),
      isFeatureEnabled('BULK_PROGRAMMES')
        ? db.bulkProgramme.findMany({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }, select: { id: true, name: true, company_id: true } })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      vacancy,
      owners,
      terms,
      emails,
      otherVacancies,
      emailMatchesAccount: Boolean(account),
      companies,
      subscriptions,
      programmes,
      features: { partner: isFeatureEnabled('HIRING_PARTNER'), programmes: isFeatureEnabled('BULK_PROGRAMMES'), suggestions: isFeatureEnabled('MATCH_SUGGESTIONS') },
    });
  } catch (error) {
    console.error(`[Superadmin vacancies] detail ${id} failed:`, (error as Error).message);
    return NextResponse.json({ error: 'Could not load the vacancy.' }, { status: 500 });
  }
}

// All operations changes to a vacancy and its shortlists, interviews, offers and placements.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid vacancy id.' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'An action is required.' }, { status: 400 });

  try {
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const result = await runVacancyAction(db, id, body.action, payload, { actorId: auth.session?.userId ?? null, terms: await getHireTerms() });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(`[Superadmin vacancies] ${body.action} on ${id} failed:`, (error as Error).message);
    return NextResponse.json({ error: 'Something went wrong. Your change was not saved.' }, { status: 500 });
  }
}
