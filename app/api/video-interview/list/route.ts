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
            },
          },
        },
      });

      if (!interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      }

      // Check RBAC permission for single view
      if (role === 'CANDIDATE' && interview.candidate_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ interview });
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
      // Fetch interviews for jobs posted by this employer
      const filter: any = {};
      if (jobIdStr) {
        filter.job_id = parseInt(jobIdStr, 10);
      } else {
        filter.job = { employer_id: userId };
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
    if (role !== 'SUPERADMIN' && role !== 'EMPLOYER' && role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden: Recruiter access required' }, { status: 403 });
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
