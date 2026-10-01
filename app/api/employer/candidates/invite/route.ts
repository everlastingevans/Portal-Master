import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import db from '@/lib/db';
import { checkRole } from '@/lib/auth';
import { sendEmail } from '@/lib/notifications';

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * POST /api/employer/candidates/invite  { candidateId, jobId }
 * Invites a talent-pool candidate to apply to one of the employer's live (paid) roles.
 */
export async function POST(req: Request) {
  const auth = await checkRole(['EMPLOYER', 'CLIENT']);
  if (!auth.authorized || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const employerId = auth.session.userId;

  try {
    const { candidateId, jobId } = await req.json();
    const cid = Number(candidateId);
    const jid = Number(jobId);
    if (!cid || !jid) {
      return NextResponse.json({ error: 'Choose a candidate and a role.' }, { status: 400 });
    }

    const [job, candidate, employer] = await Promise.all([
      db.job.findUnique({ where: { id: jid }, select: { id: true, title: true, company: true, location: true, status: true, employer_id: true } }),
      db.user.findUnique({ where: { id: cid }, select: { id: true, name: true, email: true, role: true } }),
      db.user.findUnique({ where: { id: employerId }, select: { name: true } }),
    ]);

    if (!job || job.employer_id !== employerId) {
      return NextResponse.json({ error: 'That role was not found.' }, { status: 404 });
    }
    if (job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only live roles can receive invitations. Publish the role first.' }, { status: 403 });
    }
    if (!candidate || candidate.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'That candidate was not found.' }, { status: 404 });
    }

    const alreadyApplied = await db.jobApplication.findUnique({
      where: { candidate_id_job_id: { candidate_id: cid, job_id: jid } },
      select: { id: true },
    });
    if (alreadyApplied) {
      return NextResponse.json({ error: `${candidate.name || 'This candidate'} has already applied to this role.` }, { status: 409 });
    }

    try {
      await db.jobInvitation.create({ data: { job_id: jid, candidate_id: cid, employer_id: employerId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return NextResponse.json({ error: 'You’ve already invited this candidate to this role.' }, { status: 409 });
      }
      throw err;
    }

    const company = job.company || employer?.name || 'An employer';
    await db.notification.create({
      data: {
        user_id: cid,
        type: 'INVITE',
        title: `${company} invited you to apply`,
        content: `You’ve been invited to apply for ${job.title}${job.location ? ` (${job.location})` : ''}. Find it under Browse jobs and apply if it’s a fit.`,
      },
    });

    // Email is best-effort: the in-app notification is the source of truth
    if (candidate.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      sendEmail({
        to: candidate.email,
        subject: `${company} invited you to apply for ${job.title}`,
        text: `Hi ${candidate.name || 'there'}, ${company} invited you to apply for ${job.title} on LaunchPath. Log in to view the role and apply.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background:#0A1B3D;padding:18px 24px;color:#ffffff;font-weight:bold;letter-spacing:2px;">LAUNCHPATH</div>
            <div style="padding:24px;color:#334155;font-size:15px;line-height:1.6;">
              <p>Hi ${escape(candidate.name || 'there')},</p>
              <p><strong style="color:#0A1B3D;">${escape(company)}</strong> found your profile in the LaunchPath talent pool and invited you to apply for:</p>
              <p style="font-size:18px;font-weight:bold;color:#0A1B3D;margin:16px 0 4px;">${escape(job.title)}</p>
              ${job.location ? `<p style="margin:0 0 20px;color:#64748b;">${escape(job.location)}</p>` : ''}
              <a href="${appUrl}/candidate/dashboard?tab=AllJobs" style="display:inline-block;background:#A6F23C;color:#0A1B3D;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;">View the role</a>
              <p style="margin-top:24px;font-size:12px;color:#94a3b8;">Your contact details are only shared with ${escape(company)} if you apply.</p>
            </div>
          </div>`,
      }).catch((e) => console.error('[Talent pool] invite email failed:', e));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Talent pool] invite failed:', error);
    return NextResponse.json({ error: 'Could not send the invitation.' }, { status: 500 });
  }
}
