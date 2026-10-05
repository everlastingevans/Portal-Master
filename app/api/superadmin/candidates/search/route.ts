import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';

// Staff search of platform candidates when building a shortlist. SUPERADMIN only.
// Practice-interview scores are returned for staff reference ONLY. Candidates can re-run them and the
// existing re-evaluation flow changes scores without review, so they are never copied onto a card.
export async function GET(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ candidates: [] });

  try {
    const users = await db.user.findMany({
      where: {
        role: 'CANDIDATE',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { professional_title: { contains: q, mode: 'insensitive' } },
          { skills: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        professional_title: true,
        location: true,
        experience_level: true,
        availability: true,
        skills: true,
        cv_url: true,
        resume_text: true,
        video_interviews: { where: { status: 'COMPLETED', score: { gt: 0 } }, orderBy: { updated_at: 'desc' }, take: 1, select: { score: true, updated_at: true } },
      },
    });
    return NextResponse.json({
      candidates: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        title: u.professional_title,
        location: u.location,
        experience: u.experience_level,
        availability: u.availability,
        skills: u.skills,
        hasCvFile: Boolean(u.cv_url),
        hasCvText: Boolean(u.resume_text),
        practiceInterview: u.video_interviews[0] ? { score: u.video_interviews[0].score, at: u.video_interviews[0].updated_at } : null,
      })),
    });
  } catch (error) {
    console.error('[Candidate search] failed:', (error as Error).message);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
