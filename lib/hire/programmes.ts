/**
 * Bulk hiring programmes. Tier boundaries are configurable; overlapping tiers are detected and
 * reported, never silently resolved. Accepted terms are appended (ProgrammeTerms) and apply only to
 * placements recorded after they were agreed.
 */
import { EMAIL_RE, ROLE_CATEGORIES } from './vacancy';

export interface ProgrammeTier {
  label: string;
  minHires: number;
  maxHires: number | null; // null = no upper bound
  perHireFee: number | null; // null = custom quote
}

export const PROGRAMME_TIERS_SETTING_KEY = 'programme_tiers';

/** As proposed in the brief. Note the overlap at exactly 25 hires, which needs a decision. */
export const DEFAULT_PROGRAMME_TIERS: ProgrammeTier[] = [
  { label: '5–10 hires', minHires: 5, maxHires: 10, perHireFee: 6000 },
  { label: '11–25 hires', minHires: 11, maxHires: 25, perHireFee: 4500 },
  { label: '25+ hires', minHires: 25, maxHires: null, perHireFee: null },
];

export const PROGRAMME_STATUSES = [
  { value: 'ENQUIRY', label: 'Enquiry' },
  { value: 'SCOPING', label: 'Scoping' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'AGREED', label: 'Agreed' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

export function validateTiers(input: unknown): { ok: true; tiers: ProgrammeTier[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0 || input.length > 10) return { ok: false, error: 'Provide between 1 and 10 tiers.' };
  const tiers: ProgrammeTier[] = [];
  for (const t of input as Record<string, unknown>[]) {
    const label = String(t?.label ?? '').trim().slice(0, 40);
    const min = t?.minHires;
    const max = t?.maxHires ?? null;
    const fee = t?.perHireFee ?? null;
    if (!label) return { ok: false, error: 'Every tier needs a label.' };
    if (!isInt(min) || min < 1) return { ok: false, error: `${label}: minimum hires must be a whole number of at least 1.` };
    if (max !== null && (!isInt(max) || max < min)) return { ok: false, error: `${label}: maximum must be at least the minimum, or empty for no upper limit.` };
    if (fee !== null && (!isInt(fee) || fee < 0)) return { ok: false, error: `${label}: fee must be a whole rand amount, or empty for a custom quote.` };
    tiers.push({ label, minHires: min, maxHires: max as number | null, perHireFee: fee as number | null });
  }
  return { ok: true, tiers: tiers.sort((a, b) => a.minHires - b.minHires) };
}

/** Hire counts that fall into more than one tier (e.g. 25 with the default tiers). */
export function findTierOverlaps(tiers: ProgrammeTier[]) {
  const overlaps: { a: string; b: string; from: number; to: number | null }[] = [];
  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const a = tiers[i];
      const b = tiers[j];
      const from = Math.max(a.minHires, b.minHires);
      const aMax = a.maxHires ?? Infinity;
      const bMax = b.maxHires ?? Infinity;
      const to = Math.min(aMax, bMax);
      if (from <= to) overlaps.push({ a: a.label, b: b.label, from, to: to === Infinity ? null : to });
    }
  }
  return overlaps;
}

/** Tiers that match a hire count. More than one match means a decision is needed; none means no tier. */
export function suggestTiers(targetHires: number, tiers: ProgrammeTier[]) {
  const matches = tiers.filter((t) => targetHires >= t.minHires && (t.maxHires === null || targetHires <= t.maxHires));
  return { matches, ambiguous: matches.length > 1, none: matches.length === 0 };
}

export function parseTiersSetting(stored?: string | null): ProgrammeTier[] {
  if (!stored) return DEFAULT_PROGRAMME_TIERS;
  try {
    const r = validateTiers(JSON.parse(stored));
    return r.ok ? r.tiers : DEFAULT_PROGRAMME_TIERS;
  } catch {
    return DEFAULT_PROGRAMME_TIERS;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Public "Talk to LaunchPath" enquiry. */
export function parseProgrammeEnquiry(raw: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const companyName = text(raw.companyName, 160);
  const contactName = text(raw.contactName, 120);
  const workEmail = text(raw.workEmail, 200).toLowerCase();
  const phone = text(raw.phone, 40);
  const targetHires = Number(raw.targetHires);
  const categories = (Array.isArray(raw.roleCategories) ? raw.roleCategories : []).map(String).filter((c) => ROLE_CATEGORIES.some((r) => r.value === c));
  const locations = text(raw.locations, 300);
  const requirements = String(raw.requirements ?? '').trim().slice(0, 4000);
  const startBy = text(raw.startBy, 10);
  const submissionKey = text(raw.submissionKey, 64);

  if (companyName.length < 2) errors.companyName = 'Please enter your company name.';
  if (contactName.length < 2) errors.contactName = 'Please enter your name.';
  if (!EMAIL_RE.test(workEmail)) errors.workEmail = 'Please enter a valid work email address.';
  if (phone && phone.replace(/\D/g, '').length < 9) errors.phone = 'Please enter a valid phone number.';
  if (!Number.isInteger(targetHires) || targetHires < 2 || targetHires > 5000) errors.targetHires = 'Enter roughly how many people you want to hire.';
  if (requirements.length < 20) errors.requirements = 'Tell us a little about the roles (at least 20 characters).';
  let start: Date | null = null;
  if (startBy) {
    start = /^\d{4}-\d{2}-\d{2}$/.test(startBy) ? new Date(`${startBy}T00:00:00Z`) : null;
    if (!start || Number.isNaN(start.getTime())) errors.startBy = 'Please enter a valid date.';
  }
  if (!UUID_RE.test(submissionKey)) errors.form = 'Please refresh the page and try again.';
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, data: { companyName, contactName, workEmail, phone: phone || null, targetHires, categories, locations: locations || null, requirements, start, submissionKey } };
}

/** Staff recording accepted terms. Always explicit: the tier is chosen, not inferred from the target. */
export function parseProgrammeTerms(raw: Record<string, unknown>, tiers: ProgrammeTier[]) {
  const errors: Record<string, string> = {};
  const model = String(raw.pricing_model ?? '');
  if (!['TIER', 'CUSTOM_QUOTE'].includes(model)) errors.pricing_model = 'Choose a tier or a custom quote.';
  const tierLabel = model === 'TIER' ? String(raw.tier_label ?? '') : null;
  const tier = tierLabel ? tiers.find((t) => t.label === tierLabel) : null;
  if (model === 'TIER' && !tier) errors.tier_label = 'Choose a configured tier.';
  if (model === 'TIER' && tier && tier.perHireFee === null) errors.tier_label = 'That tier is a custom quote; record it as a custom quote.';
  const fee = Number(String(raw.per_hire_fee ?? '').replace(/[\sR,]/gi, ''));
  if (!Number.isInteger(fee) || fee < 0 || fee > 1_000_000) errors.per_hire_fee = 'Enter the agreed fee per successful hire in whole rand.';
  const guarantee = Number(raw.guarantee_days);
  if (!Number.isInteger(guarantee) || guarantee < 0 || guarantee > 365) errors.guarantee_days = 'Enter the agreed guarantee in days (0 if none).';
  const agreedOn = typeof raw.agreed_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.agreed_on) ? new Date(`${raw.agreed_on}T00:00:00Z`) : null;
  if (!agreedOn) errors.agreed_on = 'Enter the date the terms were accepted.';
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    data: {
      pricing_model: model,
      tier_label: tierLabel,
      per_hire_fee: fee,
      guarantee_days: guarantee,
      agreed_on: agreedOn as Date,
      note: String(raw.note ?? '').trim().slice(0, 2000) || null,
      // Recorded so staff can see when the agreed fee differs from the configured tier price
      differsFromTier: Boolean(tier && tier.perHireFee !== null && tier.perHireFee !== fee),
    },
  };
}

/** Progress and money for one programme from its linked vacancies and placements. */
export function summariseProgramme(p: { target_hires: number; vacancies: any[] }) {
  const placements = p.vacancies.flatMap((v) => v.placements || []);
  const shortlisted = p.vacancies.reduce((a, v) => a + (v.shortlists || []).reduce((b: number, s: any) => b + (s.candidates?.length || 0), 0), 0);
  const sum = (xs: any[]) => xs.reduce((a, x) => a + (x.placement_fee || 0), 0);
  const invoiced = placements.filter((x) => ['INVOICED', 'PAID'].includes(x.invoice_status));
  const paid = placements.filter((x) => x.invoice_status === 'PAID');
  return {
    linkedVacancies: p.vacancies.length,
    shortlistedCandidates: shortlisted,
    placements: placements.length,
    remainingToTarget: Math.max(0, p.target_hires - placements.length),
    fees: { total: sum(placements), notInvoiced: sum(placements.filter((x) => x.invoice_status === 'NOT_INVOICED')), invoiced: sum(invoiced), paid: sum(paid) },
  };
}
