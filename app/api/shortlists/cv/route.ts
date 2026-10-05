import db from '@/lib/db';
import { presignCvUrl } from '@/lib/hire/cv';
import { LINK_UNAVAILABLE, resolveShortlistLink } from '@/lib/hire/shortlist-access';
import { privateJson, readJson } from '@/lib/hire/public-response';

// Returns a 5-minute CV URL for one candidate on the shortlist the token grants access to.
export async function POST(req: Request) {
  const body = await readJson(req);
  const link = await resolveShortlistLink(db, body?.token).catch(() => null);
  if (!link) return privateJson({ error: LINK_UNAVAILABLE }, 404);

  const entry = await db.shortlistCandidate.findFirst({
    where: { id: Number(body?.candidateId) || -1, shortlist_id: link.shortlist_id },
    select: { display_name: true, cv_s3_key: true, cv_external_url: true },
  });
  if (!entry || (!entry.cv_s3_key && !entry.cv_external_url)) return privateJson({ error: 'No CV is available for this candidate.' }, 404);

  try {
    const url = entry.cv_s3_key ? await presignCvUrl(entry.cv_s3_key, entry.display_name) : entry.cv_external_url;
    return privateJson({ url });
  } catch (error) {
    console.error('[Shortlist CV] Could not create a CV link:', (error as Error).message);
    return privateJson({ error: 'The CV is temporarily unavailable. Please contact LaunchPath.' }, 503);
  }
}
