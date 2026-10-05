/**
 * LaunchPath Hire commercial terms: pure, dependency-free helpers so they can run on the server,
 * in tests and (for display only) on the client. Fees are always calculated on the server.
 */

export interface HireTerms {
  /** Placement fee as basis points of annual CTC (750 = 7.5%) */
  feeRateBps: number;
  /** Minimum placement fee in ZAR */
  feeMin: number;
  /** Maximum placement fee in ZAR */
  feeMax: number;
  /** Replacement guarantee length in days */
  guaranteeDays: number;
}

export const DEFAULT_HIRE_TERMS: HireTerms = {
  feeRateBps: 750,
  feeMin: 7500,
  feeMax: 18000,
  guaranteeDays: 60,
};

export const HIRE_TERMS_SETTING_KEY = 'hire_terms';

type Result<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const isWholeNumber = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** Validates a full set of terms. Rejects anything that is not a whole number in a sane range. */
export function validateHireTerms(input: unknown): Result<HireTerms> {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!isWholeNumber(raw.feeRateBps) || raw.feeRateBps < 1 || raw.feeRateBps > 5000) {
    errors.feeRateBps = 'Fee rate must be between 0.01% and 50%.';
  }
  if (!isWholeNumber(raw.feeMin) || raw.feeMin < 0 || raw.feeMin > 1_000_000) {
    errors.feeMin = 'Minimum fee must be a whole rand amount between R0 and R1,000,000.';
  }
  if (!isWholeNumber(raw.feeMax) || raw.feeMax < 1 || raw.feeMax > 1_000_000) {
    errors.feeMax = 'Maximum fee must be a whole rand amount between R1 and R1,000,000.';
  }
  if (!errors.feeMin && !errors.feeMax && (raw.feeMax as number) < (raw.feeMin as number)) {
    errors.feeMax = 'Maximum fee cannot be lower than the minimum fee.';
  }
  if (!isWholeNumber(raw.guaranteeDays) || raw.guaranteeDays < 0 || raw.guaranteeDays > 365) {
    errors.guaranteeDays = 'Guarantee must be between 0 and 365 days.';
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      feeRateBps: raw.feeRateBps as number,
      feeMin: raw.feeMin as number,
      feeMax: raw.feeMax as number,
      guaranteeDays: raw.guaranteeDays as number,
    },
  };
}

/** Parses a stored settings value, falling back to defaults if it is missing or invalid. */
export function parseStoredHireTerms(stored?: string | null): HireTerms {
  if (!stored) return DEFAULT_HIRE_TERMS;
  try {
    const parsed = validateHireTerms(JSON.parse(stored));
    return parsed.ok ? parsed.value : DEFAULT_HIRE_TERMS;
  } catch {
    return DEFAULT_HIRE_TERMS;
  }
}

/**
 * Placement fee in whole rand: rate × annual CTC, rounded to the nearest rand, then clamped to
 * the minimum and maximum. Throws on a non-positive or non-integer CTC.
 */
export function calculatePlacementFee(annualCtc: number, terms: Pick<HireTerms, 'feeRateBps' | 'feeMin' | 'feeMax'>): number {
  if (!isWholeNumber(annualCtc) || annualCtc <= 0) {
    throw new Error('Annual CTC must be a positive whole rand amount.');
  }
  const raw = Math.round((annualCtc * terms.feeRateBps) / 10_000);
  return Math.min(terms.feeMax, Math.max(terms.feeMin, raw));
}

/** Last day of cover: placement date + guarantee days (UTC calendar days). */
export function guaranteeEndDate(placementDate: Date, guaranteeDays: number): Date {
  const end = new Date(Date.UTC(placementDate.getUTCFullYear(), placementDate.getUTCMonth(), placementDate.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + guaranteeDays);
  return end;
}

export const formatRand = (amount: number) => `R${new Intl.NumberFormat('en-ZA').format(amount).replace(/ /g, ',').replace(/\s/g, ',')}`;

/** "7.5%" from 750 basis points */
export const formatRate = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;
