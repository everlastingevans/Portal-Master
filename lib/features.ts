/**
 * Feature flags for Phase 3 functionality awaiting commercial validation. All default to OFF and are
 * read from the server environment at call time (so they can't be switched on from a browser).
 * Set e.g. FEATURE_HIRING_PARTNER=true in .env.local to enable for development.
 */
export const FEATURES = {
  HIRING_PARTNER: {
    env: 'FEATURE_HIRING_PARTNER',
    label: 'Hiring Partner (internal admin)',
    description: 'Partner plan versions, company subscriptions in manual mode, partner vacancies and the reduced success fee.',
  },
  PARTNER_BILLING_SANDBOX: {
    env: 'FEATURE_PARTNER_BILLING_SANDBOX',
    label: 'Hiring Partner billing (PayFast sandbox)',
    description: 'Sandbox subscription checkout links and the verified PayFast notification endpoint. Never charges real money.',
  },
  BULK_PROGRAMMES: {
    env: 'FEATURE_BULK_PROGRAMMES',
    label: 'Bulk hiring programmes (internal admin)',
    description: 'Programme tracking, agreed terms, linked vacancies and per-hire programme fees.',
  },
  BULK_ENQUIRY_PUBLIC: {
    env: 'FEATURE_BULK_ENQUIRY_PUBLIC',
    label: 'Bulk hiring public enquiry page',
    description: 'The public /hire/bulk “Talk to LaunchPath” page and enquiry form.',
  },
  BULK_PRICING_PUBLIC: {
    env: 'FEATURE_BULK_PRICING_PUBLIC',
    label: 'Show bulk tier prices publicly',
    description: 'Shows the configured per-hire tier prices on the enquiry page.',
  },
  EMPLOYER_DASHBOARD: {
    env: 'FEATURE_EMPLOYER_DASHBOARD',
    label: 'Employer hiring dashboard',
    description: 'Company members can view sent shortlists, request interviews and give feedback in the employer portal.',
  },
  MATCH_SUGGESTIONS: {
    env: 'FEATURE_MATCH_SUGGESTIONS',
    label: 'Candidate match suggestions (internal)',
    description: 'Explainable candidate suggestions for recruiters on the vacancy page. Recruiter review is always required.',
    defaultOn: true,
  },
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  const f = FEATURES[key] as { env: string; defaultOn?: boolean };
  const raw = process.env[f.env];
  if (raw === undefined || raw === '') return Boolean(f.defaultOn);
  return raw === 'true' || raw === '1';
}

export function featureStatus() {
  return (Object.keys(FEATURES) as FeatureKey[]).map((key) => ({ key, ...FEATURES[key], enabled: isFeatureEnabled(key) }));
}

/**
 * Commercial decisions the brief leaves open. The code never assumes an answer: each blocks or
 * requires an explicit per-agreement choice until resolved. Shown on the admin setup page.
 */
export const PENDING_DECISIONS = [
  {
    key: 'partner_fee_min_max',
    feature: 'HIRING_PARTNER',
    question: 'Does the standard placement minimum (R7,500) and maximum (R18,000) apply to the 3.5% Hiring Partner success fee?',
    handling: 'Each plan version and subscription stores a fee rule (standard min/max, no min/max, or custom). Partner placement fees are refused while the rule is “undecided”.',
  },
  {
    key: 'partner_vat',
    feature: 'HIRING_PARTNER',
    question: 'Is R4,999 per month VAT-inclusive or VAT-exclusive (and is LaunchPath VAT-registered)?',
    handling: 'Stored per plan and subscription as “undecided”; checkout amount is the stored price with no VAT added.',
  },
  {
    key: 'partner_cancellation',
    feature: 'HIRING_PARTNER',
    question: 'On cancellation: notice period, refunds, and what happens to partner vacancies already in progress (fee rate, guarantee, priority)?',
    handling: 'Cancelled subscriptions keep their vacancies linked but partner placement fees are refused until staff explicitly re-classify the vacancy.',
  },
  {
    key: 'partner_overdue',
    feature: 'HIRING_PARTNER',
    question: 'How are overdue accounts treated (grace period, suspension of entitlements, interest)?',
    handling: 'A failed payment marks the subscription PAST_DUE. New partner vacancies require ACTIVE status; nothing else changes automatically.',
  },
  {
    key: 'partner_active_vacancy',
    feature: 'HIRING_PARTNER',
    question: 'What counts as one of the “three active vacancies”? (Implemented: a partner vacancy counts from submission until it is hired or closed.)',
    handling: 'One definition, in lib/hire/partner.ts (countsTowardLimit). Change it there once confirmed.',
  },
  {
    key: 'partner_guarantee',
    feature: 'HIRING_PARTNER',
    question: 'Does the replacement guarantee apply to Hiring Partner placements, and for how long?',
    handling: 'Guarantee days are stored per plan and subscription (indicative default 60) and copied to each placement.',
  },
  {
    key: 'bulk_tier_overlap',
    feature: 'BULK_PROGRAMMES',
    question: 'The proposed tiers overlap at exactly 25 hires (11–25 at R4,500 and 25+ custom). Which applies at 25?',
    handling: 'Tier boundaries are configurable. Overlaps are detected and shown; staff must choose and record the agreed terms explicitly.',
  },
  {
    key: 'bulk_below_minimum',
    feature: 'BULK_PROGRAMMES',
    question: 'How are programmes that end up with fewer than 5 hires priced?',
    handling: 'No rule is applied. Each placement uses the programme terms agreed at the time; staff record any change as new terms.',
  },
  {
    key: 'bulk_guarantee_tax',
    feature: 'BULK_PROGRAMMES',
    question: 'Do programme per-hire fees include VAT, and does the replacement guarantee apply to programme hires?',
    handling: 'Guarantee days and notes are recorded with each agreed set of terms.',
  },
] as const;
