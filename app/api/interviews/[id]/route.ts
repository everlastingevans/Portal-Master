import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getEmployerApplicationAccess } from '@/lib/application-access';

const STATUSES = ['Proposed', 'Confirmed', 'Rescheduled', 'Cancelled'];
// The invited candidate can accept, ask to reschedule, or decline. Only the employer side moves the time.
const CANDIDATE_STATUSES = ['Confirmed', 'Rescheduled', 'Cancelled'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const interviewId = parseInt(params.id, 10);
    const notFound = NextResponse.json({ error: 'Interview not found.' }, { status: 404 });
    if (!Number.isInteger(interviewId) || interviewId <= 0) return notFound;

    const existing = await db.interview.findUnique({ where: { id: interviewId }, select: { id: true, candidate_id: true, application_id: true } });
    if (!existing) return notFound;

    const { status, proposed_time } = await req.json();
    if (status !== undefined && !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Unknown interview status.' }, { status: 400 });
    }
    const proposedAt = proposed_time ? new Date(proposed_time) : null;
    if (proposedAt && Number.isNaN(proposedAt.getTime())) {
      return NextResponse.json({ error: 'Choose a valid interview time.' }, { status: 400 });
    }

    const isInvitedCandidate = session.role === 'CANDIDATE' && existing.candidate_id === session.userId;
    if (isInvitedCandidate) {
      if (proposedAt || (status !== undefined && !CANDIDATE_STATUSES.includes(status))) {
        return NextResponse.json({ error: 'You can confirm, ask to reschedule, or decline this interview.' }, { status: 403 });
      }
    } else {
      // Job owner, their hiring team, or a superadmin. Anyone else gets a 404 so ids can't be probed.
      const access = await getEmployerApplicationAccess(existing.application_id);
      if (!access.ok) return notFound;
    }

    const data: { status?: string; proposed_time?: Date } = {};
    if (status) data.status = status;
    if (proposedAt) data.proposed_time = proposedAt;

    const interview = await db.interview.update({
      where: { id: interviewId },
      data
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
