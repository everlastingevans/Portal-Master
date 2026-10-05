import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { computeHireMetrics } from '@/lib/hire/metrics';
import { computeBreakdowns } from '@/lib/hire/breakdowns';

const WINDOWS = [30, 90, 180, 365];

// LaunchPath Hire funnel report from real records. SUPERADMIN only.
export async function GET(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = new URL(req.url).searchParams.get('days');
  const windowDays = raw === 'all' ? null : WINDOWS.includes(Number(raw)) ? Number(raw) : 90;

  try {
    const [vacancies, shortlists, interviewRequests, entries, placements] = await Promise.all([
      db.vacancy.findMany({
        select: { id: true, created_at: true, status: true, lead_id: true, role_category: true, company_name: true, company_id: true, company: { select: { name: true } } },
      }),
      db.shortlist.findMany({ select: { vacancy_id: true, sent_at: true } }),
      db.interviewRequest.findMany({ where: { status: { not: 'CANCELLED' } }, select: { vacancy_id: true, created_at: true } }),
      db.shortlistCandidate.findMany({
        where: { offer_made_at: { not: null } },
        select: { offer_status: true, offer_made_at: true, offer_responded_at: true, shortlist: { select: { vacancy_id: true } } },
      }),
      db.placement.findMany({
        select: {
          vacancy_id: true,
          start_date: true,
          created_at: true,
          placement_fee: true,
          invoice_status: true,
          invoiced_at: true,
          paid_at: true,
          commercial_model: true,
          check_30_outcome: true,
          check_60_outcome: true,
          check_90_outcome: true,
        },
      }),
    ]);

    const metrics = computeHireMetrics(
      {
        vacancies,
        shortlists,
        interviewRequests,
        entries: entries.map((e) => ({ vacancy_id: e.shortlist.vacancy_id, offer_status: e.offer_status, offer_made_at: e.offer_made_at, offer_responded_at: e.offer_responded_at })),
        placements,
      },
      { windowDays },
    );
    const billingEvents = await db.billingEvent.findMany({ select: { provider: true, outcome: true, payment_status: true, amount_cents: true, received_at: true } });
    const breakdowns = computeBreakdowns(
      {
        vacancies: vacancies.map((v: any) => ({ ...v, lead_name: v.company_name, company_name: v.company?.name ?? null })),
        shortlists,
        interviewRequests,
        entries: entries.map((e) => ({ vacancy_id: e.shortlist.vacancy_id, offer_status: e.offer_status, offer_made_at: e.offer_made_at, offer_responded_at: e.offer_responded_at })),
        placements,
        billingEvents,
      },
      { windowDays },
    );
    return NextResponse.json({ metrics, breakdowns, windows: WINDOWS });
  } catch (error) {
    console.error('[Hire metrics] failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not calculate the report.' }, { status: 500 });
  }
}
