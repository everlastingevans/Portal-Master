import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { looksLikeSpam } from '@/lib/hire/vacancy';
import { parseProgrammeEnquiry } from '@/lib/hire/programmes';
import { renderOpsProgrammeEnquiry, OPS_EMAIL } from '@/lib/hire/emails';
import { sendOnceSafely } from '@/lib/hire/email-ledger';

// Public "Talk to LaunchPath" bulk hiring enquiry. No checkout. Disabled unless FEATURE_BULK_ENQUIRY_PUBLIC.
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  if (!isFeatureEnabled('BULK_ENQUIRY_PUBLIC')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'We couldn’t read your enquiry. Please try again.' }, { status: 400 });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => t > now - WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > 5) return NextResponse.json({ error: 'Too many submissions. Please wait a few minutes.' }, { status: 429 });
  if (looksLikeSpam(body)) return NextResponse.json({ error: 'We couldn’t submit your enquiry. Please review the form and try again.' }, { status: 400 });

  const parsed = parseProgrammeEnquiry(body);
  if (!parsed.ok) return NextResponse.json({ error: 'Please check the highlighted fields.', errors: parsed.errors }, { status: 400 });
  const d = parsed.data;

  try {
    const existing = await db.bulkProgramme.findUnique({ where: { submission_key: d.submissionKey }, select: { id: true } });
    if (existing) return NextResponse.json({ success: true, duplicate: true });
    const programme = await db.bulkProgramme.create({
      data: {
        source: 'ENQUIRY_FORM',
        submission_key: d.submissionKey,
        company_name: d.companyName,
        contact_name: d.contactName,
        contact_email: d.workEmail,
        contact_phone: d.phone,
        name: `${d.companyName}: ${d.targetHires} hires`,
        requirements: d.requirements,
        role_categories: d.categories,
        locations: d.locations,
        target_hires: d.targetHires,
        start_by: d.start,
      },
    });
    await sendOnceSafely(db, {
      dedupeKey: `ops_programme_enquiry:${programme.id}`,
      template: 'ops_programme_enquiry',
      to: OPS_EMAIL(),
      email: renderOpsProgrammeEnquiry({ id: programme.id, ...d }),
    });
    return NextResponse.json({ success: true, duplicate: false }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ success: true, duplicate: true });
    console.error('[Programme enquiry] failed:', error?.message);
    return NextResponse.json({ error: 'Something went wrong and your enquiry was not sent. Please try again.' }, { status: 500 });
  }
}
