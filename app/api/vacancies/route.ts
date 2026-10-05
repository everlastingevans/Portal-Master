import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CLOSED_STATUSES, looksLikeSpam, validateVacancyInput } from '@/lib/hire/vacancy';
import { sendVacancyEmails } from '@/lib/hire/email-ledger';

// Public endpoint for the "Find Candidates" vacancy form. No account or payment required.
// Middleware applies the global API rate limit; this adds a stricter per-IP limit for submissions.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const submissions = new Map<string, number[]>();

function rateLimited(ip: string, now = Date.now()) {
  const recent = (submissions.get(ip) || []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

const duplicateResponse = (reference?: number) =>
  NextResponse.json({ success: true, duplicate: true, reference: reference ?? null }, { status: 200 });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'We couldn’t read your submission. Please try again.' }, { status: 400 });
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please wait a few minutes and try again.' }, { status: 429 });
  }

  if (looksLikeSpam(body)) {
    return NextResponse.json({ error: 'We couldn’t submit your request. Please take a moment to review the form and try again.' }, { status: 400 });
  }

  const result = validateVacancyInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: 'Please check the highlighted fields.', errors: result.errors }, { status: 400 });
  }
  const v = result.data;

  try {
    // Same browser submission retried (double click, network retry)
    const sameKey = await db.vacancy.findUnique({ where: { submission_key: v.submissionKey }, select: { id: true } });
    if (sameKey) return duplicateResponse(sameKey.id);

    // Same contact re-submitting the same open role. Don't echo its reference: the email is unverified.
    const recent = await db.vacancy.findFirst({
      where: {
        contact_email: v.workEmail,
        role_title: { equals: v.roleTitle, mode: 'insensitive' },
        created_at: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
        status: { notIn: CLOSED_STATUSES },
      },
      select: { id: true },
    });
    if (recent) return duplicateResponse();

    // Link to an account only when the submitter is signed in as an employer. Never by email match.
    const session = await getSession().catch(() => null);
    const submittedBy = session && ['CLIENT', 'EMPLOYER'].includes(session.role) ? session.userId : null;

    const vacancy = await db.$transaction(async (tx) => {
      // First-seen lead details are kept; later anonymous submissions can't overwrite them
      const lead = await tx.employerLead.upsert({
        where: { email: v.workEmail },
        create: { email: v.workEmail, company_name: v.companyName, contact_name: v.contactName, phone: v.phone },
        update: {},
      });
      const created = await tx.vacancy.create({
        data: {
          submission_key: v.submissionKey,
          lead_id: lead.id,
          submitted_by_user_id: submittedBy,
          company_name: v.companyName,
          contact_name: v.contactName,
          contact_email: v.workEmail,
          contact_phone: v.phone,
          role_title: v.roleTitle,
          role_category: v.roleCategory,
          role_category_other: v.roleCategoryOther,
          location: v.location,
          work_arrangement: v.workArrangement,
          salary_min: v.salaryMin,
          salary_max: v.salaryMax,
          employment_type: v.employmentType,
          required_experience: v.requiredExperience,
          key_skills: v.keySkills,
          start_date: v.startDate,
          description: v.description,
          status: 'NEW_VACANCY',
        },
      });
      await tx.vacancyStatusEvent.create({ data: { vacancy_id: created.id, from_status: null, to_status: 'NEW_VACANCY', actor_id: submittedBy } });
      return created;
    });

    // Notifications never fail the submission; the vacancy is already saved and visible in admin.
    // Each email is recorded in the send-once ledger, so staff can retry failures without duplicates.
    const emails = await sendVacancyEmails(db, vacancy.id).catch(() => ({ confirmation: 'FAILED', ops: 'FAILED' }));

    return NextResponse.json(
      { success: true, duplicate: false, reference: vacancy.id, confirmationEmailSent: emails.confirmation === 'SENT' },
      { status: 201 },
    );
  } catch (error: any) {
    // Unique-key race between two identical requests: the other one won
    if (error?.code === 'P2002') {
      const existing = await db.vacancy.findUnique({ where: { submission_key: v.submissionKey }, select: { id: true } }).catch(() => null);
      if (existing) return duplicateResponse(existing.id);
    }
    console.error('[Vacancies] Submission failed:', error);
    return NextResponse.json({ error: 'Something went wrong on our side and your vacancy was not submitted. Please try again.' }, { status: 500 });
  }
}
