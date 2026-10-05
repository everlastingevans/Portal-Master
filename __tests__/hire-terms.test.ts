import {
  DEFAULT_HIRE_TERMS,
  calculatePlacementFee,
  formatRand,
  formatRate,
  guaranteeEndDate,
  parseStoredHireTerms,
  validateHireTerms,
} from '@/lib/hire/terms';
import { buildPlacementUpdate, PlacementState } from '@/lib/hire/ops';

describe('calculatePlacementFee', () => {
  const terms = DEFAULT_HIRE_TERMS; // 7.5%, min R7,500, max R18,000

  it('charges 7.5% of annual CTC inside the band', () => {
    expect(calculatePlacementFee(180_000, terms)).toBe(13_500);
    expect(calculatePlacementFee(200_000, terms)).toBe(15_000);
  });

  it('applies the minimum fee', () => {
    expect(calculatePlacementFee(60_000, terms)).toBe(7_500); // 7.5% = 4,500
    expect(calculatePlacementFee(100_000, terms)).toBe(7_500); // exactly at the boundary
  });

  it('applies the maximum fee', () => {
    expect(calculatePlacementFee(240_000, terms)).toBe(18_000); // exactly at the boundary
    expect(calculatePlacementFee(500_000, terms)).toBe(18_000);
  });

  it('rounds to the nearest rand', () => {
    expect(calculatePlacementFee(123_457, terms)).toBe(9_259); // 9,259.275
  });

  it('rejects invalid CTC', () => {
    expect(() => calculatePlacementFee(0, terms)).toThrow();
    expect(() => calculatePlacementFee(-5, terms)).toThrow();
    expect(() => calculatePlacementFee(150_000.5, terms)).toThrow();
    expect(() => calculatePlacementFee(NaN, terms)).toThrow();
  });
});

describe('validateHireTerms', () => {
  it('accepts the defaults', () => {
    expect(validateHireTerms(DEFAULT_HIRE_TERMS)).toEqual({ ok: true, value: DEFAULT_HIRE_TERMS });
  });

  it('rejects max below min, fractional values and out-of-range values', () => {
    expect(validateHireTerms({ ...DEFAULT_HIRE_TERMS, feeMax: 5000 }).ok).toBe(false);
    expect(validateHireTerms({ ...DEFAULT_HIRE_TERMS, feeRateBps: 7.5 }).ok).toBe(false);
    expect(validateHireTerms({ ...DEFAULT_HIRE_TERMS, feeRateBps: 0 }).ok).toBe(false);
    expect(validateHireTerms({ ...DEFAULT_HIRE_TERMS, guaranteeDays: 400 }).ok).toBe(false);
    expect(validateHireTerms({ ...DEFAULT_HIRE_TERMS, feeMin: '7500' }).ok).toBe(false);
    expect(validateHireTerms(null).ok).toBe(false);
  });

  it('falls back to defaults for missing or corrupt stored settings', () => {
    expect(parseStoredHireTerms(null)).toEqual(DEFAULT_HIRE_TERMS);
    expect(parseStoredHireTerms('not json')).toEqual(DEFAULT_HIRE_TERMS);
    expect(parseStoredHireTerms(JSON.stringify({ feeRateBps: -1 }))).toEqual(DEFAULT_HIRE_TERMS);
    const custom = { feeRateBps: 800, feeMin: 8000, feeMax: 20000, guaranteeDays: 90 };
    expect(parseStoredHireTerms(JSON.stringify(custom))).toEqual(custom);
  });
});

describe('formatting and dates', () => {
  it('formats rand and rates', () => {
    expect(formatRand(7500)).toBe('R7,500');
    expect(formatRand(18000)).toBe('R18,000');
    expect(formatRate(750)).toBe('7.5%');
    expect(formatRate(1000)).toBe('10%');
  });

  it('adds guarantee days to the placement date', () => {
    expect(guaranteeEndDate(new Date('2026-11-02T00:00:00Z'), 60).toISOString().slice(0, 10)).toBe('2027-01-01');
  });
});

describe('buildPlacementUpdate', () => {
  const NOW = new Date('2026-10-05T09:00:00Z');
  const placed = (patch: Partial<PlacementState> = {}): PlacementState => ({
    start_date: new Date('2026-09-01T00:00:00Z'),
    annual_ctc: 180_000,
    fee_rate_bps: 750,
    fee_min: 7500,
    fee_max: 18000,
    guarantee_days: 60,
    placement_fee: 13_500,
    invoice_status: 'NOT_INVOICED',
    invoiced_at: null,
    paid_at: null,
    check_30_outcome: null,
    check_60_outcome: null,
    check_90_outcome: null,
    ...patch,
  });

  it('recalculates the fee with the placement’s own snapshotted terms and ignores client fee fields', () => {
    const r = buildPlacementUpdate(placed({ fee_rate_bps: 1000, fee_max: 30_000 }), { annual_ctc: '200000', placement_fee: 1 }, NOW);
    expect(r.ok && r.data.placement_fee).toBe(20_000); // 10% snapshot, not today's 7.5%
  });

  it('moves the guarantee end date with the start date', () => {
    const r = buildPlacementUpdate(placed(), { start_date: '2026-11-02' }, NOW);
    expect(r.ok && (r.data.guarantee_end_date as Date).toISOString().slice(0, 10)).toBe('2027-01-01');
  });

  it('records invoice dates and events once', () => {
    const r = buildPlacementUpdate(placed(), { invoice_status: 'PAID' }, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.invoiced_at).toEqual(NOW);
    expect(r.data.paid_at).toEqual(NOW);
    expect(r.events).toEqual(['FEE_INVOICED', 'FEE_PAID']);
    const same = buildPlacementUpdate(placed({ invoice_status: 'PAID' }), { invoice_status: 'PAID' }, NOW);
    expect(same.ok && same.events).toEqual([]);
  });

  it('only confirms "still employed" once a check is due, but records departures any time', () => {
    // started 1 Sep: 30-day check due 1 Oct (passed), 60-day due 31 Oct (not yet)
    expect(buildPlacementUpdate(placed(), { check_30_outcome: 'RETAINED' }, NOW).ok).toBe(true);
    expect(buildPlacementUpdate(placed(), { check_60_outcome: 'RETAINED' }, NOW).ok).toBe(false);
    const left = buildPlacementUpdate(placed(), { check_60_outcome: 'LEFT_VOLUNTARY' }, NOW);
    expect(left.ok && left.data.check_60_at).toEqual(NOW);
    const cleared = buildPlacementUpdate(placed({ check_30_outcome: 'RETAINED' }), { check_30_outcome: '' }, NOW);
    expect(cleared.ok && cleared.data.check_30_outcome).toBeNull();
  });

  it('rejects invalid values', () => {
    expect(buildPlacementUpdate(placed(), { annual_ctc: '12.5' }, NOW).ok).toBe(false);
    expect(buildPlacementUpdate(placed(), { invoice_status: 'MAYBE' }, NOW).ok).toBe(false);
    expect(buildPlacementUpdate(placed(), { check_90_outcome: 'FINE' }, NOW).ok).toBe(false);
  });
});
