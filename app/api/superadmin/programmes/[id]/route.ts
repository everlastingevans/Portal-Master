import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { findTierOverlaps, suggestTiers, summariseProgramme } from '@/lib/hire/programmes';
import { getProgrammeTiers } from '@/lib/hire/programme-admin';

// One programme: requirements, agreed-terms history, linked vacancies, candidates and placements.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isFeatureEnabled('BULK_PROGRAMMES')) return NextResponse.json({ error: 'Bulk programmes are not enabled.' }, { status: 404 });

  const id = Number(params.id);
  try {
    const programme = await db.bulkProgramme.findUnique({
      where: { id: Number.isInteger(id) ? id : -1 },
      include: {
        company: { select: { id: true, name: true } },
        terms: { orderBy: [{ agreed_on: 'desc' }, { id: 'desc' }] },
        vacancies: {
          select: {
            id: true,
            role_title: true,
            status: true,
            location: true,
            shortlists: { select: { candidates: { select: { id: true } } } },
            placements: { select: { id: true, candidate_name: true, start_date: true, placement_fee: true, invoice_status: true, programme_terms_id: true, fee_basis: true } },
          },
        },
      },
    });
    if (!programme) return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    const [tiers, emails, companies, admins, candidateVacancies] = await Promise.all([
      getProgrammeTiers(),
      db.emailLog.findMany({ where: { dedupe_key: `ops_programme_enquiry:${programme.id}` }, select: { status: true, last_error: true, sent_at: true } }),
      db.company.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.user.findMany({ where: { role: 'SUPERADMIN' }, select: { id: true, name: true, email: true } }),
      // Standard vacancies that could be linked (staff then link them from the vacancy page)
      db.vacancy.findMany({ where: { commercial_model: 'STANDARD', status: { notIn: ['CLOSED_NO_HIRE', 'CLOSED_EMPLOYER', 'CLOSED_LAUNCHPATH'] } }, select: { id: true, role_title: true, company_name: true }, orderBy: { created_at: 'desc' }, take: 50 }),
    ]);
    return NextResponse.json({
      programme,
      summary: summariseProgramme(programme),
      tiers,
      overlaps: findTierOverlaps(tiers),
      tierSuggestion: suggestTiers(programme.target_hires, tiers),
      enquiryEmail: emails[0] ?? null,
      companies,
      admins,
      candidateVacancies,
    });
  } catch (error) {
    console.error('[Programme] detail failed:', (error as Error).message);
    return NextResponse.json({ error: 'Could not load the programme.' }, { status: 500 });
  }
}
