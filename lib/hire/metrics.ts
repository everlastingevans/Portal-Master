/**
 * LaunchPath Hire reporting. Pure calculations over real records; every metric carries its numerator,
 * denominator and a plain-language definition so the admin report can show how it was worked out.
 * A rate is null (shown as "No data yet") when its denominator is zero.
 */
import { CLOSED_STATUSES, DEPARTED_OUTCOMES, PLACED_STATUSES } from './vacancy';

export interface MetricsInput {
  vacancies: { id: number; created_at: Date; status: string; lead_id: number }[];
  shortlists: { vacancy_id: number; sent_at: Date | null }[];
  interviewRequests: { vacancy_id: number; created_at: Date }[];
  entries: { vacancy_id: number; offer_status: string | null; offer_made_at: Date | null; offer_responded_at: Date | null }[];
  placements: {
    vacancy_id: number;
    start_date: Date;
    placement_fee: number;
    check_30_outcome: string | null;
    check_60_outcome: string | null;
    check_90_outcome: string | null;
  }[];
}

export interface Rate {
  value: number | null;
  numerator: number;
  denominator: number;
  definition: string;
}

const DAY = 86_400_000;
const rate = (numerator: number, denominator: number, definition: string): Rate => ({
  value: denominator > 0 ? numerator / denominator : null,
  numerator,
  denominator,
  definition,
});

/** Weekdays elapsed from `from` to `to` (Mon–Fri; South African public holidays are not excluded). */
export function workingDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  let days = 0;
  for (let t = start + DAY; t <= end; t += DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Outcome at day N, carrying forward a departure recorded at an earlier check. */
export function outcomeAt(p: Pick<MetricsInput['placements'][number], 'check_30_outcome' | 'check_60_outcome' | 'check_90_outcome'>, days: 60 | 90): string | null {
  for (const d of [30, 60, 90] as const) {
    if (d > days) break;
    const o = p[`check_${d}_outcome`];
    if (o && DEPARTED_OUTCOMES.includes(o)) return o;
  }
  return p[`check_${days}_outcome`];
}

export function computeHireMetrics(input: MetricsInput, opts: { now?: Date; windowDays?: number | null } = {}) {
  const now = opts.now ?? new Date();
  const windowDays = opts.windowDays ?? null;
  const from = windowDays ? new Date(now.getTime() - windowDays * DAY) : null;
  const inWindow = (d: Date | null | undefined) => !!d && (!from || d >= from) && d <= now;
  const windowText = windowDays ? `in the last ${windowDays} days` : 'at any time';

  const cohort = input.vacancies.filter((v) => inWindow(v.created_at));
  const cohortIds = new Set(cohort.map((v) => v.id));

  const firstSent = new Map<number, Date>();
  for (const s of input.shortlists) {
    if (!s.sent_at) continue;
    const prev = firstSent.get(s.vacancy_id);
    if (!prev || s.sent_at < prev) firstSent.set(s.vacancy_id, s.sent_at);
  }
  const withInterview = new Set(input.interviewRequests.map((r) => r.vacancy_id));
  const withOffer = new Set(input.entries.filter((e) => e.offer_made_at).map((e) => e.vacancy_id));
  const withHire = new Set(input.placements.map((p) => p.vacancy_id));

  // Live vacancies: a point-in-time count, not windowed
  const live = input.vacancies.filter((v) => !(CLOSED_STATUSES as string[]).includes(v.status) && !(PLACED_STATUSES as string[]).includes(v.status)).length;

  // Time to shortlist
  const shortlisted = cohort.filter((v) => firstSent.has(v.id));
  const durations = shortlisted.map((v) => workingDaysBetween(v.created_at, firstSent.get(v.id)!));
  const timeToShortlist = {
    medianWorkingDays: median(durations),
    averageWorkingDays: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    withinFiveWorkingDays: rate(
      durations.filter((d) => d <= 5).length,
      durations.length,
      `Vacancies submitted ${windowText} whose first shortlist was sent within 5 working days of submission ÷ vacancies submitted ${windowText} that have had a shortlist sent.`,
    ),
    count: durations.length,
    definition: `Working days (Mon–Fri, public holidays not excluded) from vacancy submission to the first shortlist sent, for vacancies submitted ${windowText} that have had a shortlist sent. Vacancies without a shortlist yet are excluded.`,
  };

  const shortlistToInterview = rate(
    shortlisted.filter((v) => withInterview.has(v.id)).length,
    shortlisted.length,
    `Vacancies submitted ${windowText} with at least one interview request ÷ those vacancies that have had a shortlist sent.`,
  );
  const interviewed = cohort.filter((v) => withInterview.has(v.id));
  const interviewToOffer = rate(
    interviewed.filter((v) => withOffer.has(v.id)).length,
    interviewed.length,
    `Vacancies submitted ${windowText} with at least one offer made ÷ those vacancies with at least one interview request.`,
  );
  const vacancyToHire = {
    ...rate(
      cohort.filter((v) => withHire.has(v.id)).length,
      cohort.length,
      `Vacancies submitted ${windowText} with at least one placement ÷ all vacancies submitted ${windowText}. Vacancies still in progress count in the denominator, so recent windows read low.`,
    ),
    stillOpen: cohort.filter((v) => !withHire.has(v.id) && !(CLOSED_STATUSES as string[]).includes(v.status)).length,
  };

  const offers = input.entries.filter((e) => inWindow(e.offer_made_at));
  const accepted = offers.filter((e) => e.offer_status === 'ACCEPTED').length;
  const declined = offers.filter((e) => e.offer_status === 'DECLINED').length;
  const offerAcceptance = {
    ...rate(accepted, accepted + declined, `Offers made ${windowText} that were accepted ÷ offers made ${windowText} that were accepted or declined. Offers awaiting a response or withdrawn are excluded.`),
    awaitingResponse: offers.filter((e) => e.offer_status === 'OFFERED').length,
  };

  const windowPlacements = input.placements.filter((p) => inWindow(p.start_date));
  const total = windowPlacements.reduce((a, p) => a + p.placement_fee, 0);
  const averagePlacementFee = {
    value: windowPlacements.length ? Math.round(total / windowPlacements.length) : null,
    total,
    count: windowPlacements.length,
    definition: `Mean server-calculated placement fee for placements with a start date ${windowText}, whatever their invoice status.`,
  };

  const retention = (days: 60 | 90) => {
    const started = windowPlacements;
    const eligible = started.filter((p) => p.start_date.getTime() + days * DAY <= now.getTime());
    let retained = 0;
    let departed = 0;
    let unknown = 0;
    for (const p of eligible) {
      const o = outcomeAt(p, days);
      if (o === 'RETAINED') retained++;
      else if (o && DEPARTED_OUTCOMES.includes(o)) departed++;
      else unknown++; // not yet checked, or could not confirm
    }
    return {
      ...rate(
        retained,
        retained + departed,
        `Placements with a start date ${windowText} that are at least ${days} days old and confirmed still employed at the ${days}-day check ÷ those with a confirmed outcome (still employed or left). A departure recorded at an earlier check counts as departed. Placements not yet checked or that could not be confirmed are excluded and shown separately.`,
      ),
      retained,
      departed,
      unknownOrNotChecked: unknown,
      eligible: eligible.length,
      notYetDue: started.length - eligible.length,
    };
  };

  const firstVacancyByLead = new Map<number, Date>();
  for (const v of input.vacancies) {
    const prev = firstVacancyByLead.get(v.lead_id);
    if (!prev || v.created_at < prev) firstVacancyByLead.set(v.lead_id, v.created_at);
  }
  const cohortLeads = new Set(cohort.map((v) => v.lead_id));
  const repeat = Array.from(cohortLeads).filter((lead) => {
    const first = firstVacancyByLead.get(lead)!;
    return cohort.some((v) => v.lead_id === lead && v.created_at > first);
  }).length;
  const repeatEmployers = rate(
    repeat,
    cohortLeads.size,
    `Employers who submitted a vacancy ${windowText} and had submitted an earlier vacancy ÷ all employers who submitted a vacancy ${windowText}. Employers are grouped by contact email, so two contacts at one company count separately.`,
  );

  return {
    window: { days: windowDays, from: from?.toISOString() ?? null, to: now.toISOString() },
    vacanciesInWindow: cohortIds.size,
    liveVacancies: { value: live, definition: 'Vacancies right now in New Vacancy through Offer (not hired, in follow-up, or closed). Not affected by the time window.' },
    timeToShortlist,
    shortlistToInterview,
    interviewToOffer,
    vacancyToHire,
    offerAcceptance,
    averagePlacementFee,
    retention60: retention(60),
    retention90: retention(90),
    repeatEmployers,
  };
}

export type HireMetrics = ReturnType<typeof computeHireMetrics>;
