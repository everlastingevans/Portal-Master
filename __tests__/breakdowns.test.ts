import { BreakdownInput, computeBreakdowns } from '@/lib/hire/breakdowns';

const NOW = new Date('2026-10-05T12:00:00Z');
const d = (s: string) => new Date(`${s}T09:00:00Z`);
const vac = (id: number, created: string, cat: string, lead: number, over: Partial<BreakdownInput['vacancies'][number]> = {}) => ({
  id,
  created_at: d(created),
  status: 'SOURCING',
  role_category: cat,
  lead_id: lead,
  lead_name: `Lead ${lead}`,
  company_id: null,
  company_name: null,
  ...over,
});
const placement = (vacancy_id: number, over: Partial<BreakdownInput['placements'][number]> = {}) => ({
  vacancy_id,
  start_date: d('2026-06-01'),
  created_at: d('2026-05-25'),
  placement_fee: 10_000,
  invoice_status: 'NOT_INVOICED',
  invoiced_at: null,
  paid_at: null,
  commercial_model: 'STANDARD',
  check_30_outcome: null,
  check_60_outcome: null,
  check_90_outcome: null,
  ...over,
});

const input: BreakdownInput = {
  vacancies: [
    vac(1, '2026-05-04', 'SALES', 1, { status: 'CHECK_90', company_id: 9, company_name: 'Acme (verified)' }),
    vac(2, '2026-05-11', 'SALES', 1, { status: 'HIRED', company_id: 9, company_name: 'Acme (verified)' }),
    vac(3, '2026-06-01', 'FINANCE', 2),
    vac(4, '2026-09-28', 'FINANCE', 3, { status: 'CLOSED_NO_HIRE' }),
  ],
  shortlists: [
    { vacancy_id: 1, sent_at: d('2026-05-08') },
    { vacancy_id: 2, sent_at: d('2026-05-18') },
    { vacancy_id: 3, sent_at: d('2026-06-10') },
  ],
  interviewRequests: [{ vacancy_id: 1 }, { vacancy_id: 2 }],
  entries: [
    { vacancy_id: 1, offer_status: 'ACCEPTED', offer_made_at: d('2026-05-20'), offer_responded_at: d('2026-05-22') },
    { vacancy_id: 2, offer_status: 'ACCEPTED', offer_made_at: d('2026-09-01'), offer_responded_at: d('2026-09-03') },
  ],
  placements: [
    placement(1, { invoice_status: 'PAID', invoiced_at: d('2026-06-05'), paid_at: d('2026-07-01'), check_30_outcome: 'RETAINED', check_60_outcome: 'RETAINED' }),
    placement(2, { start_date: d('2026-09-15'), created_at: d('2026-09-05'), placement_fee: 7_500, invoice_status: 'INVOICED', invoiced_at: d('2026-09-20'), commercial_model: 'PARTNER' }),
  ],
  billingEvents: [
    { provider: 'MANUAL', outcome: 'APPLIED', payment_status: 'COMPLETE', amount_cents: 499_900, received_at: d('2026-09-01') },
    { provider: 'PAYFAST_SANDBOX', outcome: 'APPLIED', payment_status: 'COMPLETE', amount_cents: 499_900, received_at: d('2026-09-02') },
  ],
};

describe('computeBreakdowns', () => {
  const b = computeBreakdowns(input, { now: NOW, windowDays: 365 });

  it('groups by role category with conversions and time to hire', () => {
    const sales = b.byCategory.find((g) => g.key === 'SALES')!;
    expect(sales).toMatchObject({ label: 'Sales', vacancies: 2, placements: 2, smallSample: true });
    expect(sales.shortlistToInterview).toMatchObject({ numerator: 2, denominator: 2 });
    expect(sales.vacancyToHire).toMatchObject({ numerator: 2, denominator: 2 });
    expect(sales.medianDaysToHire).toBe(66.5); // median of 18 and 115 days
    const finance = b.byCategory.find((g) => g.key === 'FINANCE')!;
    expect(finance.shortlistToInterview).toMatchObject({ value: 0, denominator: 1 });
    expect(finance.interviewToOffer.value).toBeNull(); // no data, not 0%
    expect(finance.medianDaysToHire).toBeNull();
    expect(finance.stillOpen).toBe(1);
  });

  it('separates invoiced from paid revenue', () => {
    const sales = b.byCategory.find((g) => g.key === 'SALES')!;
    expect(sales.revenue).toEqual({ notInvoiced: 0, invoiced: 17_500, paid: 10_000 });
    expect(b.revenue).toMatchObject({ placementFeesInvoicedInWindow: 17_500, placementFeesPaidInWindow: 10_000, outstandingInvoiced: 7_500, notYetInvoiced: 0, subscriptionPaymentsRecorded: 4999, sandboxTestPayments: 4999 });
    expect(b.revenue.byModel.find((m) => m.model === 'PARTNER')).toEqual({ model: 'PARTNER', invoiced: 7_500, paid: 0 });
  });

  it('excludes immature placements from retention denominators', () => {
    const sales = b.byCategory.find((g) => g.key === 'SALES')!;
    expect(sales.retention60).toMatchObject({ eligible: 1, value: 1, notYetDue: 1 }); // placement 2 started 15 Sep
    expect(sales.retention90).toMatchObject({ eligible: 1, unknownOrNotChecked: 1, value: null }); // due but not checked
  });

  it('groups employers by verified company, else marks the submitted name as unverified, and tracks repeats', () => {
    expect(b.byEmployer.map((g) => g.label).sort()).toEqual(['Acme (verified)', 'Lead 2 (unverified)', 'Lead 3 (unverified)']);
    expect(b.byEmployer.find((g) => g.label === 'Acme (verified)')!.repeatEmployers).toMatchObject({ numerator: 1, denominator: 1 });
  });

  it('builds monthly cohorts, newest first, respecting the window', () => {
    expect(b.byCohort.map((g) => g.key)).toEqual(['2026-09', '2026-06', '2026-05']);
    const recent = computeBreakdowns(input, { now: NOW, windowDays: 30 });
    expect(recent.byCohort.map((g) => g.key)).toEqual(['2026-09']);
    expect(recent.revenue.placementFeesPaidInWindow).toBe(0);
  });
});
