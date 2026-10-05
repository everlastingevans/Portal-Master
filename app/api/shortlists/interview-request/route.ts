import db from '@/lib/db';
import { createInterviewRequest } from '@/lib/hire/ops';
import { LINK_UNAVAILABLE, resolveShortlistLink } from '@/lib/hire/shortlist-access';
import { privateJson, readJson } from '@/lib/hire/public-response';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const recent = new Map<string, number[]>();

function rateLimited(key: string, now = Date.now()) {
  const hits = (recent.get(key) || []).filter((t) => t > now - WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}

// Employer asks to interview a shortlisted candidate. Recorded against that vacancy and candidate;
// an open request for the same candidate is reused rather than duplicated.
export async function POST(req: Request) {
  const body = await readJson(req);
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return privateJson({ error: 'Too many requests. Please wait a few minutes and try again.' }, 429);

  const link = await resolveShortlistLink(db, body?.token).catch(() => null);
  if (!link) return privateJson({ error: LINK_UNAVAILABLE }, 404);

  const entry = await db.shortlistCandidate.findFirst({
    where: { id: Number(body?.candidateId) || -1, shortlist_id: link.shortlist_id },
    select: { id: true },
  });
  if (!entry) return privateJson({ error: 'This candidate is not on your shortlist.' }, 404);

  try {
    const res = await createInterviewRequest(db, {
      vacancyId: link.shortlist.vacancy_id,
      shortlistId: link.shortlist_id,
      shortlistCandidateId: entry.id,
      source: 'EMPLOYER_LINK',
      requesterName: body?.requesterName as string,
      preferredTimes: body?.preferredTimes as string,
      message: body?.message as string,
    });
    return privateJson({ success: true, alreadyRequested: !res.created }, res.created ? 201 : 200);
  } catch (error) {
    console.error('[Shortlist] Interview request failed:', (error as Error).message);
    return privateJson({ error: 'We couldn’t record your request. Please try again or contact LaunchPath.' }, 500);
  }
}
