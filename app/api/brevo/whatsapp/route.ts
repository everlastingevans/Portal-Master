import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkRole } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/notifications';
import { normalizeSaMobile, waMeLink } from '@/lib/phone';
import { getOutreachTemplate, OUTREACH_TEMPLATES } from '@/lib/whatsapp-templates';

const DAILY_LIMIT = 5; // outreach messages per application per 24h
const SAME_TEMPLATE_COOLDOWN_MS = 12 * 60 * 60 * 1000;

async function authorise() {
  const auth = await checkRole(['EMPLOYER', 'CLIENT']);
  if (!auth.authorized || !auth.session) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  return { session: auth.session };
}

/** GET → whether API sending is available, so the UI can lead with the right option. */
export async function GET() {
  const { error } = await authorise();
  if (error) return error;
  return NextResponse.json({
    configured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_WHATSAPP_SENDER_NUMBER),
    approvedTemplates: OUTREACH_TEMPLATES.filter((t) => process.env[t.brevoTemplateEnv]).map((t) => t.id),
  });
}

/**
 * POST /api/brevo/whatsapp  { applicationId, templateId, proposedTime?, mode: 'api' | 'direct' }
 * mode "api" sends via Brevo; mode "direct" only logs that the recruiter opened a wa.me chat.
 * Message text is always built server-side from the template.
 */
export async function POST(req: Request) {
  const { session, error } = await authorise();
  if (error) return error;
  const isAdmin = session.realRole === 'SUPERADMIN';

  try {
    const { applicationId, templateId, proposedTime, mode = 'api' } = await req.json();
    const template = getOutreachTemplate(String(templateId));
    if (!template) return NextResponse.json({ error: 'Choose a message template.' }, { status: 400 });
    if (!['api', 'direct', 'preview'].includes(mode)) return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });

    let proposedIso: string | null = null;
    if (template.id === 'INTERVIEW_INVITE' && proposedTime) {
      const d = new Date(proposedTime);
      if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Pick an interview time in the future.' }, { status: 400 });
      }
      proposedIso = d.toISOString();
    }

    const application = await db.jobApplication.findUnique({
      where: { id: Number(applicationId) },
      select: {
        id: true,
        job: { select: { title: true, company: true, status: true, employer_id: true } },
        candidate: { select: { name: true, phone: true } },
      },
    });
    if (!application || (!isAdmin && application.job.employer_id !== session.userId)) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    // Contact details are only unlocked on paid (live) roles
    if (!isAdmin && application.job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Publish this role to contact its applicants.' }, { status: 403 });
    }

    const phone = normalizeSaMobile(application.candidate.phone);
    if (!phone) {
      return NextResponse.json({ error: 'This candidate doesn’t have a valid South African mobile number.' }, { status: 422 });
    }

    const recruiter = await db.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    const text = template.build({
      candidateName: application.candidate.name || 'there',
      jobTitle: application.job.title,
      company: application.job.company || recruiter?.name || 'our team',
      recruiterName: recruiter?.name,
      proposedTime: proposedIso,
    });
    const waLink = waMeLink(phone, text);

    // Preview: show the exact message (and fallback link) without sending or logging anything
    if (mode === 'preview') return NextResponse.json({ text, waLink });

    const recent = await db.applicationActivity.findMany({
      where: {
        application_id: application.id,
        type: { in: ['WHATSAPP_SENT', 'WHATSAPP_DIRECT'] },
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { created_at: true, metadata: true },
    });
    if (recent.length >= DAILY_LIMIT) {
      return NextResponse.json({ error: `You’ve messaged this candidate ${DAILY_LIMIT} times today. Give them time to reply.` }, { status: 429 });
    }

    const log =(type: string, summary: string, meta: Record<string, unknown> = {}) =>
      db.applicationActivity.create({
        data: {
          application_id: application.id,
          actor_id: session.userId,
          type,
          channel: 'whatsapp',
          summary,
          metadata: JSON.stringify({ template: template.id, proposedTime: proposedIso, ...meta }),
        },
        select: { id: true, type: true, channel: true, summary: true, created_at: true, actor: { select: { name: true } } },
      });

    if (mode === 'direct') {
      const activity = await log('WHATSAPP_DIRECT', `Opened WhatsApp chat: ${template.label}`);
      return NextResponse.json({ success: true, mode, waLink, activity });
    }

    const sentRecently = recent.some((r) => {
      try {
        return JSON.parse(r.metadata || '{}').template === template.id && Date.now() - r.created_at.getTime() < SAME_TEMPLATE_COOLDOWN_MS;
      } catch {
        return false;
      }
    });
    if (sentRecently) {
      return NextResponse.json({ error: 'You already sent this message recently. Try a different template or wait for a reply.' }, { status: 409 });
    }

    const approvedId = Number(process.env[template.brevoTemplateEnv]) || undefined;
    const result = await sendWhatsAppMessage({ to: phone, text, templateId: approvedId });

    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        NOT_CONFIGURED: 'WhatsApp sending isn’t set up for your account yet.',
        CREDITS_EXHAUSTED: 'Your WhatsApp message credits have run out.',
        REJECTED: 'WhatsApp didn’t accept this message. The candidate may need to message you first.',
        NETWORK: 'We couldn’t reach WhatsApp just now.',
      };
      if (result.reason !== 'NOT_CONFIGURED') {
        await log('WHATSAPP_FAILED', `WhatsApp not delivered: ${template.label}`, { reason: result.reason, status: result.status });
      }
      return NextResponse.json(
        { error: messages[result.reason], code: result.reason, fallback: { waLink } },
        { status: result.reason === 'CREDITS_EXHAUSTED' ? 402 : result.reason === 'NOT_CONFIGURED' ? 503 : 502 },
      );
    }

    const activity = await log('WHATSAPP_SENT', `WhatsApp sent: ${template.label}`, { messageId: result.messageId, approvedTemplate: Boolean(approvedId) });
    return NextResponse.json({ success: true, mode, activity });
  } catch (err) {
    console.error('[WhatsApp outreach] failed:', err);
    return NextResponse.json({ error: 'Could not send the message.' }, { status: 500 });
  }
}
