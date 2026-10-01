import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEmployerApplicationAccess } from '@/lib/application-access';

// PRIVATE: recruiter-only evaluation notes. Never expose to candidates.
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const MAX_LENGTH = 5000;

const NOTE_SELECT = {
  id: true,
  content: true,
  rating_technical: true,
  rating_communication: true,
  rating_culture: true,
  created_at: true,
  author_id: true,
  author: { select: { id: true, name: true } },
} as const;

function parseRating(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '' || value === 0) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 'invalid';
}

function summarise(notes: { rating_technical: number | null; rating_communication: number | null; rating_culture: number | null }[]) {
  const avg = (key: 'rating_technical' | 'rating_communication' | 'rating_culture') => {
    const vals = notes.map((n) => n[key]).filter((v): v is number => typeof v === 'number');
    return vals.length ? { average: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10, count: vals.length } : null;
  };
  return { technical: avg('rating_technical'), communication: avg('rating_communication'), culture: avg('rating_culture') };
}

/** GET /api/applications/:id/notes → the team's notes (newest first) and average ratings. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await getEmployerApplicationAccess(Number(params.id));
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: NO_STORE });

  const notes = await db.applicationNote.findMany({
    where: { application_id: access.application.id },
    orderBy: { created_at: 'desc' },
    take: 200,
    select: NOTE_SELECT,
  });

  return NextResponse.json(
    { notes: notes.map((n) => ({ ...n, isMine: n.author_id === access.userId })), summary: summarise(notes), viewerId: access.userId },
    { headers: NO_STORE },
  );
}

/** POST /api/applications/:id/notes  { content, rating_technical?, rating_communication?, rating_culture? } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await getEmployerApplicationAccess(Number(params.id));
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: NO_STORE });

  try {
    const body = await req.json();
    const content = String(body.content ?? '').replace(/\r\n/g, '\n').trim();
    const ratings = {
      rating_technical: parseRating(body.rating_technical),
      rating_communication: parseRating(body.rating_communication),
      rating_culture: parseRating(body.rating_culture),
    };

    if (Object.values(ratings).includes('invalid')) {
      return NextResponse.json({ error: 'Ratings must be whole numbers from 1 to 5.' }, { status: 400, headers: NO_STORE });
    }
    if (content.length > MAX_LENGTH) {
      return NextResponse.json({ error: `Notes can be up to ${MAX_LENGTH} characters.` }, { status: 400, headers: NO_STORE });
    }
    const hasRating = Object.values(ratings).some((r) => typeof r === 'number');
    if (!content && !hasRating) {
      return NextResponse.json({ error: 'Add a note or at least one rating.' }, { status: 400, headers: NO_STORE });
    }

    const [note] = await db.$transaction([
      db.applicationNote.create({
        data: {
          application_id: access.application.id,
          author_id: access.userId,
          content,
          rating_technical: ratings.rating_technical as number | null,
          rating_communication: ratings.rating_communication as number | null,
          rating_culture: ratings.rating_culture as number | null,
        },
        select: NOTE_SELECT,
      }),
      // Surface in the application history (also employer-only) without copying the note's content
      db.applicationActivity.create({
        data: {
          application_id: access.application.id,
          actor_id: access.userId,
          type: 'NOTE_ADDED',
          summary: hasRating ? 'Added an evaluation with ratings' : 'Added an evaluation note',
        },
      }),
    ]);

    return NextResponse.json({ note: { ...note, isMine: true } }, { status: 201, headers: NO_STORE });
  } catch (err) {
    console.error('[Notes] create failed:', err);
    return NextResponse.json({ error: 'Could not save the note.' }, { status: 500, headers: NO_STORE });
  }
}

/** DELETE /api/applications/:id/notes?noteId=123 → authors can remove their own notes. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const access = await getEmployerApplicationAccess(Number(params.id));
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers: NO_STORE });

  const noteId = Number(new URL(req.url).searchParams.get('noteId'));
  const note = noteId
    ? await db.applicationNote.findFirst({ where: { id: noteId, application_id: access.application.id }, select: { id: true, author_id: true } })
    : null;
  if (!note) return NextResponse.json({ error: 'Note not found.' }, { status: 404, headers: NO_STORE });
  if (note.author_id !== access.userId && !access.isAdmin) {
    return NextResponse.json({ error: 'You can only delete your own notes.' }, { status: 403, headers: NO_STORE });
  }

  await db.applicationNote.delete({ where: { id: note.id } });
  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
