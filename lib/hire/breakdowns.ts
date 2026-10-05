/**
 * Performance and retention comparisons by role category, employer and submission cohort, plus a
 * revenue view that separates placement fees not yet invoiced, invoiced and paid. Pure functions over
 * real records. Groups with fewer than SMALL_SAMPLE vacancies are flagged; rates with no denominator
 * are null ("no data"), not 0.
 */
import { CLOSED_STATUSES, DEPARTED_OUTCOMES, ROLE_CATEGORIES, labelFor } from './vacancy';
import { outcomeAt, workingDaysBetween } from './metrics';

export const SMALL_SAMPLE = 5;
const DAY = 86_400_000;

export interface BreakdownInput {
  vacancies: { id: number; created_at: Date; status: string; role_category: string; lead_id: number; lead_name: string; company_id: number | null; company_name: string | null }[];
  shortlists: { vacancy_id: number; sent_at: Date | null }[];
  interviewRequests: { vacancy_id: number }[];
  entries: { vacancy_id: number; offer_status: string | null; offer_made_at: Date | null; offer_responded_at: Date | null }[];
  placements: {
    vacancy_id: number;
    start_date: Date;
    created_at: Date;
    placement_fee: number;
    invoice_status: string;
    invoiced_at: Date | null;
    paid_at: Date | null;
    commercial_model: string;
    check_30_outcome: string | null;
    check_60_outcome: string | null;
    check_90_outcome: string | null;
  }[];
  billingEvents?: { provider: string; outcome: string; payment_status: string | null; amount_cents: number | null; received_at: Date }[];
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ratio = (n: number, d: number) => ({ value: d ? n / d : null, numerator: n, denominator: d });

export const BREAKDOWN_DEFINITIONS = {
  cohort: 'Vacancies are grouped by the month they were submitted (UTC). Each group’s figures follow that cohort through to today, so recent cohorts look incomplete.',
  timeToShortlist: 'Median working days (Mon–Fri) from submission to the first shortlist sent, over vacancies in the group that have had one.',
  timeToHire: 'Median calendar days from submission to the first accepted offer (or, if no offer was recorded, the date the placement was recorded), over vacancies with a placement.',
  shortlistToInterview: 'Vacancies with an interview request ÷ vacancies with a shortlist sent.',
  interviewToOffer: 'Vacancies with an offer made ÷ vacancies with an interview request.',
  vacancyToHire: 'Vacancies with a placement ÷ all vacancies in the group (including those still in progress).',
  revenue: 'Placement fees for placements on the group’s vacancies: not invoiced, invoiced (invoiced or paid) and paid. Invoiced is not cash; only “paid” is money received.',
  retention: 'Placements at least 60 (or 90) days old, confirmed still employed ÷ those with a confirmed outcome. Placements not yet old enough are excluded; unchecked or unconfirmed ones are counted separately.',
  repeat: 'Employers (grouped by contact email) in the group with more than one vacancy ever.',
};

export function computeBreakdowns(input: BreakdownInput, opts: { now?: Date; windowDays?: number | null } = {}) {
  const now = opts.now ?? new Date();
  const from = opts.windowDays ? new Date(now.getTime() - opts.windowDays * DAY) : null;
  const cohort = input.vacancies.filter((v) => (!from || v.created_at >= from) && v.created_at <= now);

  const firstSent = new Map<number, Date>();
  for (const s of input.shortlists) if (s.sent_at && (!firstSent.get(s.vacancy_id) || s.sent_at < firstSent.get(s.vacancy_id)!)) firstSent.set(s.vacancy_id, s.sent_at);
  const interviewed = new Set(input.interviewRequests.map((r) => r.vacancy_id));
  const offered = new Set(input.entries.filter((e) => e.offer_made_at).map((e) => e.vacancy_id));
  const firstAccepted = new Map<number, Date>();
  for (const e of input.entries) {
    if (e.offer_status === 'ACCEPTED' && e.offer_responded_at && (!firstAccepted.get(e.vacancy_id) || e.offer_responded_at < firstAccepted.get(e.vacancy_id)!)) {
      firstAccepted.set(e.vacancy_id, e.offer_responded_at);
    }
  }
  const placementsBy = new Map<number, BreakdownInput['placements']>();
  for (const p of input.placements) placementsBy.set(p.vacancy_id, [...(placementsBy.get(p.vacancy_id) || []), p]);
  const vacanciesPerLead = new Map<number, number>();
  for (const v of input.vacancies) vacanciesPerLead.set(v.lead_id, (vacanciesPerLead.get(v.lead_id) || 0) + 1);

  function summarise(key: string, label: string, vs: BreakdownInput['vacancies']) {
    const ids = vs.map((v) => v.id);
    const shortlisted = ids.filter((id) => firstSent.has(id));
    const withInterview = ids.filter((id) => interviewed.has(id));
    const placements = ids.flatMap((id) => placementsBy.get(id) || []);
    const hired = ids.filter((id) => placementsBy.has(id));
    const byId = new Map(vs.map((v) => [v.id, v]));
    const toHire = hired.map((id) => {
      const end = firstAccepted.get(id) ?? (placementsBy.get(id) || []).map((p) => p.created_at).sort((a, b) => a.getTime() - b.getTime())[0];
      return Math.max(0, Math.round((end.getTime() - byId.get(id)!.created_at.getTime()) / DAY));
    });
    const fee = (xs: typeof placements) => xs.reduce((a, p) => a + p.placement_fee, 0);
    const retention = (days: 60 | 90) => {
      const eligible = placements.filter((p) => p.start_date.getTime() + days * DAY <= now.getTime());
      let retained = 0;
      let departed = 0;
      for (const p of eligible) {
        const o = outcomeAt(p, days);
        if (o === 'RETAINED') retained++;
        else if (o && DEPARTED_OUTCOMES.includes(o)) departed++;
      }
      return { ...ratio(retained, retained + departed), eligible: eligible.length, unknownOrNotChecked: eligible.length - retained - departed, notYetDue: placements.length - eligible.length };
    };
    const leads = new Set(vs.map((v) => v.lead_id));
    return {
      key,
      label,
      vacancies: vs.length,
      smallSample: vs.length < SMALL_SAMPLE,
      stillOpen: vs.filter((v) => !placementsBy.has(v.id) && !(CLOSED_STATUSES as string[]).includes(v.status)).length,
      medianWorkingDaysToShortlist: median(shortlisted.map((id) => workingDaysBetween(byId.get(id)!.created_at, firstSent.get(id)!))),
      medianDaysToHire: median(toHire),
      shortlistToInterview: ratio(shortlisted.filter((id) => interviewed.has(id)).length, shortlisted.length),
      interviewToOffer: ratio(withInterview.filter((id) => offered.has(id)).length, withInterview.length),
      vacancyToHire: ratio(hired.length, vs.length),
      placements: placements.length,
      revenue: {
        notInvoiced: fee(placements.filter((p) => p.invoice_status === 'NOT_INVOICED')),
        invoiced: fee(placements.filter((p) => ['INVOICED', 'PAID'].includes(p.invoice_status))),
        paid: fee(placements.filter((p) => p.invoice_status === 'PAID')),
      },
      retention60: retention(60),
      retention90: retention(90),
      repeatEmployers: ratio(Array.from(leads).filter((l) => (vacanciesPerLead.get(l) || 0) > 1).length, leads.size),
    };
  }

  const group = <K extends string>(keyOf: (v: BreakdownInput['vacancies'][number]) => K, labelOf: (k: K, v: BreakdownInput['vacancies'][number]) => string) => {
    const m = new Map<K, { label: string; vs: BreakdownInput['vacancies'] }>();
    for (const v of cohort) {
      const k = keyOf(v);
      const g = m.get(k) || { label: labelOf(k, v), vs: [] };
      g.vs.push(v);
      m.set(k, g);
    }
    return Array.from(m.entries())
      .map(([k, g]) => summarise(k, g.label, g.vs))
      .sort((a, b) => b.vacancies - a.vacancies || a.label.localeCompare(b.label));
  };

  // Revenue by money movement in the window (when it was invoiced / paid), independent of cohort
  const inWin = (d: Date | null) => !!d && (!from || d >= from) && d <= now;
  const invoicedInWindow = input.placements.filter((p) => inWin(p.invoiced_at));
  const paidInWindow = input.placements.filter((p) => inWin(p.paid_at));
  const sum = (xs: { placement_fee: number }[]) => xs.reduce((a, p) => a + p.placement_fee, 0);
  const subs = (input.billingEvents || []).filter((e) => e.outcome === 'APPLIED' && e.payment_status === 'COMPLETE' && inWin(e.received_at));

  return {
    byCategory: group(
      (v) => v.role_category,
      (k) => (k === 'OTHER' ? 'Other' : labelFor(ROLE_CATEGORIES, k)),
    ),
    // Verified company when linked, otherwise the (unverified) submitted company name of the lead
    byEmployer: group(
      (v) => (v.company_id ? `company:${v.company_id}` : `lead:${v.lead_id}`),
      (_k, v) => (v.company_name ? v.company_name : `${v.lead_name} (unverified)`),
    ),
    byCohort: group(
      (v) => v.created_at.toISOString().slice(0, 7),
      (k) => k,
    ).sort((a, b) => b.key.localeCompare(a.key)),
    revenue: {
      placementFeesInvoicedInWindow: sum(invoicedInWindow),
      placementFeesPaidInWindow: sum(paidInWindow),
      outstandingInvoiced: sum(input.placements.filter((p) => p.invoice_status === 'INVOICED')),
      notYetInvoiced: sum(input.placements.filter((p) => p.invoice_status === 'NOT_INVOICED')),
      byModel: ['STANDARD', 'PARTNER', 'PROGRAMME'].map((m) => ({
        model: m,
        invoiced: sum(invoicedInWindow.filter((p) => p.commercial_model === m)),
        paid: sum(paidInWindow.filter((p) => p.commercial_model === m)),
      })),
      subscriptionPaymentsRecorded: Math.round(subs.filter((e) => e.provider === 'MANUAL').reduce((a, e) => a + (e.amount_cents || 0), 0) / 100),
      sandboxTestPayments: Math.round(subs.filter((e) => e.provider === 'PAYFAST_SANDBOX').reduce((a, e) => a + (e.amount_cents || 0), 0) / 100),
    },
    definitions: BREAKDOWN_DEFINITIONS,
  };
}

export type Breakdowns = ReturnType<typeof computeBreakdowns>;
