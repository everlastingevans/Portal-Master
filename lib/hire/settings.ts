import db from '@/lib/db';
import { DEFAULT_HIRE_TERMS, HIRE_TERMS_SETTING_KEY, HireTerms, parseStoredHireTerms } from './terms';

/** Current LaunchPath Hire terms from the database, or the defaults if unset or unreadable. */
export async function getHireTerms(): Promise<HireTerms> {
  try {
    const row = await db.appSetting.findUnique({ where: { key: HIRE_TERMS_SETTING_KEY } });
    return parseStoredHireTerms(row?.value);
  } catch (error) {
    console.error('[HireTerms] Falling back to defaults:', (error as Error).message);
    return DEFAULT_HIRE_TERMS;
  }
}

/** Saves already-validated terms. Existing vacancies keep their snapshotted terms. */
export async function saveHireTerms(terms: HireTerms, actorId: number | null) {
  const value = JSON.stringify(terms);
  await db.appSetting.upsert({
    where: { key: HIRE_TERMS_SETTING_KEY },
    create: { key: HIRE_TERMS_SETTING_KEY, value, updated_by_id: actorId },
    update: { value, updated_by_id: actorId },
  });
  return terms;
}
