import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { EmailService } from '@/services/integrations/email.service';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await db.job.findUnique({
      where: { id: Number(jobId) },
      include: { employer: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.employer_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this job post.' }, { status: 403 });
    }

    // Update job status to ACTIVE (role is activated only after payment)
    const updatedJob = await db.job.update({
      where: { id: Number(jobId) },
      data: { status: 'ACTIVE' }
    });

    // Send confirmation email
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { email: true }
    });
    const employerEmail = job.employer?.email || currentUser?.email;
    if (employerEmail) {
      try {
        const subject = `Payment Received & Role Activated: ${job.title} on LaunchPath`;
        const textCopy = `Your role "${job.title}" has been successfully activated on LaunchPath!\n\nWe have received your payment of R1,499 once-off.\n\nOur matching process has officially started. You can expect a curated shortlist of vetted candidates directly to your registered email within 5 working days.\n\nThank you for choosing LaunchPath.`;
        
        const htmlCopy = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #5D3FD3; margin-top: 0; font-weight: 900; letter-spacing: 0.1em; font-size: 20px;">LAUNCHPATH</h2>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">Your role has been activated!</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hi there,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Thank you for posting your vacancy on LaunchPath. We have successfully received your once-off payment of <strong>R1,499</strong> for the following role:
            </p>
            <div style="background-color: #f8fafc; padding: 18px; border-left: 4px solid #bdf500; margin: 18px 0; border-radius: 8px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
              <strong style="font-size: 16px; color: #0f172a;">${job.title}</strong><br/>
              <span style="font-size: 13px; color: #64748b;">${job.company} &bull; ${job.location}</span>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Our candidate screening and vetting pipelines have officially commenced. Our internal sourcing team is currently matching your hiring requirements with our vetted junior talent pool.
            </p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 18px 0;">
              <strong style="font-size: 13px; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">What happens next?</strong>
              <p style="font-size: 13px; line-height: 1.5; color: #14532d; margin: 0;">
                You will receive a curated shortlist of pre-screened candidate profiles delivered directly to <strong style="color: #0f172a;">${employerEmail}</strong> within <strong>5 working days</strong>. There is no need to scan through large volumes of irrelevant CVs—we deliver vetted talent straight to your inbox.
              </p>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 24px;">
              If you have any questions or would like to tweak your role criteria, please reply directly to this email or reach out to our team at support@launchpath.co.za.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
              &copy; ${new Date().getFullYear()} LaunchPath. All rights reserved. <br/>
              R1,499 flat-rate per role posted. Sourcing shortlist delivered by email.
            </p>
          </div>
        `;

        await EmailService.send(employerEmail, subject, textCopy, htmlCopy);
        console.log('[pay-simulate] Confirmation email successfully sent to', employerEmail);
      } catch (emailErr: any) {
        // Log gracefully so that missing credentials in local sandbox environments do not crash the transaction
        console.error('[pay-simulate] Email dispatch skipped or failed (likely missing SENDGRID_API_KEY):', emailErr.message);
      }
    }

    return NextResponse.json({ success: true, status: updatedJob.status });
  } catch (error: any) {
    console.error('Simulation payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
