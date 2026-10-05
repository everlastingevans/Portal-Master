/**
 * Hiring Partner subscriptions and commercial terms resolution for placements.
 * Rules the brief leaves open (see PENDING_DECISIONS in lib/features.ts) are never assumed: the
 * relevant action is refused until an explicit per-agreement choice is recorded.
 */
import { isFeatureEnabled } from '@/lib/features';
import { HireTerms } from './terms';
import { CLOSED_STATUSES, PLACED_STATUSES } from './vacancy';

export const ENTITLEMENTS = [
  { value: 'PRIORITY_SOURCING', label: 'Priority sourcing' },
  { value: 'DEDICATED_TALENT_PARTNER', label: 'Dedicated talent partner' },
  { value: 'SALARY_BENCHMARKING', label: 'Salary benchmarking' },
  { value: 'INTERVIEW_SCORECARDS', label: 'Interview scorecards' },
] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number]['value'];

export const FEE_RULES = [
  { value: 'UNDECIDED', label: 'Undecided (partner fees refused)' },
  { value: 'STANDARD_MIN_MAX', label: 'Apply the standard minimum and maximum' },
  { value: 'NO_MIN_MAX', label: 'No minimum or maximum' },
  { value: 'CUSTOM', label: 'Custom minimum and maximum' },
] as const;
export const VAT_TREATMENTS = [
  { value: 'UNDECIDED', label: 'Undecided' },
  { value: 'INCLUSIVE', label: 'VAT inclusive' },
  { value: 'EXCLUSIVE', label: 'VAT exclusive' },
] as const;
export const SUBSCRIPTION_STATUSES = ['PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;

/** The indicative offer from the brief, used to prefill a DRAFT plan version. Not active by default. */
export const INDICATIVE_PLAN = {
  name: 'Hiring Partner (indicative offer)',
  monthly_price: 4999,
  vat_treatment: 'UNDECIDED',
  vacancy_limit: 3,
  success_fee_bps: 350,
  fee_rule: 'UNDECIDED',
  fee_min: null,
  fee_max: null,
  guarantee_days: 60,
  entitlements: ENTITLEMENTS.map((e) => e.value),
};

type Errors = Record<string, string>;
const inList = (list: readonly { value: string }[], v: unknown) => list.some((o) => o.value === v);
const int = (v: unknown) => (v === null || v === '' || v === undefined ? null : Number(String(v).replace(/[\sR,]/gi, '')));

export function parsePlanInput(raw: Record<string, unknown>) {
  const errors: Errors = {};
  const name = String(raw.name ?? '').trim().slice(0, 120);
  if (name.length < 3) errors.name = 'Name the plan version.';
  const price = int(raw.monthly_price);
  if (!Number.isInteger(price) || (price as number) < 1 || (price as number) > 1_000_000) errors.monthly_price = 'Monthly price must be a whole rand amount.';
  const limit = int(raw.vacancy_limit);
  if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 100) errors.vacancy_limit = 'Vacancy limit must be between 1 and 100.';
  const bps = raw.success_fee_percent !== undefined ? Math.round(Number(raw.success_fee_percent) * 100) : int(raw.success_fee_bps);
  if (!Number.isInteger(bps) || (bps as number) < 1 || (bps as number) > 5000) errors.success_fee_bps = 'Success fee must be between 0.01% and 50%.';
  const fee = parseFeeRule(raw);
  Object.assign(errors, fee.errors);
  const vat = String(raw.vat_treatment ?? 'UNDECIDED');
  if (!inList(VAT_TREATMENTS, vat)) errors.vat_treatment = 'Unknown VAT treatment.';
  const guarantee = int(raw.guarantee_days);
  if (!Number.isInteger(guarantee) || (guarantee as number) < 0 || (guarantee as number) > 365) errors.guarantee_days = 'Guarantee must be 0–365 days.';
  const ents = Array.isArray(raw.entitlements) ? raw.entitlements.map(String) : [];
  if (ents.some((e) => !inList(ENTITLEMENTS, e))) errors.entitlements = 'Unknown entitlement.';
  const from = parseDate(raw.effective_from);
  if (!from) errors.effective_from = 'Enter the date this version takes effect.';
  const to = raw.effective_to ? parseDate(raw.effective_to) : null;
  if (raw.effective_to && !to) errors.effective_to = 'Use a valid date.';
  if (from && to && to <= from) errors.effective_to = 'The end date must be after the start date.';

  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    data: {
      name,
      monthly_price: price as number,
      vacancy_limit: limit as number,
      success_fee_bps: bps as number,
      ...fee.data,
      vat_treatment: vat,
      guarantee_days: guarantee as number,
      entitlements: Array.from(new Set(ents)),
      effective_from: from as Date,
      effective_to: to,
      notes: String(raw.notes ?? '').trim().slice(0, 2000) || null,
    },
  };
}

export function parseFeeRule(raw: Record<string, unknown>) {
  const errors: Errors = {};
  const rule = String(raw.fee_rule ?? 'UNDECIDED');
  let fee_min: number | null = null;
  let fee_max: number | null = null;
  if (!inList(FEE_RULES, rule)) errors.fee_rule = 'Unknown fee rule.';
  if (rule === 'CUSTOM') {
    fee_min = int(raw.fee_min);
    fee_max = int(raw.fee_max);
    if (!Number.isInteger(fee_min) || (fee_min as number) < 0) errors.fee_min = 'Enter a whole rand minimum.';
    if (!Number.isInteger(fee_max) || (fee_max as number) < 1) errors.fee_max = 'Enter a whole rand maximum.';
    if (!errors.fee_min && !errors.fee_max && (fee_max as number) < (fee_min as number)) errors.fee_max = 'Maximum can’t be below the minimum.';
  }
  return { errors, data: { fee_rule: rule, fee_min, fee_max } };
}

function parseDate(v: unknown): Date | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return v instanceof Date ? v : null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The plan version in force on `at`: ACTIVE, effective, latest start wins. */
export function currentPlanVersion<T extends { status: string; effective_from: Date; effective_to: Date | null }>(versions: T[], at = new Date()): T | null {
  return (
    versions
      .filter((v) => v.status === 'ACTIVE' && v.effective_from <= at && (!v.effective_to || v.effective_to > at))
      .sort((a, b) => b.effective_from.getTime() - a.effective_from.getTime())[0] ?? null
  );
}

/**
 * Resolves the agreed min/max for a subscription snapshot. "Standard" copies today's standard values
 * into the agreement, so later changes to standard terms don't alter it.
 */
export function snapshotFeeBounds(rule: string, custom: { fee_min: number | null; fee_max: number | null }, standard: HireTerms) {
  if (rule === 'STANDARD_MIN_MAX') return { fee_min: standard.feeMin, fee_max: standard.feeMax };
  if (rule === 'CUSTOM') return custom;
  return { fee_min: null, fee_max: null };
}

/**
 * Pending decision `partner_active_vacancy`: a partner vacancy counts towards the limit from
 * submission until it is hired (or later) or closed. Change here once confirmed.
 */
export function countsTowardLimit(status: string) {
  return !(CLOSED_STATUSES as string[]).includes(status) && !(PLACED_STATUSES as string[]).includes(status);
}

export const hasEntitlement = (sub: { status: string; entitlements: string[] } | null | undefined, e: Entitlement) =>
  Boolean(sub && sub.status === 'ACTIVE' && sub.entitlements.includes(e));

/** Server-side check before a vacancy is placed on a company's Hiring Partner subscription. */
export async function checkPartnerLink(db: any, vacancy: { id: number; company_id: number | null }, subscriptionId: number) {
  if (!isFeatureEnabled('HIRING_PARTNER')) return { ok: false as const, error: 'Hiring Partner is not enabled.' };
  const sub = await db.partnerSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return { ok: false as const, error: 'Subscription not found.' };
  if (!vacancy.company_id || vacancy.company_id !== sub.company_id) return { ok: false as const, error: 'Link the vacancy to the subscription’s company first.' };
  if (sub.status !== 'ACTIVE') return { ok: false as const, error: `The subscription is ${sub.status.toLowerCase().replace('_', ' ')}; only active subscriptions can take new vacancies.` };
  const linked = await db.vacancy.findMany({ where: { partner_subscription_id: sub.id, commercial_model: 'PARTNER', id: { not: vacancy.id } }, select: { status: true } });
  const active = linked.filter((v: any) => countsTowardLimit(v.status)).length;
  if (active >= sub.vacancy_limit) return { ok: false as const, error: `This subscription already has ${active} of ${sub.vacancy_limit} active vacancies.` };
  return { ok: true as const, subscription: sub };
}

/* ------------------------------------------------------------------------- */
/*  Placement fee terms by commercial model                                  */
/* ------------------------------------------------------------------------- */

export interface PlacementTerms {
  commercial_model: 'STANDARD' | 'PARTNER' | 'PROGRAMME';
  fee_basis: 'PERCENT' | 'FLAT';
  fee_rate_bps: number | null;
  fee_min: number | null;
  fee_max: number | null;
  fee_flat: number | null;
  guarantee_days: number;
  partner_subscription_id: number | null;
  programme_terms_id: number | null;
}

/** Fee in whole rand for a placement under the given terms. */
export function computeFee(annualCtc: number, t: Pick<PlacementTerms, 'fee_basis' | 'fee_rate_bps' | 'fee_min' | 'fee_max' | 'fee_flat'>): number {
  if (!Number.isInteger(annualCtc) || annualCtc <= 0) throw new Error('Annual CTC must be a positive whole rand amount.');
  if (t.fee_basis === 'FLAT') {
    if (!Number.isInteger(t.fee_flat) || (t.fee_flat as number) < 0) throw new Error('Flat fee missing.');
    return t.fee_flat as number;
  }
  if (!Number.isInteger(t.fee_rate_bps)) throw new Error('Fee rate missing.');
  let fee = Math.round((annualCtc * (t.fee_rate_bps as number)) / 10_000);
  if (t.fee_min !== null && t.fee_min !== undefined) fee = Math.max(t.fee_min, fee);
  if (t.fee_max !== null && t.fee_max !== undefined) fee = Math.min(t.fee_max, fee);
  return fee;
}

/**
 * Which agreed terms price a new placement on this vacancy. Returns an error instead of guessing when
 * a commercial decision is outstanding.
 */
export async function resolvePlacementTerms(
  db: any,
  vacancy: { commercial_model?: string | null; partner_subscription_id?: number | null; programme_id?: number | null },
  standard: HireTerms,
  now = new Date(),
): Promise<{ ok: true; terms: PlacementTerms } | { ok: false; error: string }> {
  const model = vacancy.commercial_model || 'STANDARD';

  if (model === 'PARTNER') {
    if (!isFeatureEnabled('HIRING_PARTNER')) return { ok: false, error: 'This is a Hiring Partner vacancy but the Hiring Partner feature is disabled.' };
    const sub = vacancy.partner_subscription_id ? await db.partnerSubscription.findUnique({ where: { id: vacancy.partner_subscription_id } }) : null;
    if (!sub) return { ok: false, error: 'The partner subscription for this vacancy was not found.' };
    if (sub.status !== 'ACTIVE') {
      return { ok: false, error: `The subscription is ${sub.status.toLowerCase().replace('_', ' ')}. How fees apply after cancellation or non-payment is not yet decided; re-classify the vacancy explicitly if needed.` };
    }
    if (sub.fee_rule === 'UNDECIDED') return { ok: false, error: 'This subscription’s fee rule (minimum/maximum for the success fee) is undecided. Record the agreed rule first.' };
    return {
      ok: true,
      terms: {
        commercial_model: 'PARTNER',
        fee_basis: 'PERCENT',
        fee_rate_bps: sub.success_fee_bps,
        fee_min: sub.fee_min,
        fee_max: sub.fee_max,
        fee_flat: null,
        guarantee_days: sub.guarantee_days,
        partner_subscription_id: sub.id,
        programme_terms_id: null,
      },
    };
  }

  if (model === 'PROGRAMME') {
    if (!isFeatureEnabled('BULK_PROGRAMMES')) return { ok: false, error: 'This is a programme vacancy but bulk programmes are disabled.' };
    if (!vacancy.programme_id) return { ok: false, error: 'The programme for this vacancy was not found.' };
    const terms = await db.programmeTerms.findFirst({
      where: { programme_id: vacancy.programme_id, agreed_on: { lte: now } },
      orderBy: [{ agreed_on: 'desc' }, { id: 'desc' }],
    });
    if (!terms) return { ok: false, error: 'No agreed terms are recorded for this programme. Record the accepted terms first.' };
    return {
      ok: true,
      terms: {
        commercial_model: 'PROGRAMME',
        fee_basis: 'FLAT',
        fee_rate_bps: null,
        fee_min: null,
        fee_max: null,
        fee_flat: terms.per_hire_fee,
        guarantee_days: terms.guarantee_days,
        partner_subscription_id: null,
        programme_terms_id: terms.id,
      },
    };
  }

  return {
    ok: true,
    terms: {
      commercial_model: 'STANDARD',
      fee_basis: 'PERCENT',
      fee_rate_bps: standard.feeRateBps,
      fee_min: standard.feeMin,
      fee_max: standard.feeMax,
      fee_flat: null,
      guarantee_days: standard.guaranteeDays,
      partner_subscription_id: null,
      programme_terms_id: null,
    },
  };
}
