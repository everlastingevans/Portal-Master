import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { getHireTerms } from '@/lib/hire/settings';

// Operations list of LaunchPath Hire vacancies. SUPERADMIN only.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [vacancies, owners, terms, leadCounts] = await Promise.all([
      db.vacancy.findMany({
        orderBy: { created_at: 'desc' },
        take: 1000,
        select: {
          id: true,
          created_at: true,
          status: true,
          status_changed_at: true,
          owner_id: true,
          lead_id: true,
          company_name: true,
          contact_name: true,
          contact_email: true,
          role_title: true,
          role_category: true,
          role_category_other: true,
          location: true,
          _count: { select: { shortlists: true, interview_requests: true } },
          placements: { select: { placement_fee: true, invoice_status: true } },
        },
      }),
      db.user.findMany({ where: { role: 'SUPERADMIN' }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
      getHireTerms(),
      db.vacancy.groupBy({ by: ['lead_id'], _count: { _all: true } }),
    ]);
    const perLead = new Map<number, number>(leadCounts.map((l: any) => [l.lead_id, l._count._all]));

    return NextResponse.json({
      vacancies: vacancies.map((v: any) => ({ ...v, employer_vacancy_count: perLead.get(v.lead_id) ?? 1 })),
      owners,
      terms,
    });
  } catch (error) {
    console.error('[Superadmin vacancies] list failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load vacancies.' }, { status: 500 });
  }
}
