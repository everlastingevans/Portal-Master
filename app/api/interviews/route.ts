import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEmployerApplicationAccess } from '@/lib/application-access';
import { dispatchInterviewInvitation } from '@/lib/notifications';

// Employer proposes an interview on an application they (or their hiring team) can access.
// The candidate is taken from the application, never from the request body.
export async function POST(req: Request) {
  try {
    const { application_id, proposed_time, notes } = await req.json();

    const access = await getEmployerApplicationAccess(Number(application_id));
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const proposedAt = new Date(proposed_time);
    if (!proposed_time || Number.isNaN(proposedAt.getTime())) {
      return NextResponse.json({ error: 'Choose a valid interview time.' }, { status: 400 });
    }

    const jobApp = await db.jobApplication.findUnique({
      where: { id: access.application.id },
      include: {
        candidate: true,
        job: true
      }
    });
    if (!jobApp) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    const candidate_id = jobApp.candidate_id;

    const interview = await db.interview.create({
      data: {
        application_id: jobApp.id,
        employer_id: access.userId,
        candidate_id,
        proposed_time: proposedAt,
        notes: typeof notes === 'string' ? notes : null,
        status: 'Proposed'
      }
    });

    // Also update application status to Interviewing if it's not already
    await db.jobApplication.update({
      where: { id: jobApp.id },
      data: { status: 'Interviewing' }
    });

    if (jobApp) {
      const candidate = jobApp.candidate;
      const job = jobApp.job;

      const candidateName = candidate?.name || 'Talent';
      const candidateEmail = candidate?.email;
      const candidatePhone = candidate?.phone;
      const jobTitle = job?.title || 'Job Role';
      const companyName = job?.company || 'Employer Partner';

      const formattedTime = new Date(proposed_time).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. Create in-app inbox notification
      await db.notification.create({
        data: {
          user_id: candidate_id,
          title: `Interview Invitation: ${jobTitle}`,
          content: `${companyName} has invited you to an interview for "${jobTitle}". Time: ${formattedTime}. Notes/Instructions: ${notes || 'None'}. Please view this under settings or confirm below.`,
          type: 'INTERVIEW'
        }
      });

      // 2. Dispatch external multi-channel notifications (Email, SMS, WhatsApp)
      if (candidateEmail) {
        await dispatchInterviewInvitation({
          candidateEmail,
          candidatePhone,
          candidateName,
          jobTitle,
          companyName,
          proposedTime: new Date(proposed_time),
          notes
        });
      }
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
