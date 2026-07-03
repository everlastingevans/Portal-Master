import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, status } = await req.json();

    if (!applicationId || !['Accepted', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid Application ID and status (Accepted or Rejected) required' }, { status: 400 });
    }

    // Find the application and ensure it belongs to this employer's job
    const application = await db.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: {
          include: {
            employer: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.employer_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized: This job does not belong to you' }, { status: 401 });
    }

    // Update status
    const updatedApplication = await db.jobApplication.update({
      where: { id: applicationId },
      data: { status }
    });

    // Create an in-app notification/message for the candidate
    const candidateName = application.candidate.name || 'Candidate';
    const employerName = application.job.employer?.name || application.job.company || 'Employer';
    const jobTitle = application.job.title;

    let notificationTitle = '';
    let notificationContent = '';
    
    if (status === 'Accepted') {
      notificationTitle = `Application Accepted: ${jobTitle}`;
      notificationContent = `Congratulations! Your application for "${jobTitle}" at ${application.job.company} has been accepted by the employer. They will contact you shortly regarding the next steps.`;
    } else {
      notificationTitle = `Application Status Update: ${jobTitle}`;
      notificationContent = `Thank you for your interest in the "${jobTitle}" position at ${application.job.company}. After careful consideration, the hiring team has decided to move forward with other candidates at this time. We wish you the best in your job search!`;
    }

    await db.notification.create({
      data: {
        user_id: application.candidate_id,
        title: notificationTitle,
        content: notificationContent,
        type: 'APPLICATION'
      }
    });

    // Also create one for the employer in-app inbox
    await db.notification.create({
      data: {
        user_id: session.userId,
        title: `Candidate ${status}: ${candidateName}`,
        content: `You have successfully marked ${candidateName}'s application for "${jobTitle}" as "${status}".`,
        type: 'APPLICATION'
      }
    });

    // Send emails to BOTH parties
    // 1. Email to Candidate
    if (application.candidate.email) {
      const candidateEmailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: ${status === 'Accepted' ? '#10b981' : '#ef4444'}; margin-top: 0;">
            ${status === 'Accepted' ? 'Application Accepted!' : 'Application Status Update'}
          </h2>
          <p>Dear <strong>${candidateName}</strong>,</p>
          <p>
            ${status === 'Accepted' 
              ? `Great news! <strong>${application.job.company}</strong> has reviewed your application for the <strong>${jobTitle}</strong> position and marked it as <strong>Accepted</strong>.` 
              : `Thank you for your application for the <strong>${jobTitle}</strong> position at <strong>${application.job.company}</strong>.`}
          </p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status === 'Accepted' ? '#10b981' : '#ef4444'};">
            <p style="margin: 0; font-weight: bold; color: #334155;">Application Summary:</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Job:</strong> ${jobTitle}</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Company:</strong> ${application.job.company}</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Status:</strong> <span style="font-weight: bold; color: ${status === 'Accepted' ? '#10b981' : '#ef4444'};">${status}</span></p>
          </div>
          <p>
            ${status === 'Accepted'
              ? `The hiring team will be in touch with you soon to discuss the next steps. In the meantime, you can review details on your portal.`
              : `Although this role didn't work out, we encourage you to keep applying to other opportunities on the platform. Your profile remains active and visible to other employers.`}
          </p>
          <p>Log in to your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za'}/candidate/dashboard" style="color: #5D3FD3; font-weight: bold; text-decoration: none;">LaunchPath Profile</a> for more details.</p>
          <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">Best regards,<br/>The LaunchPath Onboarding Team</p>
        </div>
      `;

      try {
        await sendEmail({
          to: application.candidate.email,
          subject: `Application Update: ${jobTitle} at ${application.job.company}`,
          html: candidateEmailHtml
        });
      } catch (emailErr) {
        console.error('Error sending candidate update email:', emailErr);
      }
    }

    // 2. Email to Employer
    if (application.job.employer?.email) {
      const employerEmailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #5D3FD3; margin-top: 0;">Application Status Processed</h2>
          <p>Dear <strong>${employerName}</strong>,</p>
          <p>This is to confirm that you have marked candidate <strong>${candidateName}</strong> as <strong>${status}</strong> for the <strong>${jobTitle}</strong> position.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5D3FD3;">
            <p style="margin: 0; font-weight: bold; color: #334155;">Processed Details:</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Candidate:</strong> ${candidateName}</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Job position:</strong> ${jobTitle}</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;"><strong>Decision:</strong> <span style="font-weight: bold; color: ${status === 'Accepted' ? '#10b981' : '#ef4444'};">${status}</span></p>
          </div>
          <p>The candidate has been notified via email and their portal inbox. You can view all candidate application statuses on your dashboard.</p>
          <p>Access your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za'}/employer/dashboard" style="color: #5D3FD3; font-weight: bold; text-decoration: none;">Employer Dashboard</a>.</p>
          <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">Best regards,<br/>The LaunchPath Onboarding Team</p>
        </div>
      `;

      try {
        await sendEmail({
          to: application.job.employer.email,
          subject: `Confirmation: Candidate ${candidateName} ${status} for ${jobTitle}`,
          html: employerEmailHtml
        });
      } catch (emailErr) {
        console.error('Error sending employer decision confirmation email:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in application status update API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
