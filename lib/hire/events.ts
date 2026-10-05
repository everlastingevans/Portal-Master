import type { HireEventType } from './vacancy';

/**
 * Records a hiring-funnel event once. The dedupe key identifies the business fact (e.g. "shortlist 12
 * was sent"), so retries and double clicks never double-count. Accepts the Prisma client or a
 * transaction client. Contains ids only, never personal data.
 */
export async function recordHireEvent(
  db: any,
  type: HireEventType,
  ref: { vacancyId: number; shortlistId?: number; shortlistCandidateId?: number; placementId?: number; actorId?: number | null },
  dedupeSuffix: string | number,
  occurredAt = new Date(),
) {
  const dedupe_key = `${type}:${dedupeSuffix}`;
  return db.hireEvent.upsert({
    where: { dedupe_key },
    create: {
      type,
      dedupe_key,
      vacancy_id: ref.vacancyId,
      shortlist_id: ref.shortlistId ?? null,
      shortlist_candidate_id: ref.shortlistCandidateId ?? null,
      placement_id: ref.placementId ?? null,
      actor_id: ref.actorId ?? null,
      occurred_at: occurredAt,
    },
    update: {},
  });
}
