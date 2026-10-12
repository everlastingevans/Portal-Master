import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userIdHeader = req.headers.get('x-user-id');
    const userRoleHeader = req.headers.get('x-user-role');

    if (!userIdHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(userIdHeader, 10);
    const role = userRoleHeader ? userRoleHeader.toUpperCase() : 'CANDIDATE';

    const url = new URL(req.url);
    const interviewIdStr = url.searchParams.get('id');
    const jobIdStr = url.searchParams.get('jobId');

    // 1. Fetch single interview details if ID is provided
    if (interviewIdStr) {
      const interviewId = parseInt(interviewIdStr, 10);
      const interview = await prisma.videoInterview.findUnique({
        where: { id: interviewId },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              professional_title: true,
              experience_level: true,
              cv_url: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              employer_id: true,
            },
          },
        },
      });

      // Candidates see their own; employers only interviews for their own jobs (never standalone
      // practice interviews); superadmins everything. 404 rather than 403 so ids can't be probed.
      const allowed =
        !!interview &&
        (role === 'SUPERADMIN' ||
          ((role === 'EMPLOYER' || role === 'CLIENT') && interview.job?.employer_id === userId) ||
          (role === 'CANDIDATE' && interview.candidate_id === userId));
      if (!interview || !allowed) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      }

      const { employer_id: _owner, ...job } = interview.job || ({} as any);
      return NextResponse.json({ interview: { ...interview, job: interview.job ? job : null } });
    }

    // 2. Fetch list based on role
    let interviews = [];

    if (role === 'SUPERADMIN') {
      interviews = await prisma.videoInterview.findMany({
        include: {
          candidate: { select: { name: true, email: true, professional_title: true } },
          job: { select: { title: true, company: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    } else if (role === 'EMPLOYER' || role === 'CLIENT') {
      // Fetch interviews for jobs posted by this employer (optionally one of their jobs)
      const filter: any = { job: { employer_id: userId } };
      if (jobIdStr) {
        filter.job_id = parseInt(jobIdStr, 10);
      }

      interviews = await prisma.videoInterview.findMany({
        where: filter,
        include: {
          candidate: { select: { name: true, email: true, professional_title: true } },
          job: { select: { title: true, company: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    } else {
      // Candidate views their own interview submissions
      interviews = await prisma.videoInterview.findMany({
        where: { candidate_id: userId },
        include: {
          job: { select: { title: true, company: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    }

    return NextResponse.json({ interviews });
  } catch (error: any) {
    console.error('[VIDEO INTERVIEW LIST ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve video interviews.' }, { status: 500 });
  }
}

// Support manual grade / feedback update from Employer/Admin
export async function PATCH(req: NextRequest) {
  try {
    const userIdHeader = req.headers.get('x-user-id');
    const userRoleHeader = req.headers.get('x-user-role');

    if (!userIdHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const role = userRoleHeader ? userRoleHeader.toUpperCase() : 'CANDIDATE';
    // Readiness scores are shown to every employer, so only LaunchPath staff may change them
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: LaunchPath staff access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, score, feedback } = body;

    if (!id) {
      return NextResponse.json({ error: 'Interview ID is required.' }, { status: 400 });
    }

    const updated = await prisma.videoInterview.update({
      where: { id: parseInt(id, 10) },
      data: {
        score: score !== undefined ? parseInt(score, 10) : undefined,
        feedback: feedback || undefined,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('[VIDEO INTERVIEW PATCH ERROR]', error);
    return NextResponse.json({ error: 'Failed to update feedback scores.' }, { status: 500 });
  }
}
