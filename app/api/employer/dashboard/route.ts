import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

const LOCKED_CANDIDATE_FIELDS = { email: null, phone: null, resume_text: null, linkedin_url: null, github_url: null };

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { 
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenant_id: true,
        tenant: true 
      }
    });

    const myJobs = await db.job.findMany({
      where: { employer_id: session.userId },
      orderBy: { id: 'desc' }
    });

    const rawApplications = await db.jobApplication.findMany({
      where: { job: { employer_id: session.userId } },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            professional_title: true,
            experience_level: true,
            resume_text: true,
            phone: true,
            linkedin_url: true,
            github_url: true,
            video_interviews: {
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        },
        job: { select: { title: true, status: true } },
        interviews: true
      },
      orderBy: { applied_at: 'desc' }
    });

    // Contact details, CVs and interview recordings are part of what the employer pays for, so they
    // only leave the server once the job is paid and live (the dashboard's isJobUnlocked rule).
    const applications = rawApplications.map((app) =>
      app.job.status === 'ACTIVE'
        ? app
        : { ...app, candidate: { ...app.candidate, ...LOCKED_CANDIDATE_FIELDS, video_interviews: [] } }
    );

    // Also get the match scores for these applicants for their applied jobs!
    const applicationMatches = await Promise.all(
      applications.map(async (app) => {
        const matchInfo = await db.jobMatch.findUnique({
          where: {
            candidate_id_job_id: {
              candidate_id: app.candidate_id,
              job_id: app.job_id
            }
          }
        });
        return {
          ...app,
          matchContext: matchInfo
        };
      })
    );

    if (user) {
      (user as any).realRole = session.realRole;
    }

    return NextResponse.json({
      user,
      jobs: myJobs,
      applications: applicationMatches
    });
  } catch (error) {
    console.error('Employer Dashboard Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
