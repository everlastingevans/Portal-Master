import db from '@/lib/db';
import { toCandidateCard } from '@/lib/hire/card';
import { LINK_UNAVAILABLE, resolveShortlistLink } from '@/lib/hire/shortlist-access';
import { privateJson, readJson } from '@/lib/hire/public-response';

// Employer view of a shortlist. The token arrives in the POST body (it lives in the URL fragment on
// the page), is checked on every request, and only card fields are returned.
export async function POST(req: Request) {
  const body = await readJson(req);
  const link = await resolveShortlistLink(db, body?.token).catch(() => null);
  if (!link) return privateJson({ error: LINK_UNAVAILABLE }, 404);

  const entries = await db.shortlistCandidate.findMany({
    where: { shortlist_id: link.shortlist_id },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { interview_requests: { where: { status: { in: ['NEW', 'SCHEDULED', 'COMPLETED'] } }, select: { id: true } } },
  });

  // Best-effort view tracking for operations
  db.shortlistLink
    .update({ where: { id: link.id }, data: { view_count: { increment: 1 }, last_viewed_at: new Date() } })
    .catch(() => undefined);

  return privateJson({
    roleTitle: link.shortlist.vacancy.role_title,
    companyName: link.shortlist.vacancy.company_name,
    reference: link.shortlist.vacancy.id,
    expiresAt: link.expires_at.toISOString(),
    candidates: entries.map((e: any) => toCandidateCard(e, e.interview_requests.length > 0)),
  });
}
