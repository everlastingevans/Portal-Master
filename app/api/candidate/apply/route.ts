import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/apiMiddleware';

async function applyHandler(req: Request, context: any, session: any) {
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  // Ensure it doesn't already exist to avoid unique constraint violations
  const existing = await db.jobApplication.findUnique({
    where: {
      candidate_id_job_id: {
        candidate_id: session.userId,
        job_id: jobId
      }
    }
  });

  if (existing) {
    return NextResponse.json({ error: 'Already applied' }, { status: 400 });
  }

  const application = await db.jobApplication.create({
    data: {
      candidate_id: session.userId,
      job_id: jobId
    }
  });

  const candidate = await db.user.findUnique({
    where: { id: session.userId }
  });

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      employer: true
    }
  });

  const jobTitle = job?.title || 'Job Post';
  const companyName = job?.company || 'Employer';
  const candidateName = candidate?.name || 'Candidate';
  const candidateEmail = candidate?.email;

  // Create inbox acknowledgement notification
  await db.notification.create({
    data: {
      user_id: session.userId,
      title: `Application Acknowledgment: ${jobTitle}`,
      content: `Hi there! This is a confirmation that your job application for "${jobTitle}" at ${companyName} has been successfully submitted. We will keep you updated if the employer decides to invite you to an interview. Good luck!`,
      type: 'APPLICATION'
    }
  });

  // Import notifications dispatcher
  const { sendEmail } = require('@/lib/notifications');

  // 1. Send confirmation email to candidate
  if (candidateEmail) {
    try {
      await sendEmail({
        to: candidateEmail,
        subject: `Application Confirmation: ${jobTitle} at ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #5D3FD3; margin-top: 0;">Application Confirmed!</h2>
            <p>Dear <strong>${candidateName}</strong>,</p>
            <p>Thank you for applying for the <strong>${jobTitle}</strong> role at <strong>${companyName}</strong> via the LaunchPath Portal.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5D3FD3;">
              <p style="margin: 0; font-weight: bold; color: #334155;">Application Details:</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Job:</strong> ${jobTitle}</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Location:</strong> ${job?.location || 'Not Specified'}</p>
            </div>
            <p>We have successfully added this application to your portal inbox. The hiring team has been notified and will review your profile shortly.</p>
            <p>You can track the progress of your application on your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za'}/candidate/dashboard?tab=Applications" style="color: #5D3FD3; font-weight: bold; text-decoration: none;">LaunchPath Dashboard</a>.</p>
            <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">Best regards,<br/>The LaunchPath Onboarding Team</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending application email to candidate:', emailErr);
    }
  }

  // 2. Send notification email to employer
  if (job?.employer?.email) {
    try {
      const employerEmail = job.employer.email;
      const employerName = job.employer.name || 'Employer';
      await sendEmail({
        to: employerEmail,
        subject: `New Application: ${candidateName} applied for ${jobTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #5D3FD3; margin-top: 0;">New Application Received</h2>
            <p>Dear <strong>${employerName}</strong>,</p>
            <p>Great news! A new candidate has applied for your job opening: <strong>${jobTitle}</strong>.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5D3FD3;">
              <p style="margin: 0; font-weight: bold; color: #334155;">Applicant Summary:</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Name:</strong> ${candidateName}</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Professional Title:</strong> ${candidate?.professional_title || 'N/A'}</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Experience Level:</strong> ${candidate?.experience_level || 'N/A'}</p>
            </div>
            <p>You can review their profile, professional details, and video interview submissions from your employer dashboard, where you can also <strong>Accept</strong> or <strong>Reject</strong> this application.</p>
            <p>Go to your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za'}/employer/dashboard" style="color: #5D3FD3; font-weight: bold; text-decoration: none;">Employer Dashboard</a> to process this application.</p>
            <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">Best regards,<br/>The LaunchPath Onboarding Team</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending application email to employer:', emailErr);
    }
  }

  return NextResponse.json({ success: true, application });
}

async function cancelApplyHandler(req: Request, context: any, session: any) {
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  const existing = await db.jobApplication.findUnique({
    where: {
      candidate_id_job_id: {
        candidate_id: session.userId,
        job_id: jobId
      }
    }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  await db.jobApplication.delete({
    where: {
      id: existing.id
    }
  });

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(applyHandler, ['CANDIDATE']);
export const DELETE = withErrorHandler(cancelApplyHandler, ['CANDIDATE']);
