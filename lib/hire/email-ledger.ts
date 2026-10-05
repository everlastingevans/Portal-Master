import { isEmailConfigured, sendEmail } from '@/lib/notifications';
import {
  OPS_EMAIL,
  RenderedEmail,
  renderEmployerVacancyConfirmation,
  renderOpsInterviewRequest,
  renderOpsNewVacancy,
} from './emails';

/**
 * Send-once email ledger. Each logical notification has a dedupe key (e.g. "vacancy_confirmation:12").
 * A SENT row is never sent again; FAILED / NOT_CONFIGURED rows can be retried. A row is claimed with an
 * optimistic update before sending, so two concurrent retries can't both deliver.
 */
export type EmailOutcome = 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'ALREADY_SENT' | 'IN_PROGRESS';

const STALE_SENDING_MS = 5 * 60 * 1000;

export async function sendOnce(
  db: any,
  opts: { dedupeKey: string; template: string; to: string; vacancyId?: number | null; email: RenderedEmail },
): Promise<{ outcome: EmailOutcome; logId: number }> {
  const row = await db.emailLog.upsert({
    where: { dedupe_key: opts.dedupeKey },
    create: { dedupe_key: opts.dedupeKey, template: opts.template, to_email: opts.to, subject: opts.email.subject, vacancy_id: opts.vacancyId ?? null },
    update: {},
  });

  if (row.status === 'SENT') return { outcome: 'ALREADY_SENT', logId: row.id };
  if (row.status === 'SENDING' && Date.now() - new Date(row.updated_at).getTime() < STALE_SENDING_MS) {
    return { outcome: 'IN_PROGRESS', logId: row.id };
  }

  if (!isEmailConfigured()) {
    await db.emailLog.update({ where: { id: row.id }, data: { status: 'NOT_CONFIGURED', last_error: 'Email provider is not configured (BREVO_API_KEY missing).' } });
    return { outcome: 'NOT_CONFIGURED', logId: row.id };
  }

  const claim = await db.emailLog.updateMany({
    where: { id: row.id, attempts: row.attempts, status: { not: 'SENT' } },
    data: { status: 'SENDING', attempts: { increment: 1 } },
  });
  if (claim.count !== 1) return { outcome: 'IN_PROGRESS', logId: row.id };

  let ok = false;
  let error: string | null = null;
  try {
    ok = await sendEmail({ to: row.to_email, subject: opts.email.subject, html: opts.email.html, text: opts.email.text });
    if (!ok) error = 'The email provider rejected or could not accept the message.';
  } catch (e: any) {
    error = String(e?.message || e).slice(0, 500);
  }

  await db.emailLog.update({
    where: { id: row.id },
    data: ok ? { status: 'SENT', sent_at: new Date(), last_error: null } : { status: 'FAILED', last_error: error },
  });
  return { outcome: ok ? 'SENT' : 'FAILED', logId: row.id };
}

/** Never let a notification problem fail the business action that triggered it. */
export async function sendOnceSafely(db: any, opts: Parameters<typeof sendOnce>[1]): Promise<EmailOutcome> {
  try {
    return (await sendOnce(db, opts)).outcome;
  } catch (e) {
    console.error(`[Email] ${opts.template} could not be recorded or sent:`, (e as Error).message);
    return 'FAILED';
  }
}

const VACANCY_EMAIL_SELECT = {
  id: true,
  company_name: true,
  contact_name: true,
  contact_email: true,
  contact_phone: true,
  role_title: true,
  role_category: true,
  role_category_other: true,
  location: true,
  work_arrangement: true,
  salary_min: true,
  salary_max: true,
  employment_type: true,
  required_experience: true,
  key_skills: true,
  start_date: true,
  description: true,
};

/** Emails sent when a vacancy is submitted. */
export async function sendVacancyEmails(db: any, vacancyId: number) {
  const v = await db.vacancy.findUnique({ where: { id: vacancyId }, select: VACANCY_EMAIL_SELECT });
  if (!v) return { confirmation: 'FAILED' as EmailOutcome, ops: 'FAILED' as EmailOutcome };
  const [ops, confirmation] = await Promise.all([
    sendOnceSafely(db, { dedupeKey: `ops_new_vacancy:${v.id}`, template: 'ops_new_vacancy', to: OPS_EMAIL(), vacancyId: v.id, email: renderOpsNewVacancy(v) }),
    sendOnceSafely(db, { dedupeKey: `vacancy_confirmation:${v.id}`, template: 'vacancy_confirmation', to: v.contact_email, vacancyId: v.id, email: renderEmployerVacancyConfirmation(v) }),
  ]);
  return { confirmation, ops };
}

/** Ops alert for an interview request. */
export async function sendInterviewRequestEmail(db: any, requestId: number) {
  const r = await db.interviewRequest.findUnique({
    where: { id: requestId },
    include: { vacancy: { select: { id: true, role_title: true, company_name: true } }, shortlist_candidate: { select: { display_name: true } } },
  });
  if (!r) return 'FAILED' as EmailOutcome;
  return sendOnceSafely(db, {
    dedupeKey: `ops_interview_request:${r.id}`,
    template: 'ops_interview_request',
    to: OPS_EMAIL(),
    vacancyId: r.vacancy_id,
    email: renderOpsInterviewRequest({
      requestId: r.id,
      vacancyId: r.vacancy_id,
      roleTitle: r.vacancy.role_title,
      companyName: r.vacancy.company_name,
      candidateName: r.shortlist_candidate.display_name,
      source: r.source,
      requesterName: r.requester_name,
      preferredTimes: r.preferred_times,
      message: r.message,
    }),
  });
}

/**
 * Staff retry of a failed or unsent email. Re-renders from current records. Shortlist emails carry a
 * one-time token that is not stored, so they can't be re-rendered: send a new link instead.
 */
export async function retryEmailLog(db: any, logId: number, vacancyId: number): Promise<{ ok: boolean; outcome?: EmailOutcome; error?: string }> {
  const row = await db.emailLog.findUnique({ where: { id: logId } });
  if (!row || row.vacancy_id !== vacancyId) return { ok: false, error: 'Email not found for this vacancy.' };
  if (row.status === 'SENT') return { ok: true, outcome: 'ALREADY_SENT' };

  const [template, id] = String(row.dedupe_key).split(':');
  if (template === 'vacancy_confirmation' || template === 'ops_new_vacancy') {
    const v = await db.vacancy.findUnique({ where: { id: Number(id) }, select: VACANCY_EMAIL_SELECT });
    if (!v) return { ok: false, error: 'Vacancy not found.' };
    const email = template === 'ops_new_vacancy' ? renderOpsNewVacancy(v) : renderEmployerVacancyConfirmation(v);
    const res = await sendOnce(db, { dedupeKey: row.dedupe_key, template, to: row.to_email, vacancyId, email });
    return { ok: res.outcome === 'SENT', outcome: res.outcome };
  }
  if (template === 'ops_interview_request') {
    const outcome = await sendInterviewRequestEmail(db, Number(id));
    return { ok: outcome === 'SENT', outcome };
  }
  return { ok: false, error: 'This email contained a one-time shortlist link. Send a new link to the employer instead.' };
}
